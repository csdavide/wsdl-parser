const serviceUri = 'http://localhost:3002';

async function fetchData(url) {
  try {
    let response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
			console.error('There was a problem with the fetch operation: ', error.message);
  }
}

function initListener() {
	window.addEventListener('click', function(event) {
		let element = event.target;
		let clsn = element.className;
		if (clsn.includes('hljs')) {
			event.preventDefault();
			navigator.clipboard.writeText(element.textContent);
			blinkDiv(element, 3);
		}	
	});
}

function blinkDiv(element, numBlinks) {
  let count = 0;
  let intervalId = setInterval(() => {
		if (count % 2 === 0) {
			element.classList.remove('selected');
			element.classList.add('selected');
		} else {
			 element.classList.remove('selected');
		}
    count++;
    if (count >= numBlinks * 2) {
      clearInterval(intervalId);
    }
  }, 500);
}

function initTool() {
	let sourceDiv = document.getElementById('source');
  sourceDiv.onsubmit = function(e) {
			e.preventDefault();
  };
	let servicesEl = document.getElementById('services');
	fetchData(serviceUri + '/services').then(data => {
			servicesEl.innerHTML = '<option value="0">-----</option>' + data;
	});
  initListener();
}

function changeService() {
	 let bindingsEl = document.getElementById('bindings');
   bindingsEl.innerHTML = '';
	 let operationsEl = document.getElementById('operations');
	 operationsEl.innerHTML = '';
	 let sourceDiv = document.getElementById('source');
	 let formData = new FormData(sourceDiv);
	 let service = formData.get('service');
	 if (service != '0') {
		 fetchData(serviceUri + '/bindings/' + service).then(data => {
				bindingsEl.innerHTML = data;
				let optsCount = bindingsEl.options.length;
				if (optsCount == 1) {
					changeBinding();
				}
		 });
	 } else {
		   bindingsEl.innerHTML = '';
			 operationsEl.innerHTML = '';	
	 }
}

function changeBinding() {	
	 let operationsEl = document.getElementById('operations');
   operationsEl.innerHTML = '';
	 let sourceDiv = document.getElementById('source');
	 let formData = new FormData(sourceDiv);
	 let service = formData.get('service');
	 let binding = formData.get('binding');
	 fetchData(serviceUri + '/operations/' + service + '/' + binding).then(data => {
			operationsEl.innerHTML = data;
			changeOperation();
	 });
}

function changeOperation() {
	 let targetEl = document.getElementById('target');
   targetEl.innerHTML = '';
	 let sourceDiv = document.getElementById('source');
	 let formData = new FormData(sourceDiv);
	 let service = formData.get('service');
	 let binding = formData.get('binding');
	 let operation = formData.get('operation');
	 fetchData(serviceUri + '/info/' + service + '/' + binding + '/' + operation).then(data => {
			targetEl.innerHTML = data;
			document.querySelectorAll('.language-xml').forEach(el => {
				hljs.highlightElement(el);
		});
	 });
}