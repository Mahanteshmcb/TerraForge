/* ============================================
   TERRAFORGE - ANALYTICS ENGINE
   Data Analysis & Reporting
   ============================================ */

const AnalyticsEngine = {
    /**
     * Get statistics for a zone
     */
    getZoneStatistics(zoneId, days = 7) {
        const zoneConfig = DataEngine.zoneConfigs[zoneId];
        if (!zoneConfig) return null;

        const stats = {};

        // Get stats for each sensor
        zoneConfig.sensors.forEach(sensorType => {
            const data = DataEngine.getHistoricalData(zoneId, sensorType, days);
            
            if (data.length === 0) return;

            const values = data.map(d => d.value);
            const average = values.reduce((a, b) => a + b, 0) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            const latest = values[values.length - 1];
            const stdDev = Math.sqrt(
                values.reduce((sq, n) => sq + Math.pow(n - average, 2), 0) / values.length
            );

            stats[sensorType] = {
                average: Math.round(average * 100) / 100,
                min: Math.round(min * 100) / 100,
                max: Math.round(max * 100) / 100,
                latest: Math.round(latest * 100) / 100,
                stdDev: Math.round(stdDev * 100) / 100,
                unit: data[0].unit,
                dataPoints: values.length,
                trend: this.calculateTrend(values)
            };
        });

        return stats;
    },

    /**
     * Calculate trend (upward, downward, stable)
     */
    calculateTrend(values) {
        if (values.length < 2) return 'stable';
        
        const recent = values.slice(-10);
        const older = values.slice(-20, -10);
        
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        
        const change = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        if (Math.abs(change) < 2) return 'stable';
        return change > 0 ? 'increasing' : 'decreasing';
    },

    /**
     * Get efficiency score for zone (0-100)
     */
    getZoneEfficiencyScore(zoneId) {
        const config = DataEngine.zoneConfigs[zoneId];
        const sensors = DataEngine.sensors[zoneId];
        
        if (!sensors || !config) return 0;

        let score = 100;
        let count = 0;

        config.sensors.forEach(sensorType => {
            const sensor = sensors[sensorType];
            if (!sensor) return;

            const [min, max] = config.thresholds[sensorType] || [0, 100];
            const target = config.targets[sensorType] || (min + max) / 2;
            
            // Deduct points based on deviation from target
            const deviation = Math.abs(sensor.value - target);
            const range = max - min;
            const penalty = (deviation / range) * 20;
            
            score -= penalty;
            count++;
        });

        return Math.max(0, Math.round(score));
    },

    /**
     * Get overall facility efficiency
     */
    getFacilityEfficiency() {
        const scores = Object.keys(DataEngine.zoneConfigs).map(zoneId => 
            this.getZoneEfficiencyScore(zoneId)
        );
        
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    },

    /**
     * Get system health report
     */
    getHealthReport() {
        const totalSensors = Object.values(DataEngine.sensors).reduce(
            (sum, zone) => sum + Object.keys(zone).length, 0
        );

        const statusCounts = {
            optimal: 0,
            normal: 0,
            alert: 0
        };

        Object.values(DataEngine.sensors).forEach(zone => {
            Object.values(zone).forEach(sensor => {
                statusCounts[sensor.status]++;
            });
        });

        const activeAlerts = DataEngine.alerts.filter(a => !a.resolved).length;
        const totalAlerts = DataEngine.alerts.length;

        return {
            totalSensors,
            optimalCount: statusCounts.optimal,
            normalCount: statusCounts.normal,
            alertCount: statusCounts.alert,
            optimalPercentage: Math.round((statusCounts.optimal / totalSensors) * 100),
            activeAlerts,
            totalAlerts,
            alertResolutionRate: totalAlerts > 0 ? Math.round(((totalAlerts - activeAlerts) / totalAlerts) * 100) : 0,
            systemHealth: {
                overall: Math.round((statusCounts.optimal / totalSensors) * 100),
                status: statusCounts.alert > 0 ? 'warning' : (statusCounts.optimal > (totalSensors * 0.7) ? 'healthy' : 'normal')
            }
        };
    },

    /**
     * Get energy production report
     */
    getEnergyReport() {
        const solarData = DataEngine.getHistoricalData('solar-array', 'current', 1);
        const hour = new Date().getHours();
        
        if (solarData.length === 0) {
            return { daily: 0, hourly: 0, peak: 0, estimate: 0 };
        }

        // Calculate current production
        const currentVoltage = DataEngine.sensors['solar-array']['voltage']?.value || 480;
        const currentCurrent = DataEngine.sensors['solar-array']['current']?.value || 0;
        const currentPower = (currentVoltage * currentCurrent) / 1000; // kW

        // Estimate daily production based on time of day
        const dayProgress = hour / 24;
        const sunFactor = Math.sin(dayProgress * Math.PI);
        const estimatedDaily = currentPower / Math.max(sunFactor, 0.1) * 0.85; // 85% efficiency factor

        return {
            current: Math.round(currentPower * 100) / 100,
            daily: Math.round(estimatedDaily * 100) / 100,
            hourly: Math.round(currentPower * 100) / 100,
            peak: 180, // kW system capacity
            efficiency: DataEngine.sensors['solar-array']['efficiency']?.value || 0,
            temperature: DataEngine.sensors['solar-array']['temperature']?.value || 0
        };
    },

    /**
     * Get crop health report
     */
    getCropHealthReport() {
        const orchard = DataEngine.sensors['orchard-quad'];
        if (!orchard) return null;

        const stats = this.getZoneStatistics('orchard-quad', 7);
        
        return {
            overallHealth: this.getZoneEfficiencyScore('orchard-quad'),
            soilMoisture: {
                current: orchard['soil-moisture']?.value || 0,
                optimal: 65,
                trend: orchard['soil-moisture']?.trend || 'stable'
            },
            lightExposure: {
                current: orchard['light-level']?.value || 0,
                optimal: 50000,
                hours: Math.round((orchard['light-level']?.value || 0) / 10000)
            },
            temperature: {
                current: orchard['temperature']?.value || 0,
                optimal: 24,
                range: [18, 32]
            },
            phLevel: {
                current: orchard['ph-level']?.value || 0,
                optimal: 6.8,
                status: Math.abs((orchard['ph-level']?.value || 0) - 6.8) < 0.5 ? 'optimal' : 'adjustment-needed'
            },
            irrigationNeeded: (orchard['soil-moisture']?.value || 100) < 50,
            nextIrrigationIn: Math.round(((orchard['soil-moisture']?.value || 100) - 50) / 10) + ' hours'
        };
    },

    /**
     * Get security report
     */
    getSecurityReport() {
        const robotics = DataEngine.sensors['robotics-bay'];
        if (!robotics) return null;

        const patrols = WorkflowEngine.executionLog.filter(
            e => e.zone === 'robotics-bay' && (Date.now() - e.timestamp) < (24 * 60 * 60 * 1000)
        );

        return {
            roverStatus: robotics['vibration']?.value < 5 ? 'idle' : 'active',
            patrolsToday: patrols.length,
            lastPatrol: patrols.length > 0 ? patrols[patrols.length - 1].timestamp : null,
            systemStatus: robotics['power-draw']?.value > 10 ? 'active' : 'idle',
            batteryLevel: 85 + Math.random() * 10,
            alerts: DataEngine.alerts.filter(a => a.zoneId === 'robotics-bay' && !a.resolved)
        };
    },

    /**
     * Get detailed zone report
     */
    getZoneReport(zoneId) {
        const config = DataEngine.zoneConfigs[zoneId];
        const efficiency = this.getZoneEfficiencyScore(zoneId);
        const stats = this.getZoneStatistics(zoneId, 7);
        const alerts = DataEngine.alerts.filter(a => a.zoneId === zoneId && !a.resolved);

        return {
            zoneId,
            name: config.name,
            type: config.type,
            efficiency,
            statistics: stats,
            activeAlerts: alerts.length,
            alerts: alerts,
            lastUpdate: DataEngine.sensors[zoneId] ? 
                Math.max(...Object.values(DataEngine.sensors[zoneId]).map(s => s.timestamp)) : null
        };
    }
};

// Expose to global scope
if (typeof window !== 'undefined') {
    window.AnalyticsEngine = AnalyticsEngine;
}

// Initialize analytics engine
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        AnalyticsEngine.init();
    });
}
