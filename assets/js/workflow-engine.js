/* ============================================
   TERRAFORGE - AUTOMATION WORKFLOW ENGINE
   Real-World Automation Scenarios
   ============================================ */

const WorkflowEngine = {
    workflows: [],
    automations: [],
    executionLog: [],

    /**
     * Initialize with real-world automation scenarios
     */
    init() {
        this.defineWorkflows();
        this.startWorkflowMonitor();
        console.log('WorkflowEngine: Loaded with real automation scenarios');
    },

    /**
     * Define actual automation workflows
     */
    defineWorkflows() {
        // WORKFLOW 1: Solar Array Energy Optimization
        this.workflows.push({
            id: 'wf-solar-01',
            name: 'Solar Array Peak Generation Management',
            description: 'Automatically redirect excess power to battery storage during peak hours',
            zone: 'solar-array',
            triggers: [
                { sensor: 'efficiency', operator: '>', value: 85, action: 'redirect-to-storage' },
                { sensor: 'efficiency', operator: '<', value: 40, action: 'grid-fallback' }
            ],
            enabled: true,
            lastExecuted: null
        });

        // WORKFLOW 2: Irrigation Automation
        this.workflows.push({
            id: 'wf-irrigation-01',
            name: 'Intelligent Crop Irrigation',
            description: 'Trigger irrigation when soil moisture drops below 50% or after 24h period',
            zone: 'orchard-quad',
            triggers: [
                { sensor: 'soil-moisture', operator: '<', value: 50, action: 'start-irrigation' },
                { sensor: 'light-level', operator: '<', value: 10000, action: 'night-cycle-check' }
            ],
            enabled: true,
            lastExecuted: null,
            schedule: 'daily-6am'
        });

        // WORKFLOW 3: Climate Control
        this.workflows.push({
            id: 'wf-climate-01',
            name: 'Lab Center Climate Regulation',
            description: 'Maintain optimal temperature and humidity for research equipment',
            zone: 'lab-center',
            triggers: [
                { sensor: 'temperature', operator: '>', value: 24, action: 'cool-mode' },
                { sensor: 'temperature', operator: '<', value: 18, action: 'heat-mode' },
                { sensor: 'humidity', operator: '>', value: 45, action: 'dehumidify' },
                { sensor: 'humidity', operator: '<', value: 35, action: 'humidify' }
            ],
            enabled: true,
            lastExecuted: null
        });

        // WORKFLOW 4: Robotics Bay Maintenance
        this.workflows.push({
            id: 'wf-robotics-01',
            name: 'Autonomous Rover Patrol Schedule',
            description: 'Run security patrol cycles every 4 hours or on motion detection',
            zone: 'robotics-bay',
            triggers: [
                { sensor: 'vibration', operator: '>', value: 5, action: 'manual-alert' }
            ],
            schedule: 'every-4-hours',
            enabled: true,
            lastExecuted: null
        });

        // WORKFLOW 5: Water Quality Monitoring
        this.workflows.push({
            id: 'wf-water-01',
            name: 'Water System Quality Control',
            description: 'Alert operators if pH or chlorine levels drift from target',
            zone: 'water-grid',
            triggers: [
                { sensor: 'ph-level', operator: '!=', value: 7.0, tolerance: 0.3, action: 'balance-ph' },
                { sensor: 'chlorine', operator: '<', value: 0.5, action: 'add-chlorine' }
            ],
            enabled: true,
            lastExecuted: null
        });

        // WORKFLOW 6: Power Management
        this.workflows.push({
            id: 'wf-power-01',
            name: 'Facility Power Load Balancing',
            description: 'Shift non-critical loads during peak demand',
            zone: 'storage-vault',
            triggers: [
                { sensor: 'power-draw', operator: '>', value: 20, action: 'peak-mode' },
                { sensor: 'power-draw', operator: '<', value: 8, action: 'night-mode' }
            ],
            enabled: true,
            lastExecuted: null
        });
    },

    /**
     * Start monitoring workflows and executing them
     */
    startWorkflowMonitor() {
        setInterval(() => {
            this.workflows.forEach(workflow => {
                if (!workflow.enabled) return;

                const zoneData = DataEngine.sensors[workflow.zone];
                if (!zoneData) return;

                // Check each trigger
                workflow.triggers.forEach(trigger => {
                    const sensorValue = zoneData[trigger.sensor]?.value;
                    if (sensorValue === undefined) return;

                    let triggered = false;

                    switch (trigger.operator) {
                        case '>':
                            triggered = sensorValue > trigger.value;
                            break;
                        case '<':
                            triggered = sensorValue < trigger.value;
                            break;
                        case '!=':
                            triggered = Math.abs(sensorValue - trigger.value) > (trigger.tolerance || 0);
                            break;
                        case '==':
                            triggered = sensorValue === trigger.value;
                            break;
                    }

                    if (triggered) {
                        this.executeAction(workflow, trigger, sensorValue);
                    }
                });
            });
        }, 15000); // Check every 15 seconds
    },

    /**
     * Execute an automation action
     */
    executeAction(workflow, trigger, sensorValue) {
        const action = {
            id: `action-${Date.now()}`,
            workflowId: workflow.id,
            workflowName: workflow.name,
            zone: workflow.zone,
            action: trigger.action,
            trigger: {
                sensor: trigger.sensor,
                operator: trigger.operator,
                value: trigger.value,
                actualValue: sensorValue
            },
            timestamp: Date.now(),
            status: 'executed',
            impact: this.getActionImpact(trigger.action)
        };

        this.automations.push(action);
        this.executionLog.push(action);
        workflow.lastExecuted = Date.now();

        // Keep log size reasonable
        if (this.executionLog.length > 500) {
            this.executionLog = this.executionLog.slice(-500);
        }

        return action;
    },

    /**
     * Get the impact/result of an action
     */
    getActionImpact(action) {
        const impacts = {
            'redirect-to-storage': 'Redirecting 150kW excess power to battery storage',
            'grid-fallback': 'Switching to grid power supply',
            'start-irrigation': 'Irrigation cycle started: 30 min duration',
            'night-cycle-check': 'Night cycle monitoring activated',
            'cool-mode': 'Cooling system activated, target: 22°C',
            'heat-mode': 'Heating system activated, target: 21°C',
            'dehumidify': 'Dehumidification system activated',
            'humidify': 'Humidification system activated',
            'manual-alert': 'Security alert: Manual inspection recommended',
            'balance-ph': 'pH adjustment activated: +0.2 neutralizer',
            'add-chlorine': 'Chlorine dose: 5 units added',
            'peak-mode': 'Peak demand mode: Reduced non-critical loads',
            'night-mode': 'Night mode: Minimal power consumption'
        };
        return impacts[action] || 'Action executed';
    },

    /**
     * Get recent workflow executions
     */
    getRecentExecutions(count = 10) {
        return this.executionLog.slice(-count).reverse();
    },

    /**
     * Get workflow status
     */
    getWorkflowStatus() {
        return this.workflows.map(wf => ({
            id: wf.id,
            name: wf.name,
            zone: wf.zone,
            enabled: wf.enabled,
            lastExecuted: wf.lastExecuted,
            executionCount: this.executionLog.filter(e => e.workflowId === wf.id).length
        }));
    },

    /**
     * Enable/disable a workflow
     */
    toggleWorkflow(workflowId, enabled) {
        const workflow = this.workflows.find(w => w.id === workflowId);
        if (workflow) {
            workflow.enabled = enabled;
        }
    }
};

// Expose to global scope
if (typeof window !== 'undefined') {
    window.WorkflowEngine = WorkflowEngine;
}

// Initialize on module load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => WorkflowEngine.init(), 1000);
    });
}
