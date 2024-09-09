const http = require('http');
const fs = require('fs');
const path = require('path');

http.createServer((req, res) => {
	if (req.method === 'GET') {
		let file = path.join(__dirname, '../../resource/' + req.url.substring(5));
		fs.readFile(file, 'utf8', (err, data) => {
			if (err) {
				res.writeHead(500, { 'Content-Type': 'text/plain' });
				res.end('Internal Server Error');
				return;
			}    
			res.writeHead(200, { 'Content-Type': 'application/xml' });
			res.end(data);
		});
	} else {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.end('Not Found');
	}
}).listen(3001, () => {
	console.log(`Server running`);
});