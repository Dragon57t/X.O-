const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, "public")));

let waitingPlayer = null;

io.on("connection", (socket) => {
  console.log("لاعب متصل:", socket.id);

  socket.on("findOpponent", () => {
    if (waitingPlayer) {
      const playerX = waitingPlayer;
      const playerO = socket;

      playerX.emit("startGame", { mark: "X" });
      playerO.emit("startGame", { mark: "O" });

      // ربط اللاعبين معًا
      playerX.opponent = playerO;
      playerO.opponent = playerX;

      // إزالة من قائمة الانتظار
      waitingPlayer = null;

      console.log("بدأت لعبة بين", playerX.id, "و", playerO.id);
    } else {
      waitingPlayer = socket;
      socket.emit("waiting");
      console.log("لاعب ينتظر خصم:", socket.id);
    }
  });

  socket.on("makeMove", (data) => {
    if (socket.opponent) {
      socket.opponent.emit("opponentMove", data);
    }
  });

  socket.on("disconnect", () => {
    console.log("لاعب خرج:", socket.id);

    if (waitingPlayer === socket) {
      waitingPlayer = null;
    }

    if (socket.opponent) {
      socket.opponent.emit("opponentLeft");
      socket.opponent.opponent = null;
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});
