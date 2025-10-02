const path = require('./core');

class facade {

	constructor(uri) {
		this.wsdl = parser(uri);
	}

	escape(str) {
		return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	bindings() {
		let items = this.wsdl.bindings();
		items.sort((a, b) => {
			let x = a.toUpperCase(), y = b.toUpperCase();
			return x === y ? 0 : x > y ? 1 : -1;
		});
		let itemsTmp = items.map((item) => '<option value="' + item + '">' + item + '</option>');
		return itemsTmp.join('');
	}

	operations(binding) {
		let items = this.wsdl.operations(binding);
		items.sort((a, b) => {
			let x = a.toUpperCase(), y = b.toUpperCase();
			return x === y ? 0 : x > y ? 1 : -1;
		});
		let itemsTmp = items.map((item) => '<option value="' + item + '">' + item + '</option>');
		return itemsTmp.join('');
	}

	sampleRequest(binding, operation) {
		return this.wsdl.sampleRequest(binding, operation);
	}

	sampleResponse(binding, operation) {
		return this.wsdl.sampleResponse(binding, operation);
	}
}

module.exports = facade;