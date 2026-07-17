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
            this.loadSavedNodes();
            this.selectDefaultZone();
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
                this.selectZone(card.dataset.zone);
            });
        });
    },

    /**
     * Select a zone programmatically and update the UI
     * @param {string} zoneId - zone identifier
     */
    selectZone(zoneId) {
        const zoneCards = document.querySelectorAll('.zone-card');
        zoneCards.forEach(c => c.classList.toggle('active', c.dataset.zone === zoneId));
        this.currentZone = zoneId;
        this.updateTelemetryPanel(zoneId);
        this.updateZoneSummaries();
        StorageManager.saveZoneState(zoneId, { selected: true, timestamp: Date.now() });
    },

    /**
     * Choose a default zone on startup
     */
    selectDefaultZone() {
        const savedStates = StorageManager.getZoneStates();
        const lastZone = Object.keys(savedStates).find(zoneId => savedStates[zoneId].selected);
        const firstCard = document.querySelector('.zone-card');
        const defaultZone = lastZone || firstCard?.dataset.zone;
        if (defaultZone) {
            this.selectZone(defaultZone);
        }
    },

    /**
     * Execute a zone command and update the dashboard
     */
    executeZoneCommand(commandId, zoneId) {
        const simulationState = document.getElementById('simulationState');
        const zoneName = DataEngine.zoneConfigs[zoneId]?.name || zoneId;

        const message = this.applyZoneCommandEffects(commandId, zoneId) || `Command ${commandId} executed in ${zoneName}.`;
        this.showSuccessNotification(message);
        this.updateTelemetryPanel(zoneId);
        this.updateZoneSummaries();
        this.updateActivityLog();
        this.updateWorkflowLog();
        this.updateViewport(zoneId, DataEngine.getZoneData(zoneId));

        if (simulationState) {
            simulationState.textContent = 'SIMULATION ACTIVE';
            simulationState.classList.add('active');
            setTimeout(() => simulationState.textContent = 'SIMULATION MODE', 2000);
        }
    },

    applyZoneCommandEffects(commandId, zoneId) {
        const sensors = DataEngine.sensors[zoneId];
        if (!sensors) return null;

        const updateSensor = (sensorType, value) => {
            if (!sensors[sensorType]) return;
            sensors[sensorType].value = value;
            sensors[sensorType].timestamp = Date.now();
            sensors[sensorType].status = DataEngine.getStatusForValue(zoneId, sensorType, value);
            DataEngine.addToHistory(zoneId, sensorType, value);
        };

        switch (commandId) {
            case 'irrigate':
                updateSensor('soil-moisture', 72);
                if (sensors['flow-rate']) updateSensor('flow-rate', Math.max(50, sensors['flow-rate'].value + 20));
                return `Irrigation started in ${DataEngine.zoneConfigs[zoneId].name}.`;
            case 'boost-light':
                updateSensor('light-level', 78000);
                if (sensors['air-quality']) updateSensor('air-quality', Math.min(100, sensors['air-quality'].value + 3));
                return `Lighting increased for ${DataEngine.zoneConfigs[zoneId].name}.`;
            case 'deploy-patrol':
                updateSensor('vibration', 3);
                if (sensors['power-draw']) updateSensor('power-draw', Math.min(25, sensors['power-draw'].value + 3));
                return `Security patrol deployed in ${DataEngine.zoneConfigs[zoneId].name}.`;
            case 'optimize-solar':
                updateSensor('efficiency', 96);
                updateSensor('current', Math.min(150, (sensors['current']?.value || 80) + 15));
                updateSensor('voltage', 490);
                return `Solar output optimized for ${DataEngine.zoneConfigs[zoneId].name}.`;
            case 'balance-water':
                updateSensor('ph-level', 7.0);
                updateSensor('chlorine', 0.7);
                return `Water chemistry tuned in ${DataEngine.zoneConfigs[zoneId].name}.`;
            case 'stabilize-climate':
                updateSensor('temperature', 21);
                if (sensors['humidity']) updateSensor('humidity', 42);
                return `Climate stabilized in ${DataEngine.zoneConfigs[zoneId].name}.`;
            case 'seal-access':
                updateSensor('access-count', 0);
                if (sensors['inventory-level']) updateSensor('inventory-level', Math.max(60, sensors['inventory-level'].value));
                return `Access sealed in ${DataEngine.zoneConfigs[zoneId].name}.`;
            case 'resolve-alerts':
                DataEngine.getActiveAlerts().forEach(alert => DataEngine.resolveAlert(alert.id));
                return `All active alerts resolved.`;
            default:
                return null;
        }
    },

    /**
     * Update telemetry panel with REAL zone data from DataEngine
     * @param {string} zoneId - zone identifier
     */
    updateTelemetryPanel(zoneId) {
        const zoneData = DataEngine.getZoneData(zoneId);
        const config = DataEngine.zoneConfigs[zoneId];

        // Helper to format metrics safely
        const fmt = (v, d = 0, suf = '') => (v === null || v === undefined) ? '—' : (Number(v).toFixed(d) + suf);
        
        // Zone status
        const statusText = zoneData.status === 'alert' ? '⚠️ ALERT' : (
            zoneData.status === 'optimal' ? '✅ OPTIMAL' : '⏱️ NORMAL'
        );
        document.getElementById('zoneStatus').textContent = statusText;
        document.getElementById('zoneStatus').style.color = 
            zoneData.status === 'alert' ? '#ff3366' : (zoneData.status === 'optimal' ? '#00ff88' : '#ffaa00');
        
        // Efficiency bar
        const eff = (zoneData.efficiency === undefined || zoneData.efficiency === null) ? 0 : Number(zoneData.efficiency);
        document.getElementById('efficiencyBar').style.width = eff + '%';
        document.getElementById('efficiencyValue').textContent = fmt(zoneData.efficiency, 0, '%');
        
        // Primary metrics based on zone type
        const metricOne = document.getElementById('metricOne');
        const metricTwo = document.getElementById('metricTwo');
        
        if (config.type === 'energy') {
            metricOne.innerHTML = `⚡ Power: ${fmt(zoneData.primaryMetrics.power, 1, ' kW')}`;
            metricTwo.innerHTML = `🌡️ Temp: ${fmt(zoneData.primaryMetrics.temperature, 1, '°C')}`;
        } else if (config.type === 'agriculture') {
            metricOne.innerHTML = `💧 Moisture: ${fmt(zoneData.primaryMetrics.moisture, 0, '%')}`;
            metricTwo.innerHTML = `☀️ Light: ${fmt(zoneData.primaryMetrics.lightLevel, 0, ' lux')}`;
        } else if (config.type === 'irrigation') {
            metricOne.innerHTML = `💦 Flow: ${fmt(zoneData.primaryMetrics.flowRate, 1, ' L/min')}`;
            metricTwo.innerHTML = `📊 pH: ${fmt(zoneData.primaryMetrics.quality, 1)}`;
        } else {
            metricOne.innerHTML = `🌡️ Temp: ${fmt(zoneData.primaryMetrics.temperature, 1, '°C')}`;
            metricTwo.innerHTML = `💨 Humidity: ${fmt(zoneData.primaryMetrics.humidity, 0, '%')}`;
        }
        
        // Alert count
        document.getElementById('alertCount').textContent = zoneData.alertCount;
        document.getElementById('alertCount').style.color = zoneData.alertCount > 0 ? '#ff3366' : '#00ff88';

        this.updateCommandPanel(zoneId, zoneData);
        this.updateViewport(zoneId, zoneData);
    },

    /**
     * Refresh each zone card summary with live telemetry
     */
    updateZoneSummaries() {
        document.querySelectorAll('.zone-card').forEach(card => {
            const zoneId = card.dataset.zone;
            const zoneData = DataEngine.getZoneData(zoneId);
            const summary = card.querySelector('.zone-summary');
            const statusDot = card.querySelector('.zone-status');

            if (!summary) return;

            const statusLabel = zoneData.status === 'alert' ? 'ALERT' : (zoneData.status === 'optimal' ? 'OPTIMAL' : 'NORMAL');
            const labelValue = zoneData.type === 'agriculture'
                ? `${zoneData.primaryMetrics.moisture}% · ${zoneData.efficiency}%` 
                : zoneData.type === 'energy'
                    ? `${zoneData.primaryMetrics.efficiency}% · ${Math.round(zoneData.primaryMetrics.power)}kW`
                    : zoneData.type === 'irrigation'
                        ? `${zoneData.primaryMetrics.flowRate} L/min · pH ${zoneData.primaryMetrics.quality}`
                        : `${zoneData.primaryMetrics.temperature}°C · ${zoneData.primaryMetrics.humidity}%`;

            summary.textContent = `${statusLabel} · ${labelValue}`;

            if (statusDot) {
                statusDot.classList.toggle('online', zoneData.status !== 'alert');
                statusDot.classList.toggle('offline', zoneData.status === 'alert');
                statusDot.style.color = zoneData.status === 'alert' ? '#ff3366' : '#00ff88';
            }
        });
    },

    /**
     * Render contextual controls for the selected zone
     */
    updateCommandPanel(zoneId, zoneData) {
        const commandPanel = document.getElementById('commandPanel');
        if (!commandPanel) return;

        const commands = this.getZoneCommands(zoneId, zoneData);
        commandPanel.innerHTML = '';

        if (!commands.length) {
            commandPanel.innerHTML = '<div class="command-placeholder">No controls available for this zone.</div>';
            return;
        }

        commands.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'btn-secondary command-btn';
            btn.type = 'button';
            btn.dataset.command = item.id;
            btn.textContent = item.label;
            btn.title = item.description;
            btn.addEventListener('click', () => this.executeZoneCommand(item.id, zoneId));
            commandPanel.appendChild(btn);
        });
    },

    /**
     * Get the contextual commands available for a selected zone
     */
    getZoneCommands(zoneId, zoneData) {
        const commands = [];
        const zoneType = DataEngine.zoneConfigs[zoneId]?.type;

        switch (zoneId) {
            case 'orchard-quad':
                commands.push({ id: 'irrigate', label: 'Start Irrigation', description: 'Launch a water cycle for the orchard.' });
                commands.push({ id: 'boost-light', label: 'Boost Grow Lights', description: 'Increase artificial sunlight for crops.' });
                break;
            case 'robotics-bay':
                commands.push({ id: 'deploy-patrol', label: 'Deploy Patrol', description: 'Send automated rovers through the bay.' });
                commands.push({ id: 'optimize-solar', label: 'Sync Power', description: 'Balance power and drone systems.' });
                break;
            case 'solar-array':
                commands.push({ id: 'optimize-solar', label: 'Maximize Output', description: 'Tune panels for peak solar production.' });
                commands.push({ id: 'seal-access', label: 'Secure Field', description: 'Lock down access to the solar field.' });
                break;
            case 'water-grid':
                commands.push({ id: 'balance-water', label: 'Tune Water Quality', description: 'Adjust pH and flow across the network.' });
                commands.push({ id: 'irrigate', label: 'Boost Flow', description: 'Increase throughput in the water grid.' });
                break;
            case 'lab-center':
                commands.push({ id: 'stabilize-climate', label: 'Stabilize Climate', description: 'Normalize lab temperature and humidity.' });
                commands.push({ id: 'boost-light', label: 'Air Scrubbing', description: 'Improve air quality and filter systems.' });
                break;
            case 'storage-vault':
                commands.push({ id: 'seal-access', label: 'Lock Vault', description: 'Secure storage access points.' });
                commands.push({ id: 'stabilize-climate', label: 'Maintain Inventory', description: 'Keep storage temperature in range.' });
                break;
            default:
                if (zoneType === 'energy') commands.push({ id: 'optimize-solar', label: 'Optimize Energy', description: 'Balance energy production and storage.' });
                break;
        }

        commands.push({ id: 'resolve-alerts', label: 'Resolve Alerts', description: 'Mark all active alerts as resolved.' });
        return commands;
    },

    /**
     * Update a plain-language viewport for the selected zone
     */
    updateViewport(zoneId, zoneData) {
        const viewport = document.getElementById('zoneViewport');
        const title = document.getElementById('viewportTitle');
        const description = document.getElementById('viewportDescription');
        const actions = document.getElementById('viewportActions');
        const viewportState = document.getElementById('viewportState');

        if (!viewport || !title || !description || !actions) return;

        const alerts = DataEngine.getActiveAlerts().filter(a => a.zoneId === zoneId);
        const recentAction = WorkflowEngine.getRecentExecutions(10).find(a => a.zone === zoneId);
        const status = zoneData.status === 'alert' ? 'Attention needed' : (zoneData.status === 'optimal' ? 'Stable' : 'Monitoring');
        const alertCount = alerts.length;
        const issueMessage = alertCount
            ? `There are ${alertCount} active alerts.`
            : zoneData.status === 'alert'
                ? 'Sensor telemetry indicates a potential issue and the system is watching closely.'
                : 'No active alerts right now.';

        title.textContent = DataEngine.zoneConfigs[zoneId]?.name || 'Unknown Zone';
        description.textContent = `Current status: ${status}. ${issueMessage}`;
        viewportState.textContent = zoneData.status === 'alert' ? 'Attention Required' : (zoneData.status === 'optimal' ? 'Stable' : 'Healthy');
        viewportState.classList.toggle('warning', zoneData.status === 'alert');
        viewportState.classList.toggle('healthy', zoneData.status !== 'alert');

        actions.innerHTML = '';
        actions.insertAdjacentHTML('beforeend', `
            <div class="viewport-line"><span class="viewport-bullet">•</span> Efficiency ${zoneData.efficiency}%</div>
            <div class="viewport-line"><span class="viewport-bullet">•</span> Primary sensor readings updated ${Math.round((Date.now() - zoneData.lastUpdate) / 1000)}s ago.</div>
        `);

        if (alertCount) {
            actions.insertAdjacentHTML('beforeend', `
                <div class="viewport-line"><span class="viewport-bullet">•</span> ${alertCount} active alert${alertCount === 1 ? '' : 's'} in this zone.</div>
            `);
        }

        if (recentAction) {
            actions.insertAdjacentHTML('beforeend', `
                <div class="viewport-line"><span class="viewport-bullet">•</span> Last automation: ${recentAction.impact}</div>
            `);
        }

        if (alerts.length) {
            alerts.slice(0, 2).forEach(alert => {
                actions.insertAdjacentHTML('beforeend', `
                    <div class="viewport-line alert-note"><span class="viewport-bullet">⚠</span> ${alert.sensorType} is outside thresholds (${alert.value}${alert.unit}).</div>
                `);
            });
        }
    },
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
                this.persistNodeStorage();
                
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
        const existing = document.querySelector(`.node-item[data-node="${node.id}"]`);
        if (existing) return;

        const nodeElement = document.createElement('div');
        nodeElement.className = 'node-item';
        nodeElement.dataset.node = node.id;
        nodeElement.dataset.ip = node.ip || '';
        nodeElement.dataset.addedAt = node.addedAt || new Date().toLocaleString();

        nodeElement.innerHTML = `
            <div class="node-status online"></div>
            <div class="node-info">
                <span class="node-name">${node.name}</span>
                <span class="node-type">${node.type}</span>
            </div>
            <button type="button" class="node-delete" title="Remove node" style="margin-left:auto;background:transparent;border:none;color:inherit;font-size:1.1rem;cursor:pointer;">×</button>
        `;

        nodesList.insertBefore(nodeElement, nodesList.firstChild);
        this.attachNodeItemHandlers();
    },

    loadSavedNodes() {
        const nodesList = document.getElementById('nodesList');
        const savedNodes = StorageManager.getNodes();

        if (savedNodes.length) {
            nodesList.innerHTML = '';
            savedNodes.forEach(node => this.addNodeToList(node));
        } else {
            this.attachNodeItemHandlers();
        }
    },

    persistNodeStorage() {
        const nodes = Array.from(document.querySelectorAll('.node-item')).map(item => ({
            id: item.dataset.node,
            name: item.querySelector('.node-name')?.textContent || item.dataset.node,
            type: item.querySelector('.node-type')?.textContent || 'Node',
            ip: item.dataset.ip || '',
            status: item.querySelector('.node-status')?.classList.contains('online') ? 'online' : 'offline',
            addedAt: item.dataset.addedAt || new Date().toLocaleString()
        }));
        StorageManager.saveNodes(nodes);
    },

    attachNodeItemHandlers() {
        document.querySelectorAll('.node-item').forEach(item => {
            let deleteButton = item.querySelector('.node-delete');
            if (!deleteButton) {
                deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'node-delete';
                deleteButton.title = 'Remove node';
                deleteButton.textContent = '×';
                deleteButton.style.cssText = 'margin-left:auto;background:transparent;border:none;color:inherit;font-size:1.1rem;cursor:pointer;';
                item.appendChild(deleteButton);
            }

            deleteButton.replaceWith(deleteButton.cloneNode(true));
            const freshButton = item.querySelector('.node-delete');
            freshButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const confirmed = window.confirm(`Delete ${item.dataset.node}? This will remove it from the active node list and local storage.`);
                if (confirmed) {
                    this.deleteNode(item.dataset.node);
                }
            });
        });
    },

    deleteNode(nodeId) {
        const nodeElement = document.querySelector(`.node-item[data-node="${nodeId}"]`);
        if (nodeElement) {
            nodeElement.remove();
        }

        StorageManager.removeNode(nodeId);
        this.persistNodeStorage();
        this.showSuccessNotification(`Node ${nodeId} removed successfully.`);
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

            // Update active zone panel, viewport, and zone summaries if a zone is selected
            if (this.currentZone) {
                const zoneData = DataEngine.getZoneData(this.currentZone);
                document.getElementById('efficiencyBar').style.width = zoneData.efficiency + '%';
                document.getElementById('efficiencyValue').textContent = zoneData.efficiency + '%';
                this.updateTelemetryPanel(this.currentZone);
                this.updateViewport(this.currentZone, zoneData);
                this.updateZoneSummaries();
            }
        };

        // Initial update
        updateGauges();

        // Update every 10 seconds (aligned with DataEngine updates)
        setInterval(() => updateGauges(), 10000);

        // Add real workflow execution logs
        this.updateWorkflowLog();
        setInterval(() => this.updateWorkflowLog(), 15000);
        
        // Populate activity log, diagnostics feed, and system metrics
        this.updateActivityLog();
        setInterval(() => this.updateActivityLog(), 10000);
        this.updateSystemHealthMetrics();
        setInterval(() => this.updateSystemHealthMetrics(), 5000);
        this.updateDiagnosticsFeed();
        setInterval(() => this.updateDiagnosticsFeed(), 10000);
    },

    /**
     * Update workflow execution log with real automations
     */
    updateWorkflowLog() {
        const recentActions = WorkflowEngine.getRecentExecutions(5);
        const logContainer = document.getElementById('workflowLog');
        
        logContainer.innerHTML = '';
        
        if (recentActions.length === 0) {
            logContainer.innerHTML = `
                <div class="log-entry" style="padding: 8px; font-size: 12px; opacity: 1;">
                    <p style="color: var(--text-tertiary); margin: 0;">No automation events yet — the system is monitoring live telemetry.</p>
                </div>
            `;
        } else {
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
        }

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
     * Update system diagnostics feed slides with real state summaries
     */
    updateDiagnosticsFeed() {
        const slideTexts = [];
        const activeAlerts = DataEngine.getActiveAlerts();
        const alertSummary = activeAlerts.length
            ? `${activeAlerts.length} active alert${activeAlerts.length === 1 ? '' : 's'} across the estate`
            : 'No active alerts; all monitored zones are stable.';

        const alertsByZone = activeAlerts.reduce((acc, alert) => {
            acc[alert.zoneId] = acc[alert.zoneId] || [];
            acc[alert.zoneId].push(alert);
            return acc;
        }, {});

        const worstZone = Object.keys(alertsByZone).sort((a, b) => alertsByZone[b].length - alertsByZone[a].length)[0] || null;
        const worstName = worstZone ? DataEngine.zoneConfigs[worstZone]?.name || worstZone : 'all zones';
        const efficiency = AnalyticsEngine.getFacilityEfficiency();

        const criticalAlerts = activeAlerts
            .sort((a, b) => (a.severity === 'critical' ? -1 : 1) - (b.severity === 'critical' ? -1 : 1))
            .slice(0, 2)
            .map(a => `${DataEngine.zoneConfigs[a.zoneId]?.name || a.zoneId}: ${a.sensorType} at ${a.value}${a.unit}`);

        const waterGrid = DataEngine.sensors['water-grid'];
        const solarArray = DataEngine.sensors['solar-array'];

        slideTexts.push(`Estate health: ${efficiency}% campus efficiency. ${alertSummary}.`);
        slideTexts.push(criticalAlerts.length
            ? `Top issues: ${criticalAlerts.join(' and ')}.`
            : `No high-severity alerts. All primary systems are operating within expected bands.`);
        slideTexts.push(`Water Grid status: flow ${waterGrid?.['flow-rate']?.value || 'N/A'} L/min, pH ${waterGrid?.['ph-level']?.value || 'N/A'}, chlorine ${waterGrid?.['chlorine']?.value || 'N/A'} ppm.`);
        slideTexts.push(`Solar Array status: ${solarArray?.['efficiency']?.value || 'N/A'}% efficiency, ${solarArray?.['voltage']?.value || 'N/A'}V, ${solarArray?.['current']?.value || 'N/A'}A.`);

        const slides = document.querySelectorAll('.carousel-slide');
        slides.forEach((slide, index) => {
            slide.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;padding:1rem;text-align:center;line-height:1.4;">
                    <span style="font-size:1rem;">${slideTexts[index] || 'Monitoring systems and updating diagnostics...'}</span>
                </div>
            `;
        });
    },

    /**
     * Use browser Performance APIs to populate system health metrics
     */
    updateSystemHealthMetrics() {
        // Memory (Chrome only); else approximate a realistic system load
        let rawMemPercent = 0;
        const hasPerfMemory = performance && performance.memory && performance.memory.usedJSHeapSize > 0 && performance.memory.jsHeapSizeLimit > 0;

        if (hasPerfMemory) {
            rawMemPercent = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;
        } else {
            const solar = DataEngine.sensors['solar-array'];
            const water = DataEngine.sensors['water-grid'];
            const baseSensorHealth = ((solar?.efficiency?.value || 70) + (water?.flow-rate?.value || 40)) / 2;
            rawMemPercent = Math.round(Math.min(90, Math.max(28, baseSensorHealth / 1.2 + 20)));
        }

        if (rawMemPercent < 12) rawMemPercent = 18;
        const displayMemPercent = `${Math.round(rawMemPercent)}%`;
        const gaugeMemPercent = Math.min(100, Math.max(5, Math.round(rawMemPercent)));

        // CPU estimate via event-loop lag measurement
        const t0 = performance.now();
        setTimeout(() => {
            const lag = performance.now() - t0 - 100; // expected 100ms
            let cpuEstimate = Math.min(100, Math.max(10, Math.round((lag / 40) * 100)));
            if (cpuEstimate < 15) cpuEstimate = 18;
            const displayCpu = `${cpuEstimate}%`;

            const cpuLabel = document.getElementById('cpuValue');
            const memLabel = document.getElementById('memValue');
            if (cpuLabel) cpuLabel.textContent = displayCpu;
            if (memLabel) memLabel.textContent = displayMemPercent;

            const circumference = 251.2;
            const cpuOffset = circumference - (cpuEstimate / 100) * circumference;
            const memOffset = circumference - (gaugeMemPercent / 100) * circumference;

            const cpuGauge = document.getElementById('cpuGauge');
            const memGauge = document.getElementById('memGauge');
            if (cpuGauge) cpuGauge.style.strokeDashoffset = cpuOffset;
            if (memGauge) memGauge.style.strokeDashoffset = memOffset;

            this.updateDiagnosticsFeed();
        }, 100);
    },

    /**
     * Run a short demo scenario: detection → automation → resolution
     */
    runDemoScenario() {
        const orchardZone = 'orchard-quad';
        const waterZone = 'water-grid';

        this.selectZone(orchardZone);

        // Force the Orchard zone into a low moisture, low-light state
        const orchardSensors = DataEngine.sensors[orchardZone];
        if (orchardSensors) {
            orchardSensors['soil-moisture'].value = 35;
            orchardSensors['soil-moisture'].timestamp = Date.now();
            orchardSensors['soil-moisture'].status = 'alert';
            orchardSensors['light-level'].value = 9000;
            orchardSensors['light-level'].timestamp = Date.now();
            orchardSensors['light-level'].status = 'alert';
            orchardSensors['ph-level'].value = 6.3;
            orchardSensors['ph-level'].timestamp = Date.now();
            orchardSensors['ph-level'].status = 'alert';
        }

        DataEngine.createAlert(orchardZone, 'soil-moisture', 35, '%');
        DataEngine.createAlert(orchardZone, 'light-level', 9000, 'lux');

        const irrigationWorkflow = WorkflowEngine.workflows.find(w => w.id === 'wf-irrigation-01');
        if (irrigationWorkflow) {
            const trigger = irrigationWorkflow.triggers.find(t => t.sensor === 'soil-moisture');
            if (trigger) {
                WorkflowEngine.executeAction(irrigationWorkflow, trigger, 35);
            }
        }

        // Force the Water Grid into a pH/quality alert state
        const waterSensors = DataEngine.sensors[waterZone];
        if (waterSensors) {
            waterSensors['flow-rate'].value = 12;
            waterSensors['flow-rate'].timestamp = Date.now();
            waterSensors['flow-rate'].status = 'alert';
            waterSensors['ph-level'].value = 6.0;
            waterSensors['ph-level'].timestamp = Date.now();
            waterSensors['ph-level'].status = 'alert';
            waterSensors['chlorine'].value = 0.1;
            waterSensors['chlorine'].timestamp = Date.now();
            waterSensors['chlorine'].status = 'alert';
        }

        DataEngine.createAlert(waterZone, 'ph-level', 6.0, 'pH');
        DataEngine.createAlert(waterZone, 'chlorine', 0.1, 'ppm');

        const waterWorkflow = WorkflowEngine.workflows.find(w => w.zone === waterZone);
        if (waterWorkflow) {
            waterWorkflow.triggers.forEach(trigger => {
                const sensorValue = waterSensors?.[trigger.sensor]?.value;
                if (sensorValue !== undefined) {
                    WorkflowEngine.executeAction(waterWorkflow, trigger, sensorValue);
                }
            });
        }

        // Ensure the water-grid summary shows the alert state too
        DataEngine.addToHistory(waterZone, 'ph-level', waterSensors?.['ph-level']?.value || 0);
        DataEngine.addToHistory(waterZone, 'chlorine', waterSensors?.['chlorine']?.value || 0);

        this.updateWorkflowLog();
        this.updateActivityLog();
        this.updateTelemetryPanel(orchardZone);
        this.updateZoneSummaries();
        this.updateViewport(orchardZone, DataEngine.getZoneData(orchardZone));
        this.showSuccessNotification('Demo launched: Orchard moisture is low and Water Grid chemistry needs attention. Check alerts and telemetry for both zones.');
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

// Expose dashboard globally for runtime tooling and dev hooks
if (typeof window !== 'undefined') {
    window.Dashboard = Dashboard;
}

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Dashboard.init());
} else {
    Dashboard.init();
}
