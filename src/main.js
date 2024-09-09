const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { fork } = require('child_process');

Menu.setApplicationMenu(null);

function createWindow () {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
		resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true
    }
  });
	// win.webContents.openDevTools();
  win.loadURL('http://localhost:3001');
}

app.whenReady().then(() => {
  createWindow();
  
  // Start the Express server in a child process
  const serverPath = path.join(__dirname, 'v2/app.js');
  const serverProcess = fork(serverPath);
  
  serverProcess.on('message', (msg) => {
    console.log('Message from server:', msg);
  });
  
  // Optionally, handle errors and exit events
  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });
  
  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Server exited with code ${code}`);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
