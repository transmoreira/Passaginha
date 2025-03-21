import express from 'express'
import { Passenger } from '../db/mysql/index.js'

const app = express()

const PORT = process.env.PORT || 8888

app.use(express.static('public'))
app.use(express.json())

app.post('/api/save', (req, res) => {
	console.log('Salvando dados:', req.body, new Date().toLocaleString('pt-BR'))
	res.json({ status: 'ok' })
})

app.post('/card', async (req, res) => {
	const { client_name, email_client, passenger_name } = req.body
	const id = (await Passenger('SELECT id FROM card ORDER BY id DESC LIMIT 1'))?.[0]?.id || 0 + 1
	const date = new Date()
	const numberCard = `${date.toLocaleDateString('pt-BR').replaceAll('/', '')}${id.toString().padStart(8, '0')}`

	const sql = `INSERT INTO card(client_name, email_client, passenger_name, card_number, active) VALUES ('${client_name}','${email_client}','${passenger_name}','${numberCard}', 1)`
	const result = await Passenger(sql)
	if (!result.insertId) {
		return res.status(400)
	}

	res.json({ client_name, email_client, passenger_name, card_number: numberCard, active: 1 })
})

app.get('/card', async (req, res) => {
	const sql = 'SELECT c.*, (SELECT SUM(amount) from passenger p where p.card_number = c.card_number) as amount from card c'
	const data = await Passenger(sql)
	res.json(data)
})

app.post('/credit', async (req, res) => {
	const { card_number, value, description } = req.body
	const sql = `INSERT INTO passenger (card_number, amount, time, description) VALUE ('${card_number}', '${value}', '${new Date().toISOString()}', '${description}')`
	await Passenger(sql)
	res.status(200).send({
		success: true,
	})
})

app.put('/card', async (req, res) => {
	const { card_number, value } = req.body
	const sql = `UPDATE card SET active = 0 WHERE card_number = ${card_number}`
	await Passenger(sql)
	res.status(200).send({
		success: true,
	})
})

Passenger(`
    CREATE TABLE IF NOT EXISTS card (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_name VARCHAR(100) NOT NULL,
        email_client VARCHAR(100),
        passenger_name VARCHAR(100),
        card_number VARCHAR(16) NOT NULL,
		active BOOLEAN
    )
`)
Passenger(`
    CREATE TABLE IF NOT EXISTS passenger (
        id INT AUTO_INCREMENT PRIMARY KEY,
        card_number VARCHAR(16) NOT NULL,
        time DATETIME,
		car VARCHAR(5),
		line VARCHAR(10),
		location TEXT,
		description VARCHAR(200) NOT NULL,
		amount INT
    )
`)

app.listen(PORT, () => console.log('Server running in port: ' + PORT))
