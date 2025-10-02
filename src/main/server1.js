const express = require('express');
const path = require('path');
const fs = require('fs');

// server1
const resourceDir = path.resolve(__dirname, '../../resource');
const PORT = 3001;
const app = express();

// Set EJS view engine and views directory
app.use('/static', express.static(resourceDir + '/static'))
	 .set('view engine', 'ejs')
	 .set('views', path.join(resourceDir, '/views'));

// Route for rendering the single page
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/wsdl/:filename', (req, res) => {
	let filename = req.params.filename;
	let fullPath = path.join(resourceDir + '/wsdl', filename);
	console.log(`Reading file: ${fullPath}`);
	fs.readFile(fullPath, 'utf8', (err, data) => {
		if (err) {
			res.writeHead(500, { 'Content-Type': 'text/plain' });
			res.end('Internal Server Error');
			return;
		} 
		res.writeHead(200, { 'Content-Type': 'application/xml' });
		res.end(data);
	});	
});

// Start server
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));