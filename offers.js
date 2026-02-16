import { db } from '../../firebase/config.js';
import { ref, runTransaction } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

export function init(app) {
    // =================================================================
    // TODO: APNI AD ZONE IDs YAHAN DAALEIN
    // Monetag se copy karke yahan sirf NUMBER paste karein
    // =================================================================
    const REWARDED_INTERSTITIAL_ZONE_ID = 10615508; // Yahan REWARDED ad ki ID daalein
    const REWARDED_POPUP_ZONE_ID = 0;      // Yahan POPUP ad ki ID daalein (agar nahi hai to 0 rehne dein)
    
    const REWARD_AMOUNT = 50; // Video dekhne par kitne points milenge

    const watchVideoBtn = document.getElementById('watch-video-ad-btn');
    const showPopupBtn = document.getElementById('show-popup-offers-btn');

    // Video Ad Button ke liye Logic
    if (watchVideoBtn) {
        watchVideoBtn.addEventListener('click', () => {
            if (!window.invokeSDK) {
                alert("Ads are not available. Please try again later.");
                return;
            }
            
            if (!REWARDED_INTERSTITIAL_ZONE_ID) {
                 alert("Rewarded ad is not configured.");
                 return;
            }

            watchVideoBtn.disabled = true;
            watchVideoBtn.textContent = "Loading Video Ad...";

            window.invokeSDK.show({ zoneId: REWARDED_INTERSTITIAL_ZONE_ID, ymid: app.currentUser.id })
                .then(() => {
                    const userWalletRef = ref(db, `users/${app.currentUser.id}/wallet`);
                    runTransaction(userWalletRef, (currentPoints) => {
                        return (currentPoints || 0) + REWARD_AMOUNT;
                    });
                    alert(`Congratulations! ${REWARD_AMOUNT} points have been added.`);
                })
                .catch(() => {
                    alert("You need to watch the complete ad to get the reward.");
                })
                .finally(() => {
                    watchVideoBtn.disabled = false;
                    watchVideoBtn.textContent = "Watch Video Ad for Reward";
                });
        });
    }

    // Popup Offer Button ke liye Logic
    if (showPopupBtn) {
        showPopupBtn.addEventListener('click', () => {
            if (!window.invokeSDK) {
                alert("Offers are not available. Please try again later.");
                return;
            }
            
            if (!REWARDED_POPUP_ZONE_ID) {
                 alert("Popup offers are not configured.");
                 return;
            }

            window.invokeSDK.show({ zoneId: REWARDED_POPUP_ZONE_ID, ymid: app.currentUser.id });
        });
    }
}