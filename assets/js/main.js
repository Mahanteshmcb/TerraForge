/* ============================================
   TERRAFORGE - MAIN INITIALIZATION
   Loading Screen & Theme Toggle
   ============================================ */

const App = {
    /**
     * Initialize application
     */
    init() {
        this.setupLoadingScreen();
        this.setupThemeToggle();
    },

    /**
     * Setup loading screen animation (Bonus Feature #1)
     */
    setupLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        
        // Simulate boot sequence
        window.addEventListener('load', () => {
            // Add a slight delay to let images/resources load
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.pointerEvents = 'none';
            }, 1500);
        });
    },

    /**
     * Setup theme toggle (Bonus Feature #2)
     */
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.className;
            const newTheme = currentTheme === 'light-theme' ? 'dark-theme' : 'light-theme';
            
            document.body.className = newTheme;
            StorageManager.saveTheme(newTheme);
            
            // Add visual feedback
            themeToggle.style.transform = 'scale(0.95)';
            setTimeout(() => {
                themeToggle.style.transform = 'scale(1)';
            }, 100);
        });
    }
};

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
