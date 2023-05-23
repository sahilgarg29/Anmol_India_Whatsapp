require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const socketIO = require('socket.io');

const server = require('http').createServer(app);

const io = socketIO(server, {
	cors: {
		origin: '*',
	},
});

io.on('connection', (socket) => {
	console.log('New client connected');

	socket.on('disconnect', () => {
		console.log('Client disconnected');
	});
});

io.listen(server);

app.set('socketio', io);

const port = process.env.PORT || 5000;
const mongooseUri = process.env.MONGO_URI || 'mongodb://localhost:27017/anmol';
mongoose
	.connect(mongooseUri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log('Connected to MongoDB');
	});

server.listen(port, () => {
	console.log(`App running on port ${port}`);
});
