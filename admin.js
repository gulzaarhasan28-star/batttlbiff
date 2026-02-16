import { db, auth } from '../firebase/config.js';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const authScreen = document.getElementById('auth-screen');
const dashboard = document.getElementById('dashboard');
const loginBtn = document.getElementById('login-btn');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const adminRef = ref(db, `admins/${user.uid}`);
        const snapshot = await get(adminRef);
        if (snapshot.exists()) {
            authScreen.classList.add('hidden');
            dashboard.classList.remove('hidden');
            initializeDashboard();
        } else {
            alert("Access Denied. You are not an administrator.");
            auth.signOut();
        }
    } else {
        authScreen.classList.remove('hidden');
        dashboard.classList.add('hidden');
    }
});

loginBtn.onclick = () => signInWithPopup(auth, new GoogleAuthProvider());

function initializeDashboard() {
    loadUserManagement();
    loadGameSettings();
}

function loadUserManagement() {
    const container = document.getElementById('user-management-container');
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
        const users = snapshot.val() || {};
        let tableHTML = `<table><thead><tr><th>UID</th><th>Username</th><th>Wallet</th><th>Blocked</th><th>Actions</th></tr></thead><tbody>`;
        for (const uid in users) {
            const user = users[uid];
            tableHTML += `
                <tr data-uid="${uid}" data-is-blocked="${user.isBlocked}">
                    <td>${uid}</td>
                    <td>${user.username}</td>
                    <td>${user.wallet}</td>
                    <td>${user.isBlocked}</td>
                    <td>
                        <input type="number" class="points-input" placeholder="Set Points">
                        <button class="update-btn">Update</button>
                        <button class="block-btn ${user.isBlocked ? 'btn-unblock' : 'btn-block'}">
                            ${user.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                    </td>
                </tr>`;
        }
        tableHTML += `</tbody></table>`;
        container.innerHTML = tableHTML;
        attachUserActionListeners(container);
    });
}

function attachUserActionListeners(container) {
    container.querySelectorAll('.update-btn').forEach(btn => {
        btn.onclick = (e) => {
            const row = e.target.closest('tr');
            const uid = row.dataset.uid;
            const pointsInput = row.querySelector('.points-input');
            const points = parseInt(pointsInput.value);
            if (!uid || isNaN(points)) return;
            update(ref(db, `users/${uid}`), { wallet: points });
            pointsInput.value = '';
        };
    });
    container.querySelectorAll('.block-btn').forEach(btn => {
        btn.onclick = (e) => {
            const row = e.target.closest('tr');
            const uid = row.dataset.uid;
            const isBlocked = row.dataset.isBlocked === 'true';
            if (!uid) return;
            update(ref(db, `users/${uid}`), { isBlocked: !isBlocked });
        };
    });
}

function loadGameSettings() {
    const container = document.getElementById('game-settings-container');
    const settingsRef = ref(db, 'game_settings');
    onValue(settingsRef, (snapshot) => {
        const settings = snapshot.val() || {};
        let settingsHTML = '';
        for (const game in settings) {
            settingsHTML += `<div class="setting-item" data-game="${game}"><h4>${game.replace(/_/g, ' ')}</h4>`;
            for (const prop in settings[game]) {
                settingsHTML += `
                    <div>
                        <label for="${game}-${prop}">${prop}</label>
                        <input type="number" id="${game}-${prop}" data-prop="${prop}" value="${settings[game][prop]}">
                    </div>`;
            }
            settingsHTML += `<button class="save-settings-btn">Save</button></div>`;
        }
        container.innerHTML = settingsHTML;
        attachSettingsActionListeners(container);
    });
}

function attachSettingsActionListeners(container) {
    container.querySelectorAll('.save-settings-btn').forEach(btn => {
        btn.onclick = (e) => {
            const item = e.target.closest('.setting-item');
            const game = item.dataset.game;
            const updates = {};
            item.querySelectorAll('input').forEach(input => {
                updates[input.dataset.prop] = parseInt(input.value);
            });
            update(ref(db, `game_settings/${game}`), updates);
        };
    });
}