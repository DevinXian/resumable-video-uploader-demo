const fs = require('fs')
const iconv = require('iconv-lite')

const FileCache = {}

module.exports = io => {
	io.on('connection', socket => {

		socket.on('start', data => {
			var name = data.name, size = data.size
			FileCache[name] = {
				size: size,
				data: '',
				downloaded: 0
			}
			let place = 0, filePath = './temp' + name;
			fs.stat(filePath, (err, stat) => {
				if (err) {
					console.log('file ' + filePath + ' not exits, create new file')
				}
				if (stat && stat.isFile()) {
					Object.assign(FileCache[name], {downloaded: stat.size})
					place = stat.size / 524288
				}
				fs.open(filePath, 'a', 0o755, (err, fd) => {
					if (err) {
						console.error(err)
					}
					Object.assign(FileCache[name], {handler: fd})
					//TODO check resume function
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
				console.log('full upload')
				fs.write(file.handler, file.data, null, 'binary', (err, res) => {
					if (err) {
						console.error(err)
					} else {
						socket.emit('done', {
							place: file.downloaded / _KB(512),
							percent: file.downloaded / file.size * 100
						})
					}
				})
			} else if (file.data.length > _MB(10)) {
				// bigger than 10mb, write
				console.log('bigger than 10MB')
				fs.write(file.handler, file.data, null, 'binary', (err, res) => {
					if (err) return console.error(err)

					//set file cache empty
					file.data = ''
					socket.emit('more', {
						place: file.downloaded / _KB(512),
						percent: file.downloaded / file.size * 100
					})
				})
			} else {
				console.log('more data')
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