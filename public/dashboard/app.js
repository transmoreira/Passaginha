///https://www.google.com/maps/search/?api=1&query=-20.42188100,-43.87286000

import { fetcher } from '../fetcher.js'

//

const createCardBtn = document.querySelector('#create-card')
const tbodyCards = document.querySelector('#table-cards tbody')

createCardBtn.addEventListener('click', async () => {
	const client = document.querySelector('#companyName').value
	const mail = document.querySelector('#companyMail').value
	const passenger = document.querySelector('#passengerName').value

	const result = await fetcher('/card', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			client_name: client,
			email_client: mail,
			passenger_name: passenger,
		}),
	})
	addCard(result)
})

const addCard = ({ client_name, email_client, passenger_name, card_number, amount, active }) => {
	const tr = document.createElement('tr')
	tr.className = active === 1 ? '' : 'inactive'
	tr.disable = active === 1 ? '' : 'disable'

	tr.innerHTML = `
		<td>${client_name}</td>
		<td>${email_client}</td>
		<td>${passenger_name}</td>
		<td>${card_number}</td>
		<td style="display: flex; justify-content: space-between; align-items: center; min-width: 72px;">${
			amount ?? 0
		}<button onclick="addCredit(${card_number}, ${active})" title="Adicionar Saldo">➕</button></td>
		<td><button onclick="viewCard('${client_name}', '${passenger_name || '_'}', ${card_number}, ${active})" title="Gerar QRCode">🪪</button></td>
		<td><button onclick="toInactive(${card_number})" title="Bloquear cartão">❌</button></td>
	`
	tbodyCards.prepend(tr)
}

const load = () => {
	tbodyCards.innerHTML = ''
	fetcher('/card').then((data) => {
		data.forEach((item) => {
			addCard(item)
		})
	})
}

load()

const addCredit = async (card_number, active) => {
	if (!active) return
	const value = prompt('DIGITE O VALOR A SER CREDITADO')
	if (isNaN(value)) {
		return alert('Valor inválido')
	}
	await fetcher('/credit', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ card_number, value, description: 'RECARGA' }),
	})
	load()
}

const viewCard = async (client_name, passenger_name, card_number, active) => {
	if (!active) return
	const qrCode = document.querySelector('#qrcode')
	const company = document.querySelector('#companyNameSpan')
	const passenger = document.querySelector('#passengerNameSpan')
	const number = document.querySelector('#cardNumberSpan')
	const card = document.querySelector('.card')

	company.textContent = client_name
	passenger.textContent = passenger_name
	number.textContent = card_number

	qrCode.innerHTML = ''

	new QRCode(qrCode, {
		text: card_number,
		width: 128,
		height: 128,
	})

	card.style.display = 'flex'

	html2canvas(card).then((canvas) => {
		const link = document.createElement('a')
		link.href = canvas.toDataURL('image/png')
		link.download = `${card_number}.png`
		link.click()
		card.style.display = 'none'
	})
}

const toInactive = async (card_number, active) => {
	if (!active) return
	const shouldToInactive = confirm('Deseja mesmo cancelar o cartão ' + card_number + '?')
	if (!shouldToInactive) return
	await fetcher('/card', {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			card_number,
		}),
	})
	load()
}
