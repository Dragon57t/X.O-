const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingPlayer = null;

io.on("connection", (socket) => {
  console.log("لاعب متصل:", socket.id);

  if (waitingPlayer) {
    // إذا في لاعب ينتظر، نربطهم مع بعض
    const room = `${waitingPlayer.id}#${socket.id}`;
    socket.join(room);
    waitingPlayer.join(room);

    // نرسل لكل واحد دوره
    socket.emit("startGame", { mark: "O" });
    waitingPlayer.emit("startGame", { mark: "X" });

    // ننسى اللاعب المنتظر
    waitingPlayer = null;
  } else {
    // إذا مافي لاعب ينتظر، نخليه ينتظر
    waitingPlayer = socket;
    socket.emit("waiting");
  }

  socket.on("move", (data) => {
    socket.to(data.room).emit("move", data);
  });

  socket.on("disconnect", () => {
    if (waitingPlayer === socket) {
      waitingPlayer = null;
    }
  });
});

server.listen(3000, () => {
  console.log("الخادم يعمل على المنفذ 3000");
});
