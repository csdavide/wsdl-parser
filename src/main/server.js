const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const FacadeManager = require('./facade-manager');

// Configuration
const resourceDir = path.resolve(__dirname, '../../resource');
const PORT = 3001;
const WSDL_DIR = path.join(resourceDir, 'wsdl');
const URI_BASE = 'http://localhost:3001/wsdl/';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/static', express.static(path.join(resourceDir, 'static')));
app.set('view engine', 'ejs');
app.set('views', path.join(resourceDir, 'views'));

// State management
const wsdlMap = new Map();
const facadeManager = new FacadeManager();

// Utility functions
const listWSDLFiles = async (directoryPath) => {
    try {
        const items = await fs.promises.readdir(directoryPath);
        const wsdlFiles = [];
        
        for (const item of items) {
            const fullPath = path.join(directoryPath, item);
            try {
                const stats = await fs.promises.stat(fullPath);
                if (stats.isFile() && path.extname(item).toLowerCase() === '.wsdl') {
                    wsdlFiles.push(item);
                }
            } catch (err) {
                console.error(`Error accessing file ${item}:`, err);
            }
        }
        
        return wsdlFiles.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    } catch (err) {
        console.error('Error reading directory:', err);
        throw err;
    }
};

const serviceItem = (item, index) => {
    return `<option value="${index}">${item}</option>`;
};

const initializeWSDL = async () => {
    try {
        const wsdlFiles = await listWSDLFiles(WSDL_DIR);
        const serviceOptions = wsdlFiles.map((item, index) => serviceItem(item, index));
        
        wsdlMap.set('files', wsdlFiles);
        wsdlMap.set('options', serviceOptions.join(''));
        
        console.log(`Loaded ${wsdlFiles.length} WSDL files`);
    } catch (err) {
        console.error('Failed to initialize WSDL files:', err);
        wsdlMap.set('files', []);
        wsdlMap.set('options', '');
    }
};

// Routes

app.get('/services', cors(), (req, res) => {
    const services = wsdlMap.get('options');
    if (!services) {
        return res.status(500).json({ error: 'Services not initialized' });
    }
    res.status(200).send(services);
});

app.get('/bindings/:service', cors(), async (req, res) => {
    const serviceIndex = parseInt(req.params.service);
    const serviceDescr = wsdlMap.get('files')[serviceIndex];
    
    if (!serviceDescr) {
        return res.status(400).json({ error: 'Invalid service index' });
    }
    
    try {
        // Initialize service if needed (you might want to cache this)
        await facadeManager.initService(serviceIndex, URI_BASE + serviceDescr);
        
        const bindings = await facadeManager.getBindings(serviceIndex);
        res.json(bindings);
    } catch (error) {
        console.error('Error processing bindings:', error);
        res.status(500).json({ error: 'Processing failed: ' + error.message });
    }
});

app.get('/operations/:service/:binding', cors(), async (req, res) => {
    const serviceIndex = parseInt(req.params.service);
    
    try {
        const operations = await facadeManager.getOperations(serviceIndex, req.params.binding);
        res.json(operations);
    } catch (error) {
        console.error('Error processing operations:', error);
        res.status(500).json({ error: 'Processing failed: ' + error.message });
    }
});

app.get('/info/:service/:binding/:operation', cors(), async (req, res) => {
    const serviceIndex = parseInt(req.params.service);
    const { binding, operation } = req.params;
    
    try {
        const info = await facadeManager.getOperationInfo(serviceIndex, binding, operation);
        res.json(info);
    } catch (error) {
        console.error('Error processing operation info:', error);
        res.status(500).json({ error: 'Processing failed: ' + error.message });
    }
});

app.get('/wsdl/:filename', (req, res) => {
    const filename = req.params.filename;
    
    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const fullPath = path.join(WSDL_DIR, filename);
    
    fs.readFile(fullPath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading WSDL file ${filename}:`, err);
            return res.status(404).json({ error: 'File not found' });
        }
        
        res.setHeader('Content-Type', 'application/xml');
        res.send(data);
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        facadeWorker: facadeManager.isHealthy ? 'healthy' : 'unhealthy' 
    });
});

app.get('/', (req, res) => {
    res.render('index');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await facadeManager.destroy();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await facadeManager.destroy();
    process.exit(0);
});

// Start server
const startServer = async () => {
    await initializeWSDL();
    
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
        console.log(`WSDL directory: ${WSDL_DIR}`);
        console.log(`Resource directory: ${resourceDir}`);
        console.log(`Facade running in dedicated process`);
    });
};

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});