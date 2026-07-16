/* ============================================
   TERRAFORGE - DASHBOARD INTERACTIVITY
   Core Dashboard Logic & Zone Management
   ============================================ */

const Dashboard = {
    currentZone: null,
    animationFrameId: null,

    /**
     * Initialize dashboard
     */
    init() {
        // Wait for data engine to initialize
        setTimeout(() => {
            this.setupZoneInteractivity();
            this.setupNodeForm();
            this.setupCarousel();
            this.setupSearchFunctionality();
            this.setupScrollObserver();
            this.simulateTelemetry();
            this.updateFacilityOverview();
            
            // Update facility overview every 30 seconds
            setInterval(() => this.updateFacilityOverview(), 30000);
            // Demo button (runs the detection→action→resolution flow)
            const demoBtn = document.getElementById('runDemoBtn');
            if (demoBtn) demoBtn.addEventListener('click', () => this.runDemoScenario());
        }, 2000);
    },

    /**
     * Setup zone card interactivity (Bonus Feature #4)
     */
    setupZoneInteractivity() {
        const zoneCards = document.querySelectorAll('.zone-card');
        
        zoneCards.forEach(card => {
            card.addEventListener('click', () => {
                // Remove active class from all cards
                zoneCards.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked card
                card.classList.add('active');
                
                // Update telemetry panel
                const zoneId = card.dataset.zone;
                this.currentZone = zoneId;
                this.updateTelemetryPanel(zoneId);
                
                // Save zone state
                StorageManager.saveZoneState(zoneId, { selected: true, timestamp: Date.now() });
            });
        });
    },

    /**
     * Update telemetry panel with REAL zone data from DataEngine
     * @param {string} zoneId - zone identifier
     */
    updateTelemetryPanel(zoneId) {
        const zoneData = DataEngine.getZoneData(zoneId);
        const config = DataEngine.zoneConfigs[zoneId];
        
        // Zone status
        const statusText = zoneData.status === 'alert' ? '⚠️ ALERT' : (
            zoneData.status === 'optimal' ? '✅ OPTIMAL' : '⏱️ NORMAL'
        );
        document.getElementById('zoneStatus').textContent = statusText;
        document.getElementById('zoneStatus').style.color = 
            zoneData.status === 'alert' ? '#ff3366' : (zoneData.status === 'optimal' ? '#00ff88' : '#ffaa00');
        
        // Efficiency bar
        document.getElementById('efficiencyBar').style.width = zoneData.efficiency + '%';
        document.getElementById('efficiencyValue').textContent = zoneData.efficiency + '%';
        
        // Primary metrics based on zone type
        const metricOne = document.getElementById('metricOne');
        const metricTwo = document.getElementById('metricTwo');
        
        if (config.type === 'energy') {
            metricOne.innerHTML = `⚡ Power: ${(zoneData.primaryMetrics.power || 0).toFixed(1)} kW`;
            metricTwo.innerHTML = `🌡️ Temp: ${(zoneData.primaryMetrics.temperature || 0).toFixed(1)}°C`;
        } else if (config.type === 'agriculture') {
            metricOne.innerHTML = `💧 Moisture: ${(zoneData.primaryMetrics.moisture || 0).toFixed(0)}%`;
            metricTwo.innerHTML = `☀️ Light: ${(zoneData.primaryMetrics.lightLevel || 0).toFixed(0)} lux`;
        } else if (config.type === 'irrigation') {
            metricOne.innerHTML = `💦 Flow: ${(zoneData.primaryMetrics.flowRate || 0).toFixed(1)} L/min`;
            metricTwo.innerHTML = `📊 pH: ${(zoneData.primaryMetrics.quality || 0).toFixed(1)}`;
        } else {
            metricOne.innerHTML = `🌡️ Temp: ${(zoneData.primaryMetrics.temperature || 0).toFixed(1)}°C`;
            metricTwo.innerHTML = `💨 Humidity: ${(zoneData.primaryMetrics.humidity || 0).toFixed(0)}%`;
        }
        
        // Alert count
        document.getElementById('alertCount').textContent = zoneData.alertCount;
        document.getElementById('alertCount').style.color = zoneData.alertCount > 0 ? '#ff3366' : '#00ff88';
    },

    /**
     * Setup node form with validation (Bonus Feature #6)
     */
    setupNodeForm() {
        const modal = document.getElementById('nodeModal');
        const addNodeBtn = document.getElementById('addNodeBtn');
        const closeModal = document.getElementById('closeModal');
        const cancelForm = document.getElementById('cancelForm');
        const nodeForm = document.getElementById('nodeForm');

        addNodeBtn.addEventListener('click', () => {
            modal.classList.add('open');
        });

        closeModal.addEventListener('click', () => {
            modal.classList.remove('open');
            nodeForm.reset();
        });

        cancelForm.addEventListener('click', () => {
            modal.classList.remove('open');
            nodeForm.reset();
        });

        // Form validation
        nodeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (this.validateNodeForm()) {
                const formData = new FormData(nodeForm);
                const node = {
                    id: formData.get('nodeName'),
                    name: formData.get('nodeName'),
                    type: formData.get('nodeType'),
                    ip: formData.get('nodeIP'),
                    status: 'online',
                    addedAt: new Date().toLocaleString()
                };
                
                this.addNodeToList(node);
                StorageManager.addNode(node);
                
                modal.classList.remove('open');
                nodeForm.reset();
                
                // Show success animation
                this.showSuccessNotification('Node provisioned successfully!');
            }
        });

        // Real-time validation
        document.getElementById('nodeName').addEventListener('blur', () => this.validateField('nodeName'));
        document.getElementById('nodeType').addEventListener('change', () => this.validateField('nodeType'));
        document.getElementById('nodeIP').addEventListener('blur', () => this.validateField('nodeIP'));

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('open');
                nodeForm.reset();
            }
        });
    },

    /**
     * Validate individual form field
     * @param {string} fieldName - field to validate
     * @returns {boolean} validation result
     */
    validateField(fieldName) {
        const fieldMap = {
            nodeName: {
                element: document.getElementById('nodeName'),
                errorElement: document.getElementById('nameError'),
                pattern: /^Node-\d{3}$/,
                errorMsg: 'Format must be Node-XXX (e.g., Node-004)'
            },
            nodeType: {
                element: document.getElementById('nodeType'),
                errorElement: document.getElementById('typeError'),
                validate: (val) => val !== '',
                errorMsg: 'Please select a node type'
            },
            nodeIP: {
                element: document.getElementById('nodeIP'),
                errorElement: document.getElementById('ipError'),
                pattern: /^(\d{1,3}\.){3}\d{1,3}$/,
                errorMsg: 'Invalid IP address format'
            }
        };

        const field = fieldMap[fieldName];
        const value = field.element.value;
        let isValid = false;

        if (field.pattern) {
            isValid = field.pattern.test(value);
        } else if (field.validate) {
            isValid = field.validate(value);
        }

        if (!isValid) {
            field.element.classList.add('error');
            field.errorElement.textContent = field.errorMsg;
        } else {
            field.element.classList.remove('error');
            field.errorElement.textContent = '';
        }

        return isValid;
    },

    /**
     * Validate entire form
     * @returns {boolean} validation result
     */
    validateNodeForm() {
        return (
            this.validateField('nodeName') &&
            this.validateField('nodeType') &&
            this.validateField('nodeIP')
        );
    },

    /**
     * Add node to the UI list
     * @param {object} node - node object
     */
    addNodeToList(node) {
        const nodesList = document.getElementById('nodesList');
        const nodeElement = document.createElement('div');
        nodeElement.className = 'node-item';
        nodeElement.dataset.node = node.id;

        nodeElement.innerHTML = `
            <div class="node-status online"></div>
            <div class="node-info">
                <span class="node-name">${node.name}</span>
                <span class="node-type">${node.type}</span>
            </div>
        `;

        nodesList.insertBefore(nodeElement, nodesList.firstChild);
    },

    /**
     * Setup carousel/slider (Bonus Feature #7)
     */
    setupCarousel() {
        const track = document.getElementById('carouselTrack');
        const prevBtn = document.getElementById('prevSlide');
        const nextBtn = document.getElementById('nextSlide');
        const dotsContainer = document.getElementById('carouselDots');
        
        let currentIndex = 0;
        const slides = track.querySelectorAll('.carousel-slide');
        const slideCount = slides.length;

        // Create dots
        slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot' + (index === 0 ? ' active' : '');
            dot.addEventListener('click', () => this.goToSlide(index));
            dotsContainer.appendChild(dot);
        });

        // Navigation functions
        const updateSlide = (index) => {
            currentIndex = (index + slideCount) % slideCount;
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            
            document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
        };

        this.goToSlide = (index) => updateSlide(index);

        prevBtn.addEventListener('click', () => updateSlide(currentIndex - 1));
        nextBtn.addEventListener('click', () => updateSlide(currentIndex + 1));

        // Auto-play carousel
        setInterval(() => {
            updateSlide(currentIndex + 1);
        }, 5000);
    },

    /**
     * Setup search functionality (Bonus Feature #5)
     */
    setupSearchFunctionality() {
        const searchInput = document.getElementById('searchInput');
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            // Search through zone cards
            document.querySelectorAll('.zone-card').forEach(card => {
                const label = card.textContent.toLowerCase();
                card.style.opacity = label.includes(query) || query === '' ? '1' : '0.3';
            });

            // Search through node items
            document.querySelectorAll('.node-item').forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.opacity = text.includes(query) || query === '' ? '1' : '0.3';
            });

            // Search through log entries
            document.querySelectorAll('.log-entry').forEach(entry => {
                const text = entry.textContent.toLowerCase();
                entry.style.opacity = text.includes(query) || query === '' ? '1' : '0.3';
            });
        });
    },

    /**
     * Setup Intersection Observer for scroll effects (Bonus Feature #9)
     */
    setupScrollObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.scroll-observe').forEach(element => {
            observer.observe(element);
        });
    },

    /**
     * Simulate live telemetry updates from REAL sensor data
     */
    simulateTelemetry() {
        // Update system health gauges with REAL data
        const updateGauges = () => {
            // Get real CPU and memory from solar + robotics bay
            const roboticsBay = DataEngine.sensors['robotics-bay'];
            const solarArray = DataEngine.sensors['solar-array'];
            
            if (roboticsBay && solarArray) {
                const cpuLoad = (roboticsBay['power-draw']?.value || 0) / 20 * 100;
                const memUsage = (solarArray['efficiency']?.value || 0);

                document.getElementById('cpuValue').textContent = Math.round(cpuLoad) + '%';
                document.getElementById('memValue').textContent = Math.round(memUsage) + '%';

                const circumference = 251.2;
                const cpuOffset = circumference - (cpuLoad / 100) * circumference;
                const memOffset = circumference - (memUsage / 100) * circumference;

                document.getElementById('cpuGauge').style.strokeDashoffset = cpuOffset;
                document.getElementById('memGauge').style.strokeDashoffset = memOffset;
            }

            // Update if zone is selected
            if (this.currentZone) {
                const zoneData = DataEngine.getZoneData(this.currentZone);
                document.getElementById('efficiencyBar').style.width = zoneData.efficiency + '%';
                document.getElementById('efficiencyValue').textContent = zoneData.efficiency + '%';
            }
        };

        // Initial update
        updateGauges();

        // Update every 10 seconds (aligned with DataEngine updates)
        setInterval(() => updateGauges(), 10000);

        // Add real workflow execution logs
        this.updateWorkflowLog();
        setInterval(() => this.updateWorkflowLog(), 15000);
        
        // Populate activity log and system metrics
        this.updateActivityLog();
        setInterval(() => this.updateActivityLog(), 10000);
        this.updateSystemHealthMetrics();
        setInterval(() => this.updateSystemHealthMetrics(), 5000);
    },

    /**
     * Update workflow execution log with real automations
     */
    updateWorkflowLog() {
        const recentActions = WorkflowEngine.getRecentExecutions(5);
        const logContainer = document.getElementById('workflowLog');
        
        if (recentActions.length === 0) return;

        logContainer.innerHTML = '';
        
        recentActions.forEach((action, index) => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.innerHTML = `
                <span class="log-time">${new Date(action.timestamp).toLocaleTimeString()}</span>
                <span class="log-type success">AUTO</span>
                <span class="log-msg"><strong>${action.workflowName}</strong>: ${action.impact}</span>
            `;
            logEntry.style.opacity = '0';
            logEntry.style.animation = `slideInFromBottom 0.5s ease-out forwards`;
            logEntry.style.animationDelay = (index * 0.1) + 's';
            logContainer.appendChild(logEntry);
        });
        
        const count = recentActions.length;
        document.getElementById('automationCount').textContent = count;
    },

    /**
     * Update activity log with alerts and recent automations
     */
    updateActivityLog() {
        const activity = [];

        // Alerts (DataEngine.alerts)
        (DataEngine.alerts || []).forEach(a => {
            activity.push({
                timestamp: a.timestamp,
                type: 'ALERT',
                zone: a.zoneId,
                msg: `${a.sensorType} ${a.value}${a.unit || ''} — ${a.severity}`
            });
        });

        // Automations
        (WorkflowEngine.executionLog || []).slice(-200).forEach(e => {
            activity.push({
                timestamp: e.timestamp,
                type: 'AUTO',
                zone: e.zone,
                msg: `${e.workflowName}: ${e.impact}`
            });
        });

        // Sort by newest
        activity.sort((a, b) => b.timestamp - a.timestamp);

        const container = document.getElementById('activityLog');
        if (!container) return;
        container.innerHTML = '';

        activity.slice(0, 30).forEach(item => {
            const el = document.createElement('div');
            el.className = 'log-entry';
            const time = new Date(item.timestamp).toLocaleTimeString();
            const typeClass = item.type === 'ALERT' ? 'danger' : (item.type === 'AUTO' ? 'success' : 'info');
            el.innerHTML = `
                <span class="log-time">${time}</span>
                <span class="log-type ${typeClass}">${item.type}</span>
                <span class="log-msg">${item.msg}</span>
            `;
            el.style.opacity = '0';
            el.style.animation = 'slideInFromBottom 0.35s ease-out forwards';
            container.appendChild(el);
        });
    },

    /**
     * Use browser Performance APIs to populate system health metrics
     */
    updateSystemHealthMetrics() {
        // Memory (Chrome only)
        let memPercent = 0;
        if (performance && performance.memory) {
            memPercent = Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100);
        } else {
            // Fallback: approximate from data engine
            const solar = DataEngine.sensors['solar-array'];
            memPercent = Math.min(100, Math.round((solar?.efficiency?.value || 50) / 1.5));
        }

        // CPU estimate via event-loop lag measurement
        const t0 = performance.now();
        setTimeout(() => {
            const lag = performance.now() - t0 - 100; // expected 100ms
            // Convert lag to a 0-100 estimate (heuristic)
            const cpuEstimate = Math.min(100, Math.max(0, Math.round((lag / 50) * 100)));

            // Update UI
            document.getElementById('cpuValue').textContent = cpuEstimate + '%';
            document.getElementById('memValue').textContent = memPercent + '%';

            const circumference = 251.2;
            const cpuOffset = circumference - (cpuEstimate / 100) * circumference;
            const memOffset = circumference - (memPercent / 100) * circumference;

            const cpuGauge = document.getElementById('cpuGauge');
            const memGauge = document.getElementById('memGauge');
            if (cpuGauge) cpuGauge.style.strokeDashoffset = cpuOffset;
            if (memGauge) memGauge.style.strokeDashoffset = memOffset;
        }, 100);
    },

    /**
     * Run a short demo scenario: detection → automation → resolution
     */
    runDemoScenario() {
        // Create timeline events and trigger irrigation workflow immediately
        // 1) Create an alert for low soil moisture
        DataEngine.createAlert('orchard-quad', 'soil-moisture', 35, '%');

        // 2) Immediately execute the irrigation workflow action
        const wf = WorkflowEngine.workflows.find(w => w.id === 'wf-irrigation-01');
        if (wf) {
            const trig = wf.triggers.find(t => t.sensor === 'soil-moisture');
            if (trig) {
                const action = WorkflowEngine.executeAction(wf, trig, 35);

                // Simulate immediate change to water grid flow-rate
                const water = DataEngine.sensors['water-grid'];
                if (water && water['flow-rate']) {
                    water['flow-rate'].value = (water['flow-rate'].value || 10) + 60;
                    water['flow-rate'].timestamp = Date.now();
                }

                // Refresh logs/UI
                this.updateWorkflowLog();
                this.updateActivityLog();
                this.showSuccessNotification('Demo: Irrigation triggered and logged');
            }
        }
    },

    /**
     * Show success notification
     * @param {string} message - notification message
     */
    showSuccessNotification(message) {
        // Create temporary notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-success);
            color: #0f1419;
            padding: 16px 24px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 4000;
            animation: slideInFromBottom 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    },

    /**
     * Update facility overview with real health metrics
     */
    updateFacilityOverview() {
        const health = AnalyticsEngine.getHealthReport();
        const efficiency = AnalyticsEngine.getFacilityEfficiency();
        const energy = AnalyticsEngine.getEnergyReport();
        
        console.log('🏭 Facility Health:', health);
        console.log('⚡ Energy Report:', energy);
        console.log('📊 Facility Efficiency:', efficiency + '%');
    },

    /**
     * Display real alerts on the dashboard
     */
    updateAlertsList() {
        const alerts = DataEngine.getActiveAlerts();
        console.log('📢 Active Alerts:', alerts);
        return alerts;
    }

};

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Dashboard.init());
} else {
    Dashboard.init();
}
