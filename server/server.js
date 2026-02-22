const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const authRoutes = require('./routes/auth');
const sosRoutes = require('./routes/sos');
const uploadRoutes = require('./routes/upload');
const apiAuth = require('./routes/apiAuth');
const apiUser = require('./routes/apiUser');
const apiEmergency = require('./routes/apiEmergency');
const apiLocation = require('./routes/apiLocation');
const apiEvidence = require('./routes/apiEvidence');
const apiCheckIn = require('./routes/apiCheckIn');
const apiHeartbeat = require('./routes/apiHeartbeat');
const apiGuardian = require('./routes/apiGuardian');
const apiPolice = require('./routes/apiPolice');
const { router: oauthRedirectRouter } = require('./routes/oauthRedirect');
const { startTamperWatch } = require('./services/tamperDetector');
const { startCron } = require('./jobs/cron');

const PORT = config.PORT;
const MONGODB_URI = config.MONGODB_URI;

const corsOrigin = config.CORS_ORIGIN;
const corsOptions = corsOrigin === '*'
  ? { origin: '*' }
  : { origin: corsOrigin.split(',').map((o) => o.trim()).filter(Boolean) };

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests' },
});
const sosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many SOS requests' },
});

const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/auth', authRoutes);
app.use('/oauth', oauthRedirectRouter);
app.use('/sos', sosLimiter, sosRoutes(io));
app.use('/upload', uploadRoutes);

app.use('/api', apiLimiter);
app.use('/api/auth', apiAuth);
app.use('/api/user', apiUser);
app.use('/api/emergency', apiEmergency(io));
app.use('/api/location', apiLocation(io));
app.use('/api/evidence', apiEvidence);
app.use('/api/check-in', apiCheckIn);
app.use('/api/heartbeat', apiHeartbeat);
app.use('/api/guardian', apiGuardian);
app.use('/api/police', apiPolice);

require('./services/fcm').init();
startTamperWatch(io);
startCron(io);

server.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
