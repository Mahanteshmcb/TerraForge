/* ============================================
   TERRAFORGE - LOCAL STORAGE HANDLER
   Bonus Feature #3: Local Storage Persistence
   ============================================ */

const StorageManager = {
    // Keys for local storage
    KEYS: {
        THEME: 'terraforge_theme',
        ZONE_STATE: 'terraforge_zone_state',
        NODES: 'terraforge_nodes',
        DASHBOARD_SETTINGS: 'terraforge_dashboard_settings'
    },

    /**
     * Initialize storage manager
     */
    init() {
        this.loadThemePreference();
    },

    /**
     * Load saved theme preference and apply it
     */
    loadThemePreference() {
        const savedTheme = localStorage.getItem(this.KEYS.THEME);
        
        if (savedTheme) {
            document.body.className = savedTheme;
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.className = prefersDark ? 'dark-theme' : 'light-theme';
        }
    },

    /**
     * Save theme preference
     * @param {string} theme - 'dark-theme' or 'light-theme'
     */
    saveTheme(theme) {
        localStorage.setItem(this.KEYS.THEME, theme);
    },

    /**
     * Get current theme
     * @returns {string} current theme class
     */
    getTheme() {
        return document.body.className;
    },

    /**
     * Save zone state
     * @param {string} zoneId - zone identifier
     * @param {object} state - zone state data
     */
    saveZoneState(zoneId, state) {
        try {
            const zoneStates = this.getZoneStates();
            zoneStates[zoneId] = state;
            localStorage.setItem(this.KEYS.ZONE_STATE, JSON.stringify(zoneStates));
        } catch (error) {
            console.error('Error saving zone state:', error);
        }
    },

    /**
     * Get all zone states
     * @returns {object} zone states
     */
    getZoneStates() {
        try {
            const states = localStorage.getItem(this.KEYS.ZONE_STATE);
            return states ? JSON.parse(states) : {};
        } catch (error) {
            console.error('Error retrieving zone states:', error);
            return {};
        }
    },

    /**
     * Get specific zone state
     * @param {string} zoneId - zone identifier
     * @returns {object|null} zone state or null
     */
    getZoneState(zoneId) {
        const states = this.getZoneStates();
        return states[zoneId] || null;
    },

    /**
     * Save nodes data
     * @param {array} nodes - array of node objects
     */
    saveNodes(nodes) {
        try {
            localStorage.setItem(this.KEYS.NODES, JSON.stringify(nodes));
        } catch (error) {
            console.error('Error saving nodes:', error);
        }
    },

    /**
     * Get saved nodes data
     * @returns {array} nodes array
     */
    getNodes() {
        try {
            const nodes = localStorage.getItem(this.KEYS.NODES);
            return nodes ? JSON.parse(nodes) : [];
        } catch (error) {
            console.error('Error retrieving nodes:', error);
            return [];
        }
    },

    /**
     * Save dashboard settings
     * @param {object} settings - settings object
     */
    saveDashboardSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.DASHBOARD_SETTINGS, JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving dashboard settings:', error);
        }
    },

    /**
     * Get dashboard settings
     * @returns {object} settings object
     */
    getDashboardSettings() {
        try {
            const settings = localStorage.getItem(this.KEYS.DASHBOARD_SETTINGS);
            return settings ? JSON.parse(settings) : {};
        } catch (error) {
            console.error('Error retrieving dashboard settings:', error);
            return {};
        }
    },

    /**
     * Clear all TerraForge data from local storage
     */
    clearAll() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            console.log('All TerraForge data cleared from storage');
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    },

    /**
     * Add node to storage
     * @param {object} node - node object
     */
    addNode(node) {
        try {
            const nodes = this.getNodes();
            nodes.push(node);
            this.saveNodes(nodes);
        } catch (error) {
            console.error('Error adding node:', error);
        }
    },

    /**
     * Remove node from storage
     * @param {string} nodeId - node identifier
     */
    removeNode(nodeId) {
        try {
            const nodes = this.getNodes();
            const filtered = nodes.filter(n => n.id !== nodeId);
            this.saveNodes(filtered);
        } catch (error) {
            console.error('Error removing node:', error);
        }
    }
};

// Initialize storage manager on module load
StorageManager.init();
