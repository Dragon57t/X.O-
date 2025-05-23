const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + '/public'));

let players = [], board = Array(9).fill(null), turn = 'X';

io.on('connection', (socket) => {
  if (players.length >= 2) return socket.disconnect();

  players.push(socket);
  const symbol = players.length === 1 ? 'X' : 'O';
  socket.emit('game.begin', { symbol });

  socket.on('make.move', (data) => {
    if (board[data.index] || symbol !== turn) return;

    board[data.index] = symbol;
    turn = turn === 'X' ? 'O' : 'X';
    io.emit('move.made', { index: data.index, symbol });

    if (checkWin()) {
      io.emit('game.over', { message: `${symbol} wins!` });
      resetGame();
    } else if (board.every(Boolean)) {
      io.emit('game.over', { message: 'Draw!' });
      resetGame();
    }
  });

  socket.on('disconnect', () => {
    players = players.filter(p => p !== socket);
    resetGame();
  });

  function resetGame() {
    board = Array(9).fill(null);
    turn = 'X';
  }

  function checkWin() {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return lines.some(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
  }
});

server.listen(process.env.PORT || 3000, () => console.log('Server running...'));
