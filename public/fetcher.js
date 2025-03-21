export const fetcher = async (url, options) => {
	const loading = document.createElement('div')
	loading.className = 'loading'
	document.body.appendChild(loading)
	try {
		const response = await fetch(url, options)
		loading.remove()
		return await response.json()
	} catch (error) {
		loading.remove()
		throw new Error(error.message)
	}
}
