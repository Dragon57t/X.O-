const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// تخدم ملفات HTML و CSS و JS من مجلد public
app.use(express.static('public'));

let waitingPlayer = null;

io.on('connection', (socket) => {
  console.log('لاعب جديد متصل:', socket.id);

  if (waitingPlayer) {
    // فيه لاعب ينتظر - نبدأ اللعبة
    const playerX = waitingPlayer;
    const playerO = socket;

    playerX.emit('startGame', { mark: 'X' });
    playerO.emit('startGame', { mark: 'O' });

    // ربط الاثنين مع بعض
    playerX.opponent = playerO;
    playerO.opponent = playerX;

    waitingPlayer = null;
  } else {
    // ما في أحد ينتظر - ننتظره
    waitingPlayer = socket;
    socket.emit('waiting');
  }

  // عند اللعب
  socket.on('makeMove', (data) => {
    if (socket.opponent) {
      socket.opponent.emit('moveMade', data);
    }
  });

  // عند قطع الاتصال
  socket.on('disconnect', () => {
    console.log('لاعب خرج:', socket.id);
    if (socket.opponent) {
      socket.opponent.emit('opponentLeft');
    }
    if (waitingPlayer === socket) {
      waitingPlayer = null;
    }
  });
});

// الاستماع على المنفذ الذي تطلبه Render
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});
