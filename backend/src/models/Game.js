const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    gameId: { type: String, required: true, unique: true },
    players: [{ type: String, required: true }],
    winner: { type: String, default: null },
    isDraw: { type: Boolean, default: false },
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: Date.now },
    movesCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('Game', gameSchema);
