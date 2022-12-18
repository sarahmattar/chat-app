const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { on } = require('stream');

const {
	generateMessage,
	generateLocationMessage,
} = require('./utils/messages');
const {
	addUser,
	removeUser,
	getUser,
	getUsersInRoom,
} = require('./utils/users');

const Filter = require('bad-words');

const app = express();
const port = process.env.PORT || 3000;

//create a new web server, pass our express server to it
const server = http.createServer(app);

// server was created for purpose of passing it to socketio
const io = socketio(server);

const welcomeMessage = 'Welcome to the Chat!';

// listen for new connection on io - io sends info to all clients
io.on('connection', (socket) => {
	console.log('New Websocket Connection!');
	const filter = new Filter();

	// set up a listener for joining the room

	socket.on('join', ({ username, room }, callback) => {
		const { error, user } = addUser({ id: socket.id, username, room });

		if (error) {
			return callback(error);
		}
		socket.join(user.room);
		// send an event on the server to be received on the client
		socket.emit('message', generateMessage('Admin', welcomeMessage));
		socket.broadcast
			.to(user.room)
			.emit(
				'message',
				generateMessage('Admin', `${user.username} has joined!`)
			);

		// send the room data to the client
		io.to(user.room).emit('roomData', {
			room: user.room,
			users: getUsersInRoom(user.room),
		});

		callback();
	});

	socket.on('sendMessage', (message, callback) => {
		const user = getUser(socket.id);

		if (filter.isProfane(message)) {
			return callback('Profanity is not allowed');
		}
		io.to(user.room).emit(
			'message',
			generateMessage(user.username, message)
		);
		callback();
	});

	socket.on('sendLocation', ({ latitude, longitude }, callback) => {
		const user = getUser(socket.id);
		io.to(user.room).emit(
			'locationMessage',
			generateLocationMessage(
				user.username,
				`https://google.com/maps/@${latitude},${longitude}`
			)
		);

		callback('Location Shared');
	});

	socket.on('disconnect', () => {
		const user = removeUser(socket.id);
		if (user) {
			io.to(user.room).emit(
				'message',
				generateMessage(
					'Admin',
					`${user.username} has left ${user.room}.`
				)
			);
			io.to(user.room).emit('roomData', {
				room: user.room,
				users: getUsersInRoom(user.room),
			});
		}
	});
});

const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

server.listen(port, () => console.log('Server is up on port ' + port));
