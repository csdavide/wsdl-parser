const serviceUri = 'http://localhost:3001';
const MAX_RETRIES = 3;
const RETRY_DELAY = 500; // millisecondi

async function fetchData(url) {
  const retryCodes = [408, 429, 503]; // Timeout, Too Many Requests, Service Unavailable
  
  async function attemptFetch(retryCount = 0) {
    try {
			const serviceUrl = url.replace(/^"+|"+$/g, '');
      const response = await fetch(serviceUrl);
      
      if (!response.ok) {
        const status = response.status;
        if (retryCodes.includes(status) && retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryCount)));
          return attemptFetch(retryCount + 1);
        }
        throw new Error(`HTTP error! status: ${status}`);
      }
      
      return await response.text();
    } catch (error) {
      if (retryCount >= MAX_RETRIES) {
        throw error;
      }
      return attemptFetch(retryCount + 1);
    }
  }

  return attemptFetch();
}

async function initTool() {
  try {
    const sourceDiv = document.getElementById('source');
    if (!sourceDiv) throw new Error('Elemento #source non trovato');
    
		sourceDiv.onsubmit = function(e) {
			e.preventDefault();
		};
		
		try {
			const servicesEl = document.getElementById('services');
			if (!servicesEl) throw new Error('Elemento #services non trovato');
			
			const data = await fetchData(serviceUri + '/services');
			servicesEl.innerHTML = '<option value="0">-----</option>' + data;
			showLoading(false);
			
			initListener();
		} catch (error) {
			showError(error.message);
			showLoading(false);
		}   
  } catch (error) {
    console.error('Errore durante l\'inizializzazione:', error);
    showError(error.message);
  }
}

async function changeService() {
  try {
    const bindingsEl = document.getElementById('bindings');
    const operationsEl = document.getElementById('operations');
    const sourceDiv = document.getElementById('source');
    
    if (!bindingsEl || !operationsEl || !sourceDiv) {
      throw new Error('Elementi DOM mancanti');
    }
    
    bindingsEl.innerHTML = '';
    operationsEl.innerHTML = '';
    
    const formData = new FormData(sourceDiv);
    const service = formData.get('service');
    
    if (service === '0') return;
    
    showLoading(true);
    const data = await fetchData(serviceUri + '/bindings/' + service);
    bindingsEl.innerHTML = data;
    
    const optsCount = bindingsEl.options.length;
    if (optsCount === 1) {
      changeBinding();
    }
    
    showLoading(false);
  } catch (error) {
    showError(error.message);
    showLoading(false);
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

async function changeOperation() {
  try {
    const targetEl = document.getElementById('target');
    const sourceDiv = document.getElementById('source');
    
    if (!targetEl || !sourceDiv) {
      throw new Error('Elementi DOM mancanti');
    }
    
    targetEl.innerHTML = '';
    showLoading(true);
    
    const formData = new FormData(sourceDiv);
    const service = formData.get('service');
    const binding = formData.get('binding');
    const operation = formData.get('operation');
    
    const data = await fetchData(serviceUri + '/info/' + service + '/' + binding + '/' + operation);
    targetEl.innerHTML = data;
    
    document.querySelectorAll('.language-xml').forEach(el => {
      hljs.highlightElement(el);
    });
    
    showLoading(false);
  } catch (error) {
    showError(error.message);
    showLoading(false);
  }
}

function showLoading(isLoading) {
  const loadingEl = document.createElement('div');
  loadingEl.className = isLoading ? 'loading' : 'hidden';
  loadingEl.textContent = isLoading ? 'Caricamento...' : '';
  document.body.appendChild(loadingEl);
}

function showError(message) {
  const errorEl = document.createElement('div');
  errorEl.className = 'error';
  errorEl.textContent = `Errore: ${message}`;
  document.body.appendChild(errorEl);
  
  setTimeout(() => {
    errorEl.remove();
  }, 5000);
}

// Stili CSS necessari
const styles = `
.loading {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px;
  background: #f0f0f0;
  border-radius: 4px;
}

.error {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px;
  background: #ffcccc;
  color: #cc0000;
  border-radius: 4px;
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Inizializzazione
window.onload = initTool;