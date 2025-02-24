import express from 'express'

const app = express()

app.use(express.static('public'))
app.use(express.json())

app.post('/api/save', (req, res) => {
	console.log('Salvando dados:', req.body, new Date().toLocaleString('pt-BR'))
	res.json({ status: 'ok' })
})

app.listen(8888, () => console.log('Server running'))
