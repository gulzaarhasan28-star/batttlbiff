import { db } from '../../firebase/config.js';
import { ref, get, runTransaction } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// =================================================================
// TODO: Yahan apni Interstitial Ad Zone ID daalein
// Monetag se copy karke yahan sirf NUMBER paste karein
// =================================================================
const INTERSTITIAL_AD_ZONE_ID = 10615508; // Yahan INTERSTITIAL ad ki ID daalein

class TicTacToeGame {
    constructor(app) {
        this.app = app;
        this.boardState = Array(9).fill(null);
        this.playerSymbol = 'X';
        this.aiSymbol = 'O';
        this.isPlayerTurn = true;
        this.isGameOver = false;
        this.score = 0;
        this.settings = { pointsPerWin: 50 };
        this.elements = {
            status: document.getElementById('ttt-status'),
            score: document.getElementById('ttt-score'),
            cells: document.querySelectorAll('.cell'),
            backBtn: document.querySelector('.back-btn')
        };
        this.init();
    }

    async init() {
        const settingsRef = ref(db, 'game_settings/tic_tac_toe');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) this.settings = snapshot.val();

        this.elements.cells.forEach(cell => cell.addEventListener('click', () => this.handleCellClick(cell)));
        
        this.elements.backBtn.addEventListener('click', () => {
            if (window.invokeSDK && INTERSTITIAL_AD_ZONE_ID) {
                window.invokeSDK.show({ zoneId: INTERSTITIAL_AD_ZONE_ID })
                    .catch(() => console.log("Interstitial ad failed."))
                    .finally(() => this.app.loadComponent('home'));
            } else {
                this.app.loadComponent('home');
            }
        });
    }

    handleCellClick(cell) {
        const index = parseInt(cell.dataset.index);
        if (!this.isPlayerTurn || this.boardState[index] || this.isGameOver) return;

        this.makeMove(index, this.playerSymbol);
        if (!this.isGameOver) {
            this.isPlayerTurn = false;
            this.elements.status.textContent = "AI's Turn...";
            setTimeout(() => this.aiMove(), 600);
        }
    }

    aiMove() {
        const bestMove = this.minimax(this.boardState, this.aiSymbol).index;
        this.makeMove(bestMove, this.aiSymbol);
        if (!this.isGameOver) {
            this.isPlayerTurn = true;
            this.elements.status.textContent = "Your Turn (X)";
        }
    }

    makeMove(index, player) {
        this.boardState[index] = player;
        this.elements.cells[index].textContent = player;
        
        const winningInfo = this.checkWin(this.boardState, player);
        if (winningInfo.hasWon) {
            this.endGame(player, winningInfo.line);
        } else if (this.boardState.every(cell => cell)) {
            this.endGame('draw');
        }
    }
    
    endGame(winner, winningLine) {
        this.isGameOver = true;
        if (winner === 'draw') {
            this.elements.status.textContent = "It's a Draw!";
        } else {
            this.elements.status.textContent = `${winner === this.playerSymbol ? 'You Win!' : 'AI Wins!'}`;
            winningLine.forEach(index => this.elements.cells[index].classList.add('win'));
            if (winner === this.playerSymbol) {
                this.score++;
                this.elements.score.textContent = this.score;
                const userWalletRef = ref(db, `users/${this.app.currentUser.id}/wallet`);
                runTransaction(userWalletRef, p => (p || 0) + this.settings.pointsPerWin);
            }
        }
        setTimeout(() => this.resetBoard(), 1500);
    }
    
    resetBoard() {
        this.boardState.fill(null);
        this.elements.cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('win');
        });
        this.isGameOver = false;
        this.isPlayerTurn = true;
        this.elements.status.textContent = "Your Turn (X)";
    }
    
    checkWin(board, player) {
        const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        for (const line of lines) {
            if (line.every(index => board[index] === player)) return { hasWon: true, line: line };
        }
        return { hasWon: false };
    }
    
    minimax(newBoard, player) {
        const availableSpots = newBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
        
        if (this.checkWin(newBoard, this.playerSymbol).hasWon) return { score: -10 };
        if (this.checkWin(newBoard, this.aiSymbol).hasWon) return { score: 10 };
        if (availableSpots.length === 0) return { score: 0 };
        
        const moves = [];
        for (let i = 0; i < availableSpots.length; i++) {
            const move = { index: availableSpots[i] };
            newBoard[availableSpots[i]] = player;
            const result = this.minimax(newBoard, player === this.aiSymbol ? this.playerSymbol : this.aiSymbol);
            move.score = result.score;
            newBoard[availableSpots[i]] = null;
            moves.push(move);
        }
        
        let bestMove;
        if (player === this.aiSymbol) {
            let bestScore = -10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score > bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        } else {
            let bestScore = 10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score < bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        }
        return moves[bestMove];
    }
}

export function init(app) {
    new TicTacToeGame(app);
}