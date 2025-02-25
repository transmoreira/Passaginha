const CACHE_NAME = 'my-cache-v1'
const urlsToCache = ['/index.html', '/styles.css', '/app.js', 'favicon.ico', 'sw.js']

self.addEventListener('install', (event) => {
	console.log('Service Worker instalado')
	self.skipWaiting()
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			console.log('Cache aberto')
			return cache.addAll(urlsToCache)
		})
	)
})

self.addEventListener('activate', (event) => {
	console.log('Service Worker ativado')
	self.clients.claim()
})

// Intercepta solicitações de rede
self.addEventListener('fetch', (event) => {
	if (!navigator.onLine) {
		console.log('Offline: armazenando dados')
		//event.respondWith(new Response(JSON.stringify({ status: 'offline' })))
		event.respondWith(
			caches.match(event.request).then((response) => {
				if (response) {
					return response
				}
				return fetch(event.request)
			})
		)
	}
})

// Sincroniza os dados quando a internet voltar
self.addEventListener('sync', (event) => {
	console.log({
		event,
	})
	if (event.tag === 'sync-dados') {
		event.waitUntil(syncDadosComServidor())
	}
})

/*async function obterDadosPendentes() {
	return new Promise((resolve, reject) => {
		const tx = db.transaction('pendentes', 'readonly')
		const store = tx.objectStore('pendentes')
		const request = store.getAll() // Aqui está a correção
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject('Erro ao obter dados pendentes')
	})
}*/

// Função para sincronizar dados do IndexedDB
async function syncDadosComServidor() {
	const db = await openDatabase()
	const transaction = db.transaction('pendentes', 'readonly')
	const store = transaction.objectStore('pendentes')
	const getAll = store.getAll()
	getAll.onsuccess = async () => {
		const result = getAll.result
		for (const data of result) {
			try {
				await fetch('/api/save', {
					method: 'POST',
					body: JSON.stringify(data),
					headers: { 'Content-Type': 'application/json' },
				})

				// Remover o item do IndexedDB após o envio bem-sucedido
				await removerDado(data.id, db)
			} catch (error) {
				console.error('Erro ao sincronizar dados:', error)
			}
		}
	}
}

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

async function removerDado(id, db) {
	return new Promise((resolve, reject) => {
		const tx = db.transaction('pendentes', 'readwrite')
		const store = tx.objectStore('pendentes')
		const request = store.delete(id)
		request.onsuccess = () => resolve()
		request.onerror = () => reject('Erro ao remover dado')
	})
}
