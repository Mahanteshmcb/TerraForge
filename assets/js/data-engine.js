/* ============================================
   TERRAFORGE - REAL-TIME DATA ENGINE
   Production-Grade IoT Sensor Simulation
   ============================================ */

const DataEngine = {
    // Real sensor data storage
    sensors: {},
    alerts: [],
    workflows: [],
    history: [],
    
    // Zone configurations with real-world parameters
    zoneConfigs: {
        'robotics-bay': {
            name: 'Robotics Bay',
            type: 'automation',
            sensors: ['temperature', 'humidity', 'power-draw', 'vibration'],
            targets: { temp: 22, humidity: 45, powerDraw: 15 },
            thresholds: { temp: [15, 30], humidity: [30, 60], powerDraw: [0, 20] }
        },
        'orchard-quad': {
            name: 'Orchard Quad',
            type: 'agriculture',
            sensors: ['soil-moisture', 'light-level', 'temperature', 'humidity', 'ph-level'],
            targets: { soilMoisture: 65, lightLevel: 50000, temp: 24, humidity: 55, ph: 6.8 },
            thresholds: { soilMoisture: [40, 80], lightLevel: [30000, 80000], temp: [18, 32], humidity: [40, 70], ph: [6.0, 7.5] }
        },
        'solar-array': {
            name: 'Solar Array',
            type: 'energy',
            sensors: ['solar-radiation', 'temperature', 'voltage', 'current', 'efficiency'],
            targets: { efficiency: 90, voltage: 480, current: 100 },
            thresholds: { temperature: [15, 65], voltage: [400, 500], current: [0, 150], efficiency: [70, 100] }
        },
        'water-grid': {
            name: 'Water Grid',
            type: 'irrigation',
            sensors: ['flow-rate', 'pressure', 'ph-level', 'chlorine', 'temperature'],
            targets: { flowRate: 50, pressure: 3.5, ph: 7.0 },
            thresholds: { flowRate: [0, 100], pressure: [2.0, 5.0], ph: [6.5, 7.5], chlorine: [0.2, 1.0], temperature: [10, 30] }
        },
        'lab-center': {
            name: 'Lab Center',
            type: 'research',
            sensors: ['temperature', 'humidity', 'air-quality', 'contamination', 'equipment-status'],
            targets: { temp: 21, humidity: 40, airQuality: 95 },
            thresholds: { temperature: [18, 24], humidity: [35, 45], airQuality: [90, 100] }
        },
        'storage-vault': {
            name: 'Storage Vault',
            type: 'storage',
            sensors: ['temperature', 'humidity', 'access-count', 'inventory-level'],
            targets: { temp: 16, humidity: 30, inventoryLevel: 75 },
            thresholds: { temperature: [10, 20], humidity: [20, 40], inventoryLevel: [50, 100] }
        }
    },

    /**
     * Initialize the data engine
     */
    init() {
        this.initializeSensors();
        this.startRealtimeUpdates();
        this.generateHistoricalData();
        console.log('DataEngine: Initialized with realistic IoT sensors');
    },

    /**
     * Initialize all sensors with realistic starting values
     */
    initializeSensors() {
        Object.entries(this.zoneConfigs).forEach(([zoneId, config]) => {
            this.sensors[zoneId] = {};
            
            config.sensors.forEach(sensorType => {
                const realValue = this.generateRealisticValue(zoneId, sensorType);
                this.sensors[zoneId][sensorType] = {
                    value: realValue,
                    unit: this.getSensorUnit(sensorType),
                    timestamp: Date.now(),
                    status: this.getStatusForValue(zoneId, sensorType, realValue),
                    trend: 'stable'
                };
            });
        });
    },

    /**
     * Generate realistic sensor values based on zone and time of day
     */
    generateRealisticValue(zoneId, sensorType) {
        const hour = new Date().getHours();
        const config = this.zoneConfigs[zoneId];
        const [minThreshold, maxThreshold] = config.thresholds[sensorType] || [0, 100];
        const target = config.targets[sensorType];

        // Realistic variations based on sensor type and time
        switch (sensorType) {
            case 'solar-radiation':
                // Peak at noon, low at night
                const sunFactor = Math.sin((hour - 6) / 12 * Math.PI);
                return Math.max(0, Math.round(50000 * sunFactor + (Math.random() - 0.5) * 5000));
            
            case 'temperature':
                // Realistic daily cycle
                const tempCycle = 5 * Math.sin((hour - 12) / 12 * Math.PI);
                return Math.round((target || 22) + tempCycle + (Math.random() - 0.5) * 3);
            
            case 'humidity':
                // Inverse to temperature
                const humidityBase = target || 50;
                return Math.min(100, Math.max(0, humidityBase + (Math.random() - 0.5) * 15));
            
            case 'soil-moisture':
                // Gradually decreases with time, resets after irrigation
                return Math.round(target + (Math.random() - 0.5) * 20);
            
            case 'light-level':
                // Follows sun cycle
                const lightFactor = Math.max(0, Math.sin((hour - 6) / 12 * Math.PI));
                return Math.round(target * lightFactor + (Math.random() - 0.5) * 10000);
            
            case 'power-draw':
                // Peak during operational hours (8am-6pm)
                const isPeakHours = hour >= 8 && hour <= 18;
                return Math.round(isPeakHours ? (target + Math.random() * 5) : (target / 3 + Math.random() * 2));
            
            case 'efficiency':
                // Solar array efficiency based on time and temperature
                const tempEffect = Math.max(0.5, 1 - Math.abs(55 - (target || 50)) / 100);
                return Math.round(85 * tempEffect + Math.random() * 10);
            
            case 'voltage':
                return Math.round(target + (Math.random() - 0.5) * 20);
            
            case 'current':
                const isPeak = hour >= 8 && hour <= 18;
                return Math.round(isPeak ? (target * 0.8 + Math.random() * 30) : (target * 0.2));
            
            case 'flow-rate':
                // Higher during irrigation cycles (early morning, evening)
                const isIrrigationTime = (hour >= 4 && hour <= 7) || (hour >= 17 && hour <= 20);
                return Math.round(isIrrigationTime ? (target * 1.2) : (target * 0.3 + Math.random() * 10));
            
            case 'pressure':
                return Math.round(target + (Math.random() - 0.5) * 0.5);
            
            case 'ph-level':
                return Math.round((target + (Math.random() - 0.5) * 0.3) * 10) / 10;
            
            case 'chlorine':
                return Math.round((0.5 + Math.random() * 0.4) * 10) / 10;
            
            case 'air-quality':
                // Higher in sealed environment
                return Math.round(target - Math.random() * 5);
            
            default:
                return Math.round(target || 50);
        }
    },

    /**
     * Get appropriate unit for sensor type
     */
    getSensorUnit(sensorType) {
        const units = {
            'temperature': '°C',
            'humidity': '%',
            'soil-moisture': '%',
            'light-level': 'lux',
            'power-draw': 'kW',
            'solar-radiation': 'W/m²',
            'voltage': 'V',
            'current': 'A',
            'efficiency': '%',
            'flow-rate': 'L/min',
            'pressure': 'bar',
            'ph-level': 'pH',
            'chlorine': 'ppm',
            'air-quality': '%',
            'contamination': 'ppm',
            'access-count': 'count',
            'equipment-status': 'status',
            'inventory-level': '%'
        };
        return units[sensorType] || 'unit';
    },

    /**
     * Determine sensor status based on value and thresholds
     */
    getStatusForValue(zoneId, sensorType, value) {
        const config = this.zoneConfigs[zoneId];
        const [min, max] = config.thresholds[sensorType] || [0, 100];
        
        if (value < min || value > max) return 'alert';
        if (Math.abs(value - (config.targets[sensorType] || (min + max) / 2)) < (max - min) * 0.1) return 'optimal';
        return 'normal';
    },

    /**
     * Start real-time sensor updates (every 10 seconds)
     */
    startRealtimeUpdates() {
        setInterval(() => {
            Object.entries(this.sensors).forEach(([zoneId, zoneSensors]) => {
                Object.entries(zoneSensors).forEach(([sensorType, sensorData]) => {
                    const oldValue = sensorData.value;
                    const newValue = this.generateRealisticValue(zoneId, sensorType);
                    const change = newValue - oldValue;

                    // Determine trend
                    if (Math.abs(change) < 1) {
                        sensorData.trend = 'stable';
                    } else if (change > 0) {
                        sensorData.trend = 'increasing';
                    } else {
                        sensorData.trend = 'decreasing';
                    }

                    sensorData.value = newValue;
                    sensorData.timestamp = Date.now();
                    sensorData.status = this.getStatusForValue(zoneId, sensorType, newValue);

                    // Add to history
                    this.addToHistory(zoneId, sensorType, newValue);

                    // Check for alerts
                    if (sensorData.status === 'alert') {
                        this.createAlert(zoneId, sensorType, newValue, sensorData.unit);
                    }
                });
            });
        }, 10000); // Update every 10 seconds
    },

    /**
     * Generate 7 days of historical data for analytics
     */
    generateHistoricalData() {
        const now = Date.now();
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        
        for (let time = sevenDaysAgo; time < now; time += 3600000) { // 1-hour intervals
            Object.entries(this.sensors).forEach(([zoneId, zoneSensors]) => {
                Object.keys(zoneSensors).forEach(sensorType => {
                    const value = this.generateRealisticValue(zoneId, sensorType);
                    this.addToHistory(zoneId, sensorType, value, time);
                });
            });
        }
    },

    /**
     * Add data point to history
     */
    addToHistory(zoneId, sensorType, value, timestamp = Date.now()) {
        this.history.push({
            zoneId,
            sensorType,
            value,
            timestamp,
            unit: this.getSensorUnit(sensorType)
        });

        // Keep last 1000 entries per sensor
        const key = `${zoneId}-${sensorType}`;
        const relevant = this.history.filter(h => `${h.zoneId}-${h.sensorType}` === key);
        if (relevant.length > 1000) {
            const removeCount = relevant.length - 1000;
            this.history = this.history.filter(h => relevant.slice(removeCount).includes(h));
        }
    },

    /**
     * Create alert when threshold exceeded
     */
    createAlert(zoneId, sensorType, value, unit) {
        const config = this.zoneConfigs[zoneId];
        const threshold = config?.thresholds?.[sensorType];
        
        // Skip if no threshold defined
        if (!threshold) return;

        const existingAlert = this.alerts.find(a => 
            a.zoneId === zoneId && a.sensorType === sensorType && !a.resolved
        );

        if (!existingAlert) {
            this.alerts.push({
                id: `alert-${Date.now()}`,
                zoneId,
                sensorType,
                value,
                unit,
                threshold: threshold,
                timestamp: Date.now(),
                severity: value > threshold[1] ? 'critical' : 'warning',
                resolved: false,
                actions: this.getRecommendedActions(zoneId, sensorType)
            });
        }
    },

    /**
     * Get recommended actions for an alert
     */
    getRecommendedActions(zoneId, sensorType) {
        const actions = {
            'temperature-high': 'Increase cooling capacity or check ventilation system',
            'temperature-low': 'Enable heating system or check insulation',
            'soil-moisture-low': 'Trigger irrigation cycle immediately',
            'power-draw-high': 'Reduce non-essential systems or check for faults',
            'humidity-high': 'Activate dehumidification system',
            'flow-rate-low': 'Check water pump and pipeline pressure',
            'efficiency-low': 'Clean solar panels and check for obstructions'
        };
        
        const key = `${sensorType}-${this.sensors[zoneId][sensorType].value > 
                     (this.zoneConfigs[zoneId].thresholds[sensorType][1] + 
                      this.zoneConfigs[zoneId].thresholds[sensorType][0]) / 2 ? 'high' : 'low'}`;
        
        return [actions[key] || 'Check sensor readings and system status'];
    },

    /**
     * Get zone data formatted for dashboard
     */
    getZoneData(zoneId) {
        const zoneSensors = this.sensors[zoneId] || {};
        const config = this.zoneConfigs[zoneId];
        
        // Calculate overall efficiency
        const statusCounts = Object.values(zoneSensors).reduce((acc, sensor) => {
            acc[sensor.status] = (acc[sensor.status] || 0) + 1;
            return acc;
        }, {});

        const totalSensors = Object.keys(zoneSensors).length;
        const optimalCount = statusCounts.optimal || 0;
        const efficiency = Math.round((optimalCount / totalSensors) * 100);

        // Get primary metrics based on zone type
        let primaryMetrics = {};
        switch (config.type) {
            case 'energy':
                primaryMetrics = {
                    efficiency: zoneSensors['efficiency']?.value || 0,
                    temperature: zoneSensors['temperature']?.value || 0,
                    power: zoneSensors['current']?.value * 0.48 || 0 // Simplified calculation
                };
                break;
            case 'agriculture':
                primaryMetrics = {
                    moisture: zoneSensors['soil-moisture']?.value || 0,
                    temperature: zoneSensors['temperature']?.value || 0,
                    lightLevel: zoneSensors['light-level']?.value || 0
                };
                break;
            case 'irrigation':
                primaryMetrics = {
                    flowRate: zoneSensors['flow-rate']?.value || 0,
                    pressure: zoneSensors['pressure']?.value || 0,
                    quality: zoneSensors['ph-level']?.value || 0
                };
                break;
            default:
                primaryMetrics = {
                    temperature: zoneSensors['temperature']?.value || 0,
                    humidity: zoneSensors['humidity']?.value || 0,
                    power: zoneSensors['power-draw']?.value || 0
                };
        }

        return {
            zoneId,
            name: config.name,
            type: config.type,
            efficiency: efficiency,
            status: statusCounts.alert > 0 ? 'alert' : (statusCounts.optimal > (totalSensors * 0.7) ? 'optimal' : 'normal'),
            sensors: zoneSensors,
            primaryMetrics,
            alertCount: this.alerts.filter(a => a.zoneId === zoneId && !a.resolved).length,
            lastUpdate: Math.max(...Object.values(zoneSensors).map(s => s.timestamp))
        };
    },

    /**
     * Get historical data for charts
     */
    getHistoricalData(zoneId, sensorType, days = 7) {
        const now = Date.now();
        const timeframe = days * 24 * 60 * 60 * 1000;
        
        return this.history.filter(h => 
            h.zoneId === zoneId && 
            h.sensorType === sensorType && 
            (now - h.timestamp) < timeframe
        ).sort((a, b) => a.timestamp - b.timestamp);
    },

    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return this.alerts.filter(a => !a.resolved);
    },

    /**
     * Resolve an alert
     */
    resolveAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolvedTime = Date.now();
        }
    }
};

// Expose to global scope
if (typeof window !== 'undefined') {
    window.DataEngine = DataEngine;
}

// Initialize data engine when module loads
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => DataEngine.init(), 500);
    });
}
