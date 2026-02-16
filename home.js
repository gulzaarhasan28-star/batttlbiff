export function init(app) {
    document.querySelectorAll('.game-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const gameName = e.target.dataset.game;
            app.loadComponent(gameName);
        });
    });
}