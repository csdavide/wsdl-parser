const path = require('path');
const { fork } = require('child_process');

const serverPath = path.join(__dirname, 'server.js');
const serverProcess = fork(serverPath);

const clientPath = path.join(__dirname, 'client.js');
const clientProcess = fork(clientPath);

clientProcess.on('message', (message) => {
    serverProcess.kill('SIGINT');
		clientProcess.kill('SIGINT');
});