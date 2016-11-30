const fs = require('fs')
const FileCache = {}

module.exports = io => {
	io.on('connection', socket => {

		socket.emit('news', {hello: 'world'})

		socket.on('event2', data => {
			console.log(data)
		})

		socket.on('start', data => {
			var name = data.name, size = data.size
			FileCache[name] = {
				size: size,
				data: '',
				uploaded: 0
			}
			let place = 0, filePath = './temp/' + name;
			fs.stat(filePath, (err, stat) => {
				if (err) {
					return console.error(err)
				}
				if (stat.isFile()) {
					Object.assign(FileCache[name], {downloaded: stat.size})
					place = stat.size / 524288
				}
				fs.open(filePath, 'a', 755, (err, fd) => {
					if (err) {
						console.error(err)
					}
					Object.assign(FileCache[name], {handler: fd})
					socket.emit('more', {place: place, percent: 0})
				})
			})
		})

		socket.on('upload', data => {
			const name = data.name
			const file = FileCache[name]

			file.downloaded += data.data.length
			file.data += data.data

			//fully uploaded
			if (file.downloaded === file.size) {
				fs.write(file.handler, file.data, null, 'Binary', (err, res) => {
					if (err) {
						console.error(err)
					} else {
						console.log(res)
					}
				})
				//bigger than 10mb, write
			} else if (file.data.length > _MB(10)) {
				fs.writeFile(file.handler, file.data, null, 'Binary', (err, res) => {
					if (err) return console.error(err)

					//set file cache empty
					file.data = ''
					socket.emit('more', {
						place: file.downloaded / _KB(512),
						percent: file.downloaded / file.size * 100
					})
				})
			} else {
				socket.emit('more', {
					place: file.downloaded / _KB(512),
					percent: file.downloaded / file.size * 100
				})
			}
		})
	})
}

function _MB(number) {
	return number * 1024 * 1024
}

function _KB(number) {
	return number * 1024
}