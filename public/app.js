import { fetcher } from './fetcher.js'

const getPosition = () =>
	new Promise((resolve, reject) => {
		navigator.geolocation.getCurrentPosition((position) => {
			resolve(position)
		})
	})

document.addEventListener('DOMContentLoaded', async function () {
	const position = await getPosition()
	console.log(position)
	const scanner = new Html5Qrcode('reader')

	async function onScanSuccess(decodedText) {
		scanner.stop() // Para a câmera após a leitura
		const data = {
			card_number: decodedText,
			value: -1,
			...position,
		}
		if (navigator.onLine) {
			// Se online, envia diretamente
			data.description = 'Embarque Online'
			await fetcher('/credit', {
				method: 'POST',
				body: JSON.stringify(data),
				headers: { 'Content-Type': 'application/json' },
			})
		} else {
			// Se offline, salva no IndexedDB
			data.description = 'Embarque Offline'
			const db = await openDatabase()
			const tx = db.transaction('pendentes', 'readwrite')
			tx.objectStore('pendentes').add(data)

			navigator.serviceWorker.ready.then((reg) => {
				reg.sync.register('sync-dados')
			})
		}
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

if (window.matchMedia('(display-mode: standalone)').matches) {
	console.log('O PWA está instalado e rodando no modo standalone.')
} else {
	console.log('O PWA não está instalado ou está rodando no navegador.')
}
