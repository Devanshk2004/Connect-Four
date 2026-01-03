const Game = require('./game');
const Bot = require('./bot');
const { saveGame, getLeaderboard } = require('./db');
const { emitGameEnd } = require('./kafka');

class GameManager {
    constructor(io) {
        this.io = io;
        this.queue = []; // Array of { socket, username, timeoutId }
        this.games = new Map(); // gameId -> Game instance
        this.socketToGame = new Map(); // socketId -> gameId
        this.userToGame = new Map(); // username -> { gameId, side }
        this.disconnectTimers = new Map(); // username -> timeoutId

        this.setupHandlers();
    }

    setupHandlers() {
        this.io.on('connection', (socket) => {
            console.log('User connected:', socket.id);

            socket.on('join_queue', ({ username }) => this.handleJoinQueue(socket, username));
            socket.on('make_move', (data) => this.handleMove(socket, data));
            socket.on('reconnect_game', ({ username }) => this.handleReconnect(socket, username));
            socket.on('disconnect', () => this.handleDisconnect(socket));
            socket.on('get_leaderboard', async () => socket.emit('leaderboard_update', await getLeaderboard()));
        });
    }

    handleJoinQueue(socket, username) {
        // Validation: Check if already in game
        if (this.userToGame.has(username)) {
            // Logic handled in reconnect, but good to check
            socket.emit('error', { message: 'User already in a game. Try reconnecting.' });
            return;
        }

        // Store username on socket for convenience
        socket.data.username = username;

        if (this.queue.find(p => p.username === username)) {
            socket.emit('error', { message: 'Already in queue' });
            return;
        }

        if (this.queue.length > 0) {
            // Match found
            const opponent = this.queue.shift();
            clearTimeout(opponent.timeoutId); // Cancel bot timer for opponent

            if (opponent.socket.connected) {
                this.startGame(opponent.socket, socket, opponent.username, username);
            } else {
                // Opponent disconnected while in queue, put current user back
                this.handleJoinQueue(socket, username);
            }
        } else {
            // Add to queue with 10s bot timeout
            const timeoutId = setTimeout(() => {
                this.startBotGame(socket, username);
            }, 10000);

            this.queue.push({ socket, username, timeoutId });
            socket.emit('queue_joined', { message: 'Waiting for opponent...' });
        }
    }

    startGame(socket1, socket2, name1, name2) {
        const game = new Game(name1, name2);
        this.games.set(game.gameId, game);

        // Map sockets and users
        this.socketToGame.set(socket1.id, game.gameId);
        this.socketToGame.set(socket2.id, game.gameId);
        this.userToGame.set(name1, { gameId: game.gameId, side: 'player1' });
        this.userToGame.set(name2, { gameId: game.gameId, side: 'player2' });

        // Join room
        socket1.join(game.gameId);
        socket2.join(game.gameId);

        const gameState = game.getState();
        this.io.to(game.gameId).emit('game_start', {
            gameId: game.gameId,
            players: { player1: name1, player2: name2 },
            turn: gameState.turn
        });

        console.log(`Game started: ${name1} vs ${name2} (${game.gameId})`);
    }

    startBotGame(socket, username) {
        // Remove from queue
        this.queue = this.queue.filter(p => p.username !== username);

        const botName = 'Bot_AI';
        const game = new Game(username, botName);
        game.isBotGame = true;
        this.games.set(game.gameId, game);

        this.socketToGame.set(socket.id, game.gameId);
        this.userToGame.set(username, { gameId: game.gameId, side: 'player1' });

        // We don't map bot user, just game state

        socket.join(game.gameId);

        const gameState = game.getState();
        socket.emit('game_start', {
            gameId: game.gameId,
            players: { player1: username, player2: botName },
            turn: gameState.turn
        });

        console.log(`Bot Game started for ${username}`);
    }

