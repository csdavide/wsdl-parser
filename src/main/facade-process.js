const { parentPort, workerData } = require('worker_threads');
const Facade = require('./facade');

class FacadeProcess {
    constructor() {
        this.services = new Map();
        parentPort.on('message', this.handleMessage.bind(this));
    }

    handleMessage(message) {
        const { id, type, payload } = message;
        
        try {
            switch (type) {
                case 'init':
                    this.initService(id, payload);
                    break;
                case 'bindings':
                    this.getBindings(id, payload);
                    break;
                case 'operations':
                    this.getOperations(id, payload);
                    break;
                case 'info':
                    this.getOperationInfo(id, payload);
                    break;
                case 'ping':
                    parentPort.postMessage({ id, type: 'pong' });
                    break;
                default:
                    throw new Error(`Unknown message type: ${type}`);
            }
        } catch (error) {
            parentPort.postMessage({ 
                id, 
                type: 'error', 
                error: error.message 
            });
        }
    }

    initService(id, { serviceIndex, serviceDescr }) {
        try {					
            const service = new Facade(serviceDescr);
            this.services.set(serviceIndex, service);
            
            parentPort.postMessage({ 
                id, 
                type: 'init_success',
                payload: { serviceIndex }
            });
        } catch (error) {
            parentPort.postMessage({ 
                id, 
                type: 'init_error',
                error: error.message 
            });
        }
    }

    getBindings(id, { serviceIndex }) {
        const service = this.services.get(serviceIndex);
        if (!service) {
            throw new Error(`Service ${serviceIndex} not initialized`);
        }

        const bindings = service.bindings();
        parentPort.postMessage({ 
            id, 
            type: 'bindings_result',
            payload: bindings
        });
    }

    getOperations(id, { serviceIndex, binding }) {
        const service = this.services.get(serviceIndex);
        if (!service) {
            throw new Error(`Service ${serviceIndex} not initialized`);
        }

        const operations = service.operations(binding);
        parentPort.postMessage({ 
            id, 
            type: 'operations_result',
            payload: operations
        });
    }

    getOperationInfo(id, { serviceIndex, binding, operation }) {
        const service = this.services.get(serviceIndex);
        if (!service) {
            throw new Error(`Service ${serviceIndex} not initialized`);
        }

        const sampleRequest = service.sampleRequest(binding, operation);
        const sampleResponse = service.sampleResponse(binding, operation);
        
        const result = {
            request: service.escape(sampleRequest),
            response: service.escape(sampleResponse)
        };

        parentPort.postMessage({ 
            id, 
            type: 'info_result',
            payload: result
        });
    }
}

new FacadeProcess();