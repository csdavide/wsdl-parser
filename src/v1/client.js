const app = require('../core');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const wsdl = parser("http://localhost:3001/wsdl/streamingWS.wsdl");

class Client {

  constructor() {
  }

  list() {
    let operations = wsdl.operations("StreamingServiceSoapBinding");
    operations.sort((a, b) => {
      let x = a.toUpperCase(), y = b.toUpperCase();
      return x === y ? 0 : x > y ? 1 : -1;
    });
    console.log(operations);
  }

  reiterate() {
    rl.question('Press Enter to continue', (answer) => {
				this.start();
    });
  }
	
	execute(item) {
		let sampleRequest = wsdl.sampleRequest('StreamingServiceSoapBinding', item);
    console.log(sampleRequest);
    let sampleResponse = wsdl.sampleResponse('StreamingServiceSoapBinding', item);
    console.log(sampleResponse);
    this.reiterate();
	}	

  start() {
    this.list(); 
    rl.question('Please enter your input: ', (answer) => {
        if (answer != 'quit') {
				  	this.execute(answer);						
				} else {
						process.send('EXIT');
				}
    });
  }
}

new Client().start();