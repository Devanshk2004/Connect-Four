require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const { connectKafka } = require('./services/kafka.service');
const GameManager = require('./services/GameManager');
const startAnalytics = require('./services/Analytics');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', 
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 4000;

connectDB();
connectKafka();
new GameManager(io);
startAnalytics();

app.get('/', (req, res) => {
    res.send('Connect Four Server Running');
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
