///https://www.google.com/maps/search/?api=1&query=-20.42188100,-43.87286000

const cardNumberSpan = document.querySelector('#cardNumberSpan')
const qrCode = document.querySelector('#qrcode')

cardNumberSpan.textContent = `${new Date().getFullYear()} ${new Date().getDate().toString().padStart(2, '0')}${(new Date().getMonth() + 1)
	.toString()
	.padStart(2, '0')} 1130 ${Math.floor(Math.random() * 10000)
	.toString()
	.padStart(4, '0')}`

new QRCode(qrCode, {
	text: cardNumberSpan.textContent,
	width: 128,
	height: 128,
})

const observer = new MutationObserver((mutations) => {
	qrCode.innerHTML = ''
	new QRCode(qrCode, {
		text: cardNumberSpan.textContent,
		width: 128,
		height: 128,
	})
})

observer.observe(cardNumberSpan, {
	childList: true,
	subtree: true,
	characterData: true,
})
