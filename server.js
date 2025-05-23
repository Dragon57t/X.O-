const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = process.env.PORT || 10000;

app.use(express.static("public"));

let players = [];
let currentTurn = "X";

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
    io.emit("startGame", { mark: currentTurn });
  } else {
    socket.emit("waiting");
  }

  socket.on("makeMove", (index) => {
    const player = players.find(p => p.id === socket.id);
    if (!player || player.mark !== currentTurn) return;

    io.emit("moveMade", { index, mark: currentTurn });

    if (checkWinner(index, currentTurn)) {
      io.emit("gameOver", { winner: currentTurn });
      resetGame();
    } else if (++moveCount >= 9) {
      io.emit("gameOver", { winner: null }); // تعادل
      resetGame();
    } else {
      currentTurn = currentTurn === "X" ? "O" : "X";
    }
  });

  socket.on("disconnect", () => {
    console.log("لاعب خرج:", socket.id);
    players = players.filter(p => p.id !== socket.id);
    io.emit("playerLeft");
    resetGame();
  });
});

let moveCount = 0;
function resetGame() {
  moveCount = 0;
  currentTurn = "X";
  players = [];
}

function checkWinner(index, mark) {
  const board = new Array(9).fill("");
  for (const socket of players) {
    board[socket.index] = socket.mark;
  }
  // في الواقع، هذا فقط تمثيل. تحقق الفوز يتم من خلال العميل الآن.
  // لو أردت تحقق كامل من السيرفر، يمكننا تحسينه لاحقًا.
  return false;
}

http.listen(PORT, "0.0.0.0", () => {
  console.log("الخادم يعمل على المنفذ", PORT);
});
