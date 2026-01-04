const ROWS = 6;
const COLS = 7;

class Bot {
    constructor() {
        this.delay = 500;
    }

    findMove(board, botId, opponentId) {
        let winningMove = this.findWinningMove(board, botId);
        if (winningMove !== -1) return winningMove;

        let blockingMove = this.findWinningMove(board, opponentId);
        if (blockingMove !== -1) return blockingMove;

        const centerOrder = [3, 2, 4, 1, 5, 0, 6];
        for (let col of centerOrder) {
            if (this.isValidMove(board, col)) {
                return col;
            }
        }

        return -1;
    }

    isValidMove(board, col) {
        return board[0][col] === null;
    }

    findWinningMove(board, playerId) {
        for (let col = 0; col < COLS; col++) {
            if (!this.isValidMove(board, col)) continue;

            const rowIndex = this.getDropRow(board, col);
            board[rowIndex][col] = playerId;

            if (this.checkWin(board, rowIndex, col, playerId)) {
                board[rowIndex][col] = null;
                return col;
            }

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

    checkWin(board, row, col, playerId) {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        for (const [dr, dc] of directions) {
            let count = 1;
            for (let i = 1; i < 4; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === playerId) count++;
                else break;
            }
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
