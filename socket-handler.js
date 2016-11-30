module.exports = io => {
	io.on('connection', socket => {
		socket.emit('news', {hello: 'world'})
		socket.on('event2', data => {
			console.log(data)
		})
	})
}