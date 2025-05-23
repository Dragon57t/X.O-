const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const players = [];
let board = Array(9).fill(null);
let currentTurn = "X";

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("شخص اتصل: " + socket.id);

  if (players.length >= 2) {
    socket.emit("full");
    return;
  }

  const mark = players.length === 0 ? "X" : "O";
  players.push({ id: socket.id, mark });
  socket.emit("waiting");

  if (players.length === 2) {
    io.emit("startGame", { mark: "X" });
  }

  socket.on("makeMove", (index) => {
    const player = players.find(p => p.id === socket.id);
    if (!player || board[index] || currentTurn !== player.mark) return;

    board[index] = player.mark;
    currentTurn = currentTurn === "X" ? "O" : "X";

    io.emit("moveMade", { index, mark: player.mark });

    const winner = checkWinner();
    if (winner) {
      io.emit("gameOver", { winner });
      board = Array(9).fill(null); // reset
      currentTurn = "X";
    } else if (board.every(cell => cell)) {
      io.emit("gameOver", { winner: null }); // تعادل
      board = Array(9).fill(null);
      currentTurn = "X";
    }
  });

  socket.on("disconnect", () => {
    console.log("شخص خرج: " + socket.id);
    const index = players.findIndex(p => p.id === socket.id);
    if (index !== -1) players.splice(index, 1);
    board = Array(9).fill(null);
    currentTurn = "X";
    io.emit("playerLeft");
  });
});

function checkWinner() {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

const PORT = process.env.PORT || 10000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});
