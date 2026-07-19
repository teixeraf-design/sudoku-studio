// ============================================================
// PARTE 1 - SUDOKU ENGINE
// ============================================================

const SudokuEngine = {
    generateFullBoard() {
        const board = Array.from({ length: 9 }, () => Array(9).fill(0));
        this._fillBoard(board);
        return board;
    },

    _fillBoard(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const nums = this._shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    for (const num of nums) {
                        if (this._isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (this._fillBoard(board)) return true;
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    },

    _isValid(board, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num) return false;
            if (board[i][col] === num) return false;
        }
        const br = Math.floor(row / 3) * 3;
        const bc = Math.floor(col / 3) * 3;
        for (let i = br; i < br + 3; i++) {
            for (let j = bc; j < bc + 3; j++) {
                if (board[i][j] === num) return false;
            }
        }
        return true;
    },

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    createPuzzle(solution, cluesCount) {
        const puzzle = solution.map(row => [...row]);
        const positions = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                positions.push({ r, c });
            }
        }
        this._shuffle(positions);
        const toRemove = 81 - Math.min(Math.max(cluesCount, 17), 81);
        for (let i = 0; i < toRemove; i++) {
            puzzle[positions[i].r][positions[i].c] = 0;
        }
        return puzzle;
    }
};

window.SudokuEngine = SudokuEngine;
console.log('📦 SudokuEngine carregado!');