const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const config = require('./config');
const authRoutes = require('./routes/auth');
const sosRoutes = require('./routes/sos');
const { startTamperWatch } = require('./services/tamperDetector');

const PORT = config.PORT;
const MONGODB_URI = config.MONGODB_URI;

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const uploadRoutes = require('./routes/upload');

app.use('/auth', authRoutes);
app.use('/sos', sosRoutes(io));
app.use('/upload', uploadRoutes);

require('./services/fcm').init();
startTamperWatch(io);

server.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
