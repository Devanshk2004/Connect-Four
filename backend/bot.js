const ROWS = 6;
const COLS = 7;

class Bot {
    constructor() {
        this.delay = 500; // Simulated thinking time
    }

    // Determine the best move for the bot
    // botId: 'player2' (usually)
    // opponentId: 'player1'
    findMove(board, botId, opponentId) {
        // 1. Check for winning move
        let winningMove = this.findWinningMove(board, botId);
        if (winningMove !== -1) return winningMove;

        // 2. Check for blocking move (prevent opponent from winning)
        let blockingMove = this.findWinningMove(board, opponentId);
        if (blockingMove !== -1) return blockingMove;

        // 3. Strategic/Heuristic move (prioritize center, then random valid)
        // Center columns are generally more valuable
        const centerOrder = [3, 2, 4, 1, 5, 0, 6];
        for (let col of centerOrder) {
            if (this.isValidMove(board, col)) {
                return col;
            }
        }

        return -1; // Should not happen unless board is full
    }

    isValidMove(board, col) {
        return board[0][col] === null;
    }

    findWinningMove(board, playerId) {
        // Simulate dropping a piece in each column
        for (let col = 0; col < COLS; col++) {
            if (!this.isValidMove(board, col)) continue;

            const rowIndex = this.getDropRow(board, col);
            // Temporarily place piece
            board[rowIndex][col] = playerId;

            // Check win
            if (this.checkWin(board, rowIndex, col, playerId)) {
                // Undo
                board[rowIndex][col] = null;
                return col;
            }

            // Undo
            board[rowIndex][col] = null;
        }
        return -1;
    }

    getDropRow(board, col) {
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][col] === null) {
                return r;
            }
        }
        return -1;
    }

    // Copied from Game logic for stateless checking
    checkWin(board, row, col, playerId) {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        for (const [dr, dc] of directions) {
            let count = 1;
            // Positive
            for (let i = 1; i < 4; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === playerId) count++;
                else break;
            }
            // Negative
            for (let i = 1; i < 4; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === playerId) count++;
                else break;
            }
            if (count >= 4) return true;
        }
        return false;
    }
}

module.exports = new Bot();
