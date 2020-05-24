var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var groups = 1;
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('.'));
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/game.html');
});
//Begins connect here
io.on('connection', function(socket){
	//When player create a new game
	socket.on('startGame', function(data){
		socket.join(groups);
		socket.emit('new', {name: data.name, group: groups});
		groups++;
	});
	//When another player enter an exist game
	socket.on('joinGame', function(data){
		var group = io.nsps['/'].adapter.rooms[data.group];
		if (group && group.length == 1){
			socket.join(data.group);
			socket.broadcast.to(data.group).emit('player1', {});
			socket.emit('player2', {name: data.name, group: data.group })
		} else if (group && group.length > 1){
			socket.emit('err', {message: 'Room is full, please start a new game'});
		} else {
			socket.emit('err', {message: 'Invalid ID!'});
		}
	});
	//To show it's the current player turn
	socket.on('nextTurn', function(data){
		socket.broadcast.to(data.group).emit('toNext', {
			box: data.box,
			group: data.group
		});
	});
	//When there is a winner
	socket.on('gameOver', function(data){
		socket.broadcast.to(data.group).emit('endGame', data);
	});
	//When one of the user is leaving or clicked reset
	socket.on('reset', function(data){
		socket.broadcast.to(data.group).emit('resetGame', data);
	});
})
//Show the localhost id in console
server.listen(3000, () => {
    console.log('listening on 3000');
});