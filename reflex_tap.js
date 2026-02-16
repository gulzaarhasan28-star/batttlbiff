import { db } from '../../firebase/config.js';
import { ref, get, runTransaction } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// =================================================================
// TODO: Yahan apni Interstitial Ad Zone ID daalein
// Monetag se copy karke yahan sirf NUMBER paste karein
// =================================================================
const INTERSTITIAL_AD_ZONE_ID = 10615508; // Yahan INTERSTITIAL ad ki ID daalein

class ReflexTapGame {
    constructor(app) {
        this.app = app;
        this.score = 0;
        this.timer = 30;
        this.timerInterval = null;
        this.gameStarted = false;
        this.settings = { pointsPerTap: 2, timer: 30 };

        this.elements = {
            timer: document.getElementById('reflex-timer'),
            score: document.getElementById('reflex-score'),
            area: document.getElementById('reflex-area'),
            target: document.getElementById('reflex-target'),
            startMsg: document.getElementById('reflex-start-message'),
            backBtn: document.querySelector('.back-btn')
        };
        this.init();
    }

    async init() {
        const settingsRef = ref(db, 'game_settings/reflex_tap');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) this.settings = snapshot.val();
        this.timer = this.settings.timer;
        
        this.elements.area.addEventListener('click', () => this.startGame());
        this.elements.target.addEventListener('click', (e) => { e.stopPropagation(); this.handleTap(); });
        
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
    }

    startGame() {
        if (this.gameStarted) return;
        this.gameStarted = true;
        this.score = 0;
        this.elements.score.textContent = 0;
        this.elements.startMsg.classList.add('hidden');
        this.moveTarget();
        this.startTimer();
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
    
    handleTap() {
        if (!this.gameStarted || !this.timerInterval) return;
        this.score++;
        this.elements.score.textContent = this.score;
        this.moveTarget();
        
        const userWalletRef = ref(db, `users/${this.app.currentUser.id}/wallet`);
        runTransaction(userWalletRef, p => (p || 0) + this.settings.pointsPerTap);
    }

    moveTarget() {
        const areaRect = this.elements.area.getBoundingClientRect();
        const targetSize = this.elements.target.offsetWidth;
        const newX = Math.random() * (areaRect.width - targetSize);
        const newY = Math.random() * (areaRect.height - targetSize);
        this.elements.target.style.left = `${newX}px`;
        this.elements.target.style.top = `${newY}px`;
        this.elements.target.classList.remove('hidden');
    }

    endGame() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.gameStarted = false;
        this.elements.target.classList.add('hidden');
        this.elements.startMsg.textContent = `Game Over! Final Score: ${this.score}. Tap to restart.`;
        this.elements.startMsg.classList.remove('hidden');
        this.timer = this.settings.timer;
    }
}

export function init(app) {
    new ReflexTapGame(app);
}