    handleMove(socket, { col }) {
        const gameId = this.socketToGame.get(socket.id);
        if (!gameId) return;

        const game = this.games.get(gameId);
        if (!game) return;

        const username = socket.data.username;
        const result = game.makeMove(username, col);

        if (result.error) {
            socket.emit('move_error', { message: result.error });
            return;
        }

        this.io.to(gameId).emit('move_made', {
            row: result.row,
            col: result.col,
            player: username,
            nextTurn: game.getCurrentPlayer()
        });

        if (result.winner || result.isDraw) {
            this.endGame(game, result.winner, result.isDraw);
        } else if (game.isBotGame && game.getCurrentPlayer() === 'Bot_AI') {
            // Bot Move
            setTimeout(() => {
                const botMoveCol = Bot.findMove(game.board, 'Bot_AI', username);
                const botResult = game.makeMove('Bot_AI', botMoveCol);

                this.io.to(gameId).emit('move_made', {
                    row: botResult.row,
                    col: botResult.col,
                    player: 'Bot_AI',
                    nextTurn: username
                });

                if (botResult.winner || botResult.isDraw) {
                    this.endGame(game, botResult.winner, botResult.isDraw);
                }
            }, 500);
        }
    }

    endGame(game, winner, isDraw) {
        this.io.to(game.gameId).emit('game_over', { winner, isDraw });

        // Save to DB
        saveGame({
            gameId: game.gameId,
            players: game.players,
            winner: winner,
            isDraw: isDraw,
            startTime: game.startTime,
            movesCount: game.moves.length
        });

        // Emit Kafka Event
        emitGameEnd({
            gameId: game.gameId,
            winner: winner,
            players: game.players
        });

        // Cleanup
        this.games.delete(game.gameId);
        game.players.forEach(p => {
            if (p !== 'Bot_AI') this.userToGame.delete(p);
        });

        // We don't verify disconnects for finished games
    }

    handleDisconnect(socket) {
        const username = socket.data.username;
        if (!username) return;

        console.log(`User disconnected: ${username}`);

        // 1. If in queue, remove
        const queueIdx = this.queue.findIndex(p => p.username === username);
        if (queueIdx !== -1) {
            clearTimeout(this.queue[queueIdx].timeoutId);
            this.queue.splice(queueIdx, 1);
            return;
        }

        // 2. If in active game, set forfeit timer
        const gameInfo = this.userToGame.get(username);
        if (gameInfo) {
            const gameId = gameInfo.gameId;
            const game = this.games.get(gameId);

            if (game) {
                // Notify opponent
                this.io.to(gameId).emit('player_disconnected', { username });

                // 30s Reconnect Timer
                const timeoutId = setTimeout(() => {
                    this.handleForfeit(username, gameId);
                }, 30000);

                this.disconnectTimers.set(username, timeoutId);
            }
        }
    }

    handleReconnect(socket, username) {
        console.log(`Attempting reconnect: ${username}`);
        socket.data.username = username;

        // Check for active disconnect timer
        if (this.disconnectTimers.has(username)) {
            clearTimeout(this.disconnectTimers.get(username));
            this.disconnectTimers.delete(username);

            const gameInfo = this.userToGame.get(username);
            if (gameInfo && this.games.has(gameInfo.gameId)) {
                // Rejoin game
                const game = this.games.get(gameInfo.gameId);
                socket.join(gameInfo.gameId);
                this.socketToGame.set(socket.id, gameInfo.gameId); // Update socket map

                socket.emit('reconnect_success', {
                    gameId: game.gameId,
                    state: game.getState()
                });

                this.io.to(gameInfo.gameId).emit('player_reconnected', { username });
                return;
            }
        }

        socket.emit('error', { message: 'No active game found to reconnect to.' });
    }

    handleForfeit(username, gameId) {
        const game = this.games.get(gameId);
        if (!game) return;

        this.disconnectTimers.delete(username);

        const winner = game.players.find(p => p !== username);

        // End game as forfeit
        this.io.to(gameId).emit('game_over', {
            winner: winner,
            reason: 'Opponent forfeited by disconnection'
        });

        this.endGame(game, winner, false);
    }
}

module.exports = GameManager;
