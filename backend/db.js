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

const GameModel = mongoose.model('Game', gameSchema);

const connectDB = async () => {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/connectfour';
    try {
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        // We don't exit the process here to allow the game to run in-memory even if DB fails
    }
};

const saveGame = async (gameData) => {
    try {
        const game = new GameModel(gameData);
        await game.save();
        console.log(`Game ${gameData.gameId} saved to DB`);
    } catch (err) {
        console.error('Error saving game to DB:', err.message);
    }
};

const getLeaderboard = async () => {
    try {
        // Aggregate wins by player
        const leaderboard = await GameModel.aggregate([
            { $match: { winner: { $ne: null } } },
            { $group: { _id: "$winner", wins: { $sum: 1 } } },
            { $sort: { wins: -1 } },
            { $limit: 10 }
        ]);
        return leaderboard.map(entry => ({ username: entry._id, wins: entry.wins }));
    } catch (err) {
        console.error('Error fetching leaderboard:', err.message);
        return [];
    }
};

module.exports = { connectDB, saveGame, getLeaderboard };
