const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 10000;

app.use(express.static("public")); // تأكد أن ملفات HTML/CSS/JS موجودة بمجلد public

let players = [];
let currentTurn = "X";
let board = Array(9).fill("");
let moveCount = 0;

io.on("connection", (socket) => {
  console.log("لاعب متصل:", socket.id);

  if (players.length >= 2) {
    socket.emit("full");
    return;
  }

  const mark = players.length === 0 ? "X" : "O";
  players.push({ id: socket.id, mark });
  socket.emit("startGame", { mark });

  if (players.length === 2) {
    io.to(players[0].id).emit("yourTurn", true);
    io.to(players[1].id).emit("yourTurn", false);
  } else {
    socket.emit("waiting");
  }

  socket.on("makeMove", (index) => {
    const player = players.find(p => p.id === socket.id);
    if (!player || board[index] !== "" || player.mark !== currentTurn) return;

    board[index] = player.mark;
    moveCount++;
    io.emit("moveMade", { index, mark: player.mark });

    if (checkWinner(player.mark)) {
      io.emit("gameOver", { winner: player.mark });
      resetGame();
    } else if (moveCount >= 9) {
      io.emit("gameOver", { winner: null }); // تعادل
      resetGame();
    } else {
      currentTurn = currentTurn === "X" ? "O" : "X";
      players.forEach(p => {
        io.to(p.id).emit("yourTurn", p.mark === currentTurn);
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("لاعب خرج:", socket.id);
    players = players.filter(p => p.id !== socket.id);
    io.emit("playerLeft");
    resetGame();
  });
});

function resetGame() {
  board = Array(9).fill("");
  currentTurn = "X";
  moveCount = 0;
  players = [];
}

function checkWinner(mark) {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // صفوف
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // أعمدة
    [0, 4, 8], [2, 4, 6]             // أقطار
  ];
  return winPatterns.some(pattern =>
    pattern.every(i => board[i] === mark)
  );
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});
