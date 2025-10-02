const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const facade = require('./facade');

// variables
const PORT = 3002;
const app = express();

const resourceDir = path.resolve(__dirname, '../../resource');

const uri = 'http://localhost:3001/wsdl/';
const wsdlMap = {};
// const serviceMap = {};

// functions
const listWSDLFiles = (directoryPath, callback) => {
	fs.readdir(directoryPath, (err, items) => {
		if (err) {
			console.error('Error reading directory:', err);
			callback(err);
			return;
		}
		let wsdlFiles = items.filter(item => {
			let fullPath = path.join(directoryPath, item);
			try {
				let stats = fs.statSync(fullPath);
				return stats.isFile() && path.extname(item) === '.wsdl';
			} catch (err) {
				console.error('Error accessing file:', err);
				callback(err);
				return false;
			}
		});
		callback(null, wsdlFiles);
	});
}

const serviceItem = (item, index) => {
	wsdlMap[index] = item;
	return '<option value="' + index + '">' + item + '</option>';
}

const loadService = (key) => {
	let service;
	try {
		service = new facade(uri + key);
		console.log(`Service ${key} loaded`);
	} catch (error) {
		console.error(`Error initializing Service ${key} :`, error);
	}
	return service;
}

const getService = (index) => {
	let key = wsdlMap[index];
	// let service = serviceMap[index];
	// if (service) {
	// 	return service;
	// }
	// serviceMap[index] = loadService(key);
	// return serviceMap[index];
	return loadService(key);
}

// init

process.nextTick(() => {
	let directoryPath = path.join(resourceDir, '/wsdl');
	listWSDLFiles(directoryPath, (err, wsdlFiles) => {
		if (err) {
			wsdlMap[0] = null;
			return;
		}
		wsdlFiles.sort((a, b) => {
			let x = a.toUpperCase(), y = b.toUpperCase();
			return x === y ? 0 : x > y ? 1 : -1;
		});
		let itemsTmp = wsdlFiles.map((item, index) => serviceItem(item, index + 1));
		wsdlMap[0] = itemsTmp.join('');
	});
});

// routes

app.get('/services', cors(), (req, res) => {
	let services = wsdlMap[0];
	if (services === null) {
		res.status(500).send('Internal Server Error');
	} else {
		res.status(200).send(services);
	}
});

app.get('/bindings/:service', cors(), (req, res) => {
	let service = getService(req.params.service);
	if (service) {
		try {
			let bindings = service.bindings();
			res.end(bindings);
		} catch (error) {
			console.error('Error processing sampleRequest:', error);
			res.status(500).send('Processing failed');
		}
	} else {
		res.status(500).send('facade initialization failed');
	}
});

app.get('/operations/:service/:binding', cors(), (req, res) => {
	let service = getService(req.params.service);
	if (service) {
		try {
			let operations = service.operations(req.params.binding);
			res.end(operations);
		} catch (error) {
			console.error('Error processing sampleRequest:', error);
			res.status(500).send('Processing failed');
		}
	} else {
		res.status(500).send('facade initialization failed');
	}
});

app.get('/info/:service/:binding/:operation', cors(), (req, res) => {
	let service = getService(req.params.service);
	if (service) {
		let binding = req.params.binding;
		let operation = req.params.operation;
		try {
			let sampleRequest = service.sampleRequest(binding, operation);
			let element1 = '<pre class="data e1"><code id="request" class="language-xml">' + service.escape(sampleRequest) + '</code></pre>';
			let sampleResponse = service.sampleResponse(binding, operation);
			let element2 = '<pre class="data e2"><code id="response" class="language-xml">' + service.escape(sampleResponse) + '</code></pre>';
			res.end(element1 + element2);
		} catch (error) {
			console.error('Error processing sampleRequest:', error);
			res.status(500).send('Processing failed');
		}
	} else {
		res.status(500).send('Initialization failed');
	}
});

// Start server
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));