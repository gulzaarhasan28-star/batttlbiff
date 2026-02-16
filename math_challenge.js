import { db } from '../../firebase/config.js';
import { ref, get, runTransaction } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// =================================================================
// TODO: Yahan apni Interstitial Ad Zone ID daalein
// Monetag se copy karke yahan sirf NUMBER paste karein
// =================================================================
const INTERSTITIAL_AD_ZONE_ID = 10615508; // Yahan INTERSTITIAL ad ki ID daalein

class MathChallengeGame {
    constructor(app) {
        this.app = app;
        this.score = 0;
        this.combo = 0;
        this.timer = 60;
        this.timerInterval = null;
        this.currentAnswer = 0;
        this.settings = { pointsPerCorrect: 10, timer: 60, comboBonus: 5 };

        this.elements = {
            timer: document.getElementById('math-timer'),
            score: document.getElementById('math-score'),
            combo: document.getElementById('math-combo'),
            problem: document.getElementById('math-problem'),
            feedback: document.getElementById('math-feedback'),
            form: document.getElementById('math-form'),
            input: document.getElementById('math-input'),
            backBtn: document.querySelector('.back-btn')
        };
        this.init();
    }

    async init() {
        const settingsRef = ref(db, 'game_settings/math_challenge');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) this.settings = snapshot.val();
        this.timer = this.settings.timer;
        
        this.elements.form.addEventListener('submit', (e) => { e.preventDefault(); this.handleSubmit(); });
        
        this.elements.backBtn.addEventListener('click', () => {
            clearInterval(this.timerInterval);
            if (window.invokeSDK && INTERSTITIAL_AD_ZONE_ID) {
                window.invokeSDK.show({ zoneId: INTERSTITIAL_AD_ZONE_ID })
                    .catch(() => console.log("Interstitial ad failed."))
                    .finally(() => this.app.loadComponent('home'));
            } else {
                this.app.loadComponent('home');
            }
        });
        this.startGame();
    }

    startGame() {
        this.score = 0; 
        this.combo = 0;
        this.updateUI();
        this.generateProblem();
        this.startTimer();
        this.elements.input.focus();
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.timer = this.settings.timer;
        this.elements.timer.textContent = this.timer;
        this.timerInterval = setInterval(() => {
            this.timer--;
            this.elements.timer.textContent = this.timer;
            if (this.timer <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    generateProblem() {
        const difficulty = 1 + Math.floor(this.score / 50);
        const operators = ['+', '-', '×'];
        const operator = operators[Math.floor(Math.random() * operators.length)];
        let num1 = Math.floor(Math.random() * 10 * difficulty) + 1;
        let num2 = Math.floor(Math.random() * 10 * difficulty) + 1;
        
        if (operator === '×') { 
            num1 = Math.floor(Math.random() * 10) + 2; 
            num2 = Math.floor(Math.random() * 10) + 2; 
        }
        if (operator === '-' && num1 < num2) {
            [num1, num2] = [num2, num1];
        }
        
        this.elements.problem.textContent = `${num1} ${operator} ${num2}`;
        this.currentAnswer = eval(`${num1} ${operator.replace('×', '*')} ${num2}`);
        this.elements.problem.classList.remove('animate-in');
        void this.elements.problem.offsetWidth;
        this.elements.problem.classList.add('animate-in');
    }

    handleSubmit() {
        if (!this.timerInterval) return;

        if (parseInt(this.elements.input.value) === this.currentAnswer) {
            this.combo++;
            const bonus = Math.floor(this.combo / 3) * this.settings.comboBonus;
            const pointsWon = this.settings.pointsPerCorrect + bonus;
            this.score += pointsWon;
            
            const userWalletRef = ref(db, `users/${this.app.currentUser.id}/wallet`);
            runTransaction(userWalletRef, p => (p || 0) + pointsWon);
            this.showFeedback('Correct!', 'correct');
        } else {
            this.combo = 0;
            this.showFeedback('Wrong!', 'wrong');
        }
        this.updateUI();
        this.generateProblem();
        this.elements.input.value = '';
    }

    showFeedback(message, type) {
        this.elements.feedback.textContent = message;
        this.elements.feedback.className = `feedback ${type} show`;
        setTimeout(() => this.elements.feedback.classList.remove('show'), 800);
    }
    
    updateUI() {
        this.elements.score.textContent = this.score;
        this.elements.combo.textContent = `x${this.combo}`;
    }

    endGame() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.elements.problem.innerHTML = `Time's Up!<br>Final Score: ${this.score}`;
        this.elements.form.classList.add('hidden');
    }
}

export function init(app) {
    new MathChallengeGame(app);
}