const path = require('path');
const { fork } = require('child_process');

const server1Path = path.join(__dirname, 'server1.js');
const server1Process = fork(server1Path);

const server2Path = path.join(__dirname, 'server2.js');
const server2Process = fork(server2Path);