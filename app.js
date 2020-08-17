const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const ent = require('ent');
const encode = require('ent/encode');

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
	res.render('index.ejs');
})
.get('*', (req, res, next) => {
	res.redirect('/');
});

const clients = [];
const typing = [];

const manageIfStoppedTyping = (typing, socket, pseudo) => {
	let stoppedTyping = [];
	if(pseudo !== undefined) {
		typing.forEach(({name, time}) => {
			if(pseudo == name)
				stoppedTyping.push({name: name, time: time});
		});
		console.log('yeah :' + stoppedTyping)
	}
		
	typing.forEach(({name, time}) => {
		if((Date.now() - time) >= 2000)
			stoppedTyping.push({name: name, time: time});
	});

	if(stoppedTyping.length > 0) {
		stoppedTyping.forEach(nameTime => {
			typing.splice(typing.indexOf(nameTime), 1);
		});
		let names = typing.map(({name, time}) => name)
		socket.emit('typing', names);
		socket.broadcast.emit('typing', names);
	} 
}

io.sockets.on('connection', socket => {
	clients.push(socket);

	socket.on('pseudo_entry', pseudo => {
		socket.pseudo = pseudo = encode(pseudo ? pseudo : '');
		let names = clients.map(client => client.pseudo);
		socket.emit('welcome', {pseudo: pseudo, online: clients.length, names: names});
		socket.broadcast.emit('enters_chat', {pseudo: pseudo, online: clients.length, names: names});
	});

	socket.on('message', message => {
		message = encode(message);
		socket.emit('message', {message: message, pseudo: socket.pseudo});
		socket.broadcast.emit('message', {message: message, pseudo: socket.pseudo});
		manageIfStoppedTyping(typing, socket, socket.pseudo)
	});

	socket.on('disconnect', () => {
		clients.splice(clients.indexOf(socket), 1);
		let names = clients.map(client => client.pseudo);
		socket.broadcast.emit('leaves_chat', {
			pseudo: socket.pseudo, online: clients.length, names: names
		})
	});

	socket.on('typing', (pseudo) => {
		let index = typing.findIndex(({name, time}) => pseudo === name);
		if(~index) {
			typing[index] = {name: pseudo, time: Date.now()}
		}
		else
			typing.push({name: pseudo, time: Date.now()});
			
		let names = typing.map(({name, time}) => name)
		
		socket.broadcast.emit('typing', names);
		setTimeout(() => {
			manageIfStoppedTyping(typing, socket);
		}, 2500);
	});
})

http.listen(8080, () => {
	console.log('Listening on *:8080');
});
