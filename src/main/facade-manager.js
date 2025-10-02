const { Worker } = require('worker_threads');
const path = require('path');

class FacadeManager {
    constructor() {
        this.worker = null;
        this.requestId = 0;
        this.pendingRequests = new Map();
        this.isHealthy = false;
        
        this.initWorker();
    }

    initWorker() {
        this.worker = new Worker(path.join(__dirname, 'facade-process.js'));
        
        this.worker.on('message', (message) => {
            const { id, type, payload, error } = message;
            
            const resolver = this.pendingRequests.get(id);
            if (resolver) {
                this.pendingRequests.delete(id);
                
                if (type === 'error') {
                    resolver.reject(new Error(error));
                } else {
                    resolver.resolve(payload);
                }
            }

            // Health check
            if (type === 'pong') {
                this.isHealthy = true;
            }
        });

        this.worker.on('error', (error) => {
            console.error('Facade worker error:', error);
            this.isHealthy = false;
            this.restartWorker();
        });

        this.worker.on('exit', (code) => {
            console.log(`Facade worker exited with code ${code}`);
            this.isHealthy = false;
            if (code !== 0) {
                this.restartWorker();
            }
        });

        // Health check interval
        setInterval(() => this.healthCheck(), 30000);
    }

    restartWorker() {
        if (this.worker) {
            this.worker.terminate();
        }
        setTimeout(() => this.initWorker(), 1000);
    }

    healthCheck() {
        if (this.worker && this.isHealthy) {
            this.sendMessage('ping', {}).catch(() => {
                this.isHealthy = false;
                this.restartWorker();
            });
        }
    }

    sendMessage(type, payload) {
        return new Promise((resolve, reject) => {
            const id = this.requestId++;
            this.pendingRequests.set(id, { resolve, reject });
            
            this.worker.postMessage({
                id,
                type,
                payload
            });

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }

    async initService(serviceIndex, serviceDescr) {
        return this.sendMessage('init', { serviceIndex, serviceDescr });
    }

    async getBindings(serviceIndex) {
        return this.sendMessage('bindings', { serviceIndex });
    }

    async getOperations(serviceIndex, binding) {
        return this.sendMessage('operations', { serviceIndex, binding });
    }

    async getOperationInfo(serviceIndex, binding, operation) {
        return this.sendMessage('info', { serviceIndex, binding, operation });
    }

    async destroy() {
        if (this.worker) {
            await this.worker.terminate();
        }
    }
}

module.exports = FacadeManager;