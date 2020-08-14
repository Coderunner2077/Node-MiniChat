const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
	fs.readFile('./index.html', 'utf-8', (error, content) => {
		res.writeHead(200, {'Content-type': 'text/html'});
		res.end(content);
	})
});

const io = require('socket.io').listen(server);

const clients = [];

io.sockets.on('connection', socket => {
	clients.push(socket);

	socket.on('pseudo_entry', pseudo => {
		socket.pseudo = pseudo;
		let names = clients.map(client => client.pseudo);
		socket.emit('welcome', {pseudo: pseudo, online: clients.length, names: names});
		socket.broadcast.emit('enters_chat', {pseudo: pseudo, online: clients.length, names: names});
	});

	socket.on('message', message => {
		socket.emit('message', {message: message, pseudo: socket.pseudo});
		socket.broadcast.emit('message', {message: message, pseudo: socket.pseudo});
	});

	socket.on('disconnect', () => {
		clients.splice(clients.indexOf(socket), 1);
		let names = clients.map(client => client.pseudo);
		socket.broadcast.emit('leaves_chat', {
			pseudo: socket.pseudo, online: clients.length, names: names
		})
	});
})

server.listen(8080);
