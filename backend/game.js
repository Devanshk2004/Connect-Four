const { v4: uuidv4 } = require('uuid');

const ROWS = 6;
const COLS = 7;

class Game {
    constructor(player1Id, player2Id) {
        this.gameId = uuidv4();
        this.players = [player1Id, player2Id];
        this.board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null)); // 6 rows, 7 cols
        this.turnIndex = 0; // 0 for player1, 1 for player2
        this.winner = null;
        this.isDraw = false;
        this.moves = [];
        this.startTime = Date.now();
    }

    getCurrentPlayer() {
        return this.players[this.turnIndex];
    }

    makeMove(playerId, colIndex) {
        if (this.winner || this.isDraw) return { error: 'Game over' };
        if (playerId !== this.players[this.turnIndex]) return { error: 'Not your turn' };
        if (colIndex < 0 || colIndex >= COLS) return { error: 'Invalid column' };

        // Find the lowest empty row in the column
        let rowIndex = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (this.board[r][colIndex] === null) {
                rowIndex = r;
                break;
            }
        }

        if (rowIndex === -1) return { error: 'Column full' };

        this.board[rowIndex][colIndex] = playerId;
        this.moves.push({ playerId, row: rowIndex, col: colIndex, timestamp: Date.now() });

        if (this.checkWin(rowIndex, colIndex, playerId)) {
            this.winner = playerId;
        } else if (this.checkDraw()) {
            this.isDraw = true;
        } else {
            this.turnIndex = 1 - this.turnIndex; // Switch turn
        }

        return { success: true, row: rowIndex, col: colIndex, winner: this.winner, isDraw: this.isDraw };
    }

    checkWin(row, col, playerId) {
        // Directions: [rowDelta, colDelta]
        const directions = [
            [0, 1],  // Horizontal
            [1, 0],  // Vertical
            [1, 1],  // Diagonal /
            [1, -1]  // Diagonal \
        ];

        for (const [dr, dc] of directions) {
            let count = 1;

            // Check positive direction
            for (let i = 1; i < 4; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS && this.board[r][c] === playerId) {
                    count++;
                } else {
                    break;
                }
            }

            // Check negative direction
            for (let i = 1; i < 4; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS && this.board[r][c] === playerId) {
                    count++;
                } else {
                    break;
                }
            }

            if (count >= 4) return true;
        }

        return false;
    }

    checkDraw() {
        return this.board[0].every(cell => cell !== null);
    }

    getState() {
        return {
            gameId: this.gameId,
            players: this.players,
            board: this.board,
            turn: this.getCurrentPlayer(),
            winner: this.winner,
            isDraw: this.isDraw
        };
    }
}

module.exports = Game;
