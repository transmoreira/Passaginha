let loc

document.addEventListener('DOMContentLoaded', function () {
	navigator.geolocation.getCurrentPosition((position) => {
		document.getElementById('location').innerHTML = JSON.stringify(position)
	})
	const scanner = new Html5Qrcode('reader')

	function onScanSuccess(decodedText) {
		document.getElementById('output').innerText = 'QR Code lido: ' + decodedText
		scanner.stop() // Para a câmera após a leitura
	}

	function onScanFailure(error) {
		console.warn(`Erro ao ler QR Code: ${error}`)
	}

	// Inicia o scanner da câmera
	scanner.start(
		{ facingMode: 'environment' }, // Usa a câmera traseira
		{
			fps: 10, // Frames por segundo
			qrbox: { width: 250, height: 250 }, // Tamanho do box de leitura
		},
		onScanSuccess,
		onScanFailure
	)

	// Botão para parar o scanner
	// document.getElementById('stopButton').addEventListener('click', function () {
	// 	scanner.stop()
	// })
})

document.querySelector('#salvarBtn')?.addEventListener('click', async () => {
	const dados = { nome: document.querySelector('#dataInput').value, info: 'Salvo', date: new Date().toLocaleString('pt-BR') }

	if (navigator.onLine) {
		// Se online, envia diretamente
		dados.info = 'Enviado Online'
		await fetch('/api/save', {
			method: 'POST',
			body: JSON.stringify(dados),
			headers: { 'Content-Type': 'application/json' },
		})
	} else {
		// Se offline, salva no IndexedDB
		dados.info = 'Salvo Offline'
		const db = await openDatabase()
		const tx = db.transaction('pendentes', 'readwrite')
		tx.objectStore('pendentes').add(dados)

		navigator.serviceWorker.ready.then((reg) => {
			reg.sync.register('sync-dados')
		})
	}
})

// Função para abrir o IndexedDB
function openDatabase() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('OfflineDB', 1)
		request.onerror = () => reject('Erro ao abrir o banco de dados')
		request.onsuccess = () => resolve(request.result)
		request.onupgradeneeded = (event) => {
			const db = event.target.result
			if (!db.objectStoreNames.contains('pendentes')) {
				db.createObjectStore('pendentes', { keyPath: 'id', autoIncrement: true })
			}
		}
	})
}
try {
	navigator.serviceWorker.ready.then((reg) => {
		reg.sync.register('sync-dados').then((a) => console.log('Sincronização registrada', a))
	})
} catch (error) {}
