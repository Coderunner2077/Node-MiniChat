const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const ent = require('ent');
const encode = require('ent/encode');

app.set('view engine', 'ejs');

app.get(/\w*/, (req, res) => {
	res.render('index.ejs');
})

const clients = [];

io.sockets.on('connection', socket => {
	clients.push(socket);

	socket.on('pseudo_entry', pseudo => {
		socket.pseudo = pseudo = encode(pseudo);
		let names = clients.map(client => client.pseudo);
		socket.emit('welcome', {pseudo: pseudo, online: clients.length, names: names});
		socket.broadcast.emit('enters_chat', {pseudo: pseudo, online: clients.length, names: names});
		console.log(pseudo);
	});

	socket.on('message', message => {
		message = encode(message);
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

http.listen(8080, () => {
	console.log('Listening on *:8080');
});
