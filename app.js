import { db, auth } from '../firebase/config.js';
import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { ref, onValue, get, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const tg = window.Telegram.WebApp;

class App {
    constructor() {
        this.currentUser = null;
        this.authUid = null;
        this.mainContent = document.getElementById('main-content');
        this.nav = document.getElementById('main-nav');
        this.init();
    }

    async init() {
        tg.ready();
        tg.expand();

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.authUid = user.uid;
                const tgUser = tg.initDataUnsafe?.user;
                if (!tgUser) { this.showError("Could not verify Telegram user."); return; }

                // Use Telegram ID as the primary key in the database
                this.currentUser = {
                    id: tgUser.id.toString(),
                    username: tgUser.username || `${tgUser.first_name} ${tgUser.last_name || ''}`.trim()
                };

                await this.initUserProfile();
                this.listenToUserData();
                this.setupNavigation();
                this.loadComponent('home');
            } else {
                signInAnonymously(auth).catch(error => console.error("Anonymous sign-in failed:", error));
            }
        });
    }

    async initUserProfile() {
        const userRef = ref(db, 'users/' + this.currentUser.id);
        const snapshot = await get(userRef);
        if (!snapshot.exists()) {
            await set(userRef, {
                username: this.currentUser.username,
                wallet: 100,
                isBlocked: false,
                createdAt: serverTimestamp()
            });
        }
    }

    listenToUserData() {
        const userRef = ref(db, `users/${this.currentUser.id}`);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (!userData) return;

            document.getElementById('wallet-points').textContent = userData.wallet;
            document.getElementById('username-display').textContent = userData.username;

            const blockedOverlay = document.getElementById('blocked-overlay');
            if (userData.isBlocked) {
                blockedOverlay.classList.replace('hidden', 'visible');
            } else {
                blockedOverlay.classList.replace('visible', 'hidden');
            }

            document.getElementById('loader-overlay').classList.replace('visible', 'hidden');
            document.getElementById('app-container').classList.remove('hidden');
        }, { onlyOnce: false });
    }

    setupNavigation() {
        this.nav.addEventListener('click', (e) => {
            if (e.target.matches('.nav-btn')) {
                const componentName = e.target.dataset.component;
                this.nav.querySelector('.active')?.classList.remove('active');
                e.target.classList.add('active');
                this.loadComponent(componentName);
            }
        });
    }

    async loadComponent(name) {
        try {
            // Check if user is blocked before loading a component other than home
            const userStatusRef = ref(db, `users/${this.currentUser.id}/isBlocked`);
            const snapshot = await get(userStatusRef);
            if (snapshot.val() === true) {
                return; // Do not load component if blocked
            }

            const response = await fetch(`./components/${name}.html`);
            if (!response.ok) throw new Error(`Component ${name} not found`);
            this.mainContent.innerHTML = await response.text();

            const module = await import(`./components/${name}.js`);
            if (module.init) {
                module.init(this);
            }
        } catch (error) {
            console.error("Failed to load component:", error);
            this.mainContent.innerHTML = `<div class="glass-card"><p>Error loading content.</p></div>`;
        }
    }
    
    showError(message) {
        const loader = document.getElementById('loader-overlay');
        loader.innerHTML = `<div class="glass-card"><p>${message}</p></div>`;
        loader.classList.add('visible');
    }
}

document.addEventListener('DOMContentLoaded', () => new App());