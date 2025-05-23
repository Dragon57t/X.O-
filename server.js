const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let waitingPlayer = null;

io.on("connection", (socket) => {
  console.log("لاعب متصل:", socket.id);

  socket.on("findOpponent", () => {
    if (waitingPlayer) {
      const playerX = waitingPlayer;
      const playerO = socket;

      playerX.mark = "X";
      playerO.mark = "O";

      playerX.emit("startGame", { mark: "X" });
      playerO.emit("startGame", { mark: "O" });

      playerX.opponent = playerO;
      playerO.opponent = playerX;

      playerX.emit("yourTurn", true);
      playerO.emit("yourTurn", false);

      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
    }
  });

  socket.on("makeMove", (index) => {
    if (socket.opponent) {
      socket.emit("moveMade", { index, mark: socket.mark });
      socket.opponent.emit("moveMade", { index, mark: socket.mark });
      socket.emit("yourTurn", false);
      socket.opponent.emit("yourTurn", true);
    }
  });

  socket.on("disconnect", () => {
    if (waitingPlayer === socket) {
      waitingPlayer = null;
    }
    if (socket.opponent) {
      socket.opponent.emit("playerLeft");
      socket.opponent.opponent = null;
    }
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log("الخادم يعمل على المنفذ", process.env.PORT || 3000);
});
