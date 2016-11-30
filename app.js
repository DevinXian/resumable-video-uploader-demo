const http = require('http')
const path = require('path')
const express = require('express')
const socket = require('socket.io')

const app = express()
const port = 3000

const socketHandler = require('./socket-handler')

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.set('port', port)
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/client/index.html')
})
const server = http.createServer(app)
const io = socket(server)
socketHandler(io)

server.listen(port, function () {
	console.log('Serving on port ' + port)
})

