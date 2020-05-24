
/**
  * @desc contains the main game logic here
  * @param null
  * @return null - game is running
*/
(function() {
	var P1 = 'X', P2 = 'O';
	var socket = io.connect('http://localhost:3000/');
	var currentTurn;
	var playerType;
	var groupID;
	var board = [];
	//Triggered when user clicks on the START GAME
	$('#start').on('click', function(){
		socket.emit('startGame', {name: 'Player X'});
		playerType = P1;
	});
	//Player 1 UI page (Before another player joining)
	socket.on('new', function(data){
		groupID = data.group;
		$('.front-page').css('display', 'none');
		$('.board').css('display', 'block');
		$('#greeting').html('Group ' + groupID + ' - ' + data.name + 
				'.<span id="disappear"> <br><br/> Your group ID is ' + data.group + '. Please ask your friend to join the game.</span>');
		currentTurn = null;
	});
	//Triggered when another user joined the game
	$('#join').on('click', function(){
		groupID = $('#group').val();
		if(!groupID){
			alert('Please enter the game ID.');
			return;
		}
		socket.emit('joinGame', {name: 'Group ' + groupID + ' - Player O', group: groupID});
		playerType = P2;
	});
	//Player 2 UI page (After another player joined)
	socket.on('player2', function(data){
		$('.front-page').css('display', 'none');
		$('.board').css('display', 'block');
		$('#greeting').text(data.name);
		currentTurn = false;
		$('#turn').text('Waiting for your friend...');
	}); 
	//Player 2 UI page (After another player joined)
	socket.on('player1', function(data){
		$('.front-page').css('display', 'none');
		$('.board').css('display', 'block');
		$('#disappear').remove();
		currentTurn = true;
		$('#turn').text('It is your turn.');
	}); 
	//Triggered when it's another player's turn
	socket.on('toNext', function(data){
		var opponentType = playerType == P1 ? P2 : P1;
		$('#'+data.box).text(opponentType);
		$('#'+data.box).prop('disabled', true);//oppa
		var row = data.box.split('_')[1][0];
		var col = data.box.split('_')[1][1];
		board[row][col] = opponentType;
		currentTurn = true;
		$('#turn').text('It is your turn.');
	});
	//Triggered when user entered a wrong group ID or room is full
	socket.on('err', function(data){
		alert(data.message);
	});
	//Triggered when the game is ended, reload the page
	socket.on('endGame', function(data){
		$('#turn').text(data.message);
	});
	//Triggered when the game is ended, reload the page
	socket.on('resetGame', function(data){
		location.reload();
	});
	//Triggered when user click on reset
	$('#reset').on('click', function(){
		socket.emit('reset', {group: groupID});
		location.reload();
	});
	//Triggered when user closed a tab, reload the page
	window.onbeforeunload = function(){
		socket.emit('reset', {group: groupID});
		location.reload();
	};
	//Create 3x3 matrices
	for(var i=0; i<3; i++) {
		board.push(['','','']);
		for(var j=0; j<3; j++) {
			$('#button_' + i + '' + j).on('click', function(){
				//Check whether the player clicked on a button that is selected
				if ($(this).prop('occupied')) {
					alert('Select an empty square.');
					return;
				}
				//Check whether another player has joined
				if(currentTurn == null) {
					alert('Your friend has not entered.');
					return;
				}
				//Check whether which player's turn
				if(!currentTurn) {
					alert('It is not your turn.');
					return;
				}
				var box = $(this).attr('id');
				var turnObj = {
					box: box,
					group: groupID
				};
				//It's another player's turn now
				socket.emit('nextTurn', turnObj);
				var row = box.split('_')[1][0];
				var col = box.split('_')[1][1];
				board[row][col] = playerType;
				currentTurn = false;
				$('#turn').text('Waiting for your friend...');
				$(this).text(playerType);
				$(this).prop('occupied', true);
				var tied = true;
				//Check row & column
				for(var i = 0; i < 3; i++){
			    	if(board[i][0] == playerType && board[i][1] == playerType && board[i][2] == playerType ||
			    		board[0][i] == playerType && board[1][i] == playerType && board[2][i] == playerType) {
			        	tied = reportWin();
			      	} 
			    }
			    //Check diagonal
			    if(board[0][0] == playerType && board[1][1] == playerType && board[2][2] == playerType ||
			    	board[2][0] == playerType && board[1][1] == playerType && board[0][2] == playerType) {
			      	tied = reportWin();
			    } 
				for(var i = 0; i < 3; i++){
					for(var j = 0; j < 3; j++){
						if(board[i][j] == ''){
							tied = false;
						}
					}	
				}
				checkTie(tied);
			});
		}
	}
	/**
	  * @desc check whether it's a tie
	  * @param bool - is a tie?
	  * @return null - text changed to Game Tied
	*/
	function checkTie(tied) {
		if(tied){
			socket.emit('gameOver', {group: groupID, message: 'Game Tied!'});
			$('#turn').text('Game Tied!');  
		}
	}
	/**
	  * @desc report who is the winner
	  * @param null
	  * @return null - text changed to show current player is winner
	*/
	function reportWin(){
		socket.emit('gameOver', {group: groupID, message: 'You lose!'});
		$('#turn').text('You win!');
		return false;
	}
})();