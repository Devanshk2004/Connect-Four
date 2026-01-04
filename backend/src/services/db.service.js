const mongoose = require('mongoose');
const GameModel = require('../models/Game');


const localGames = [];

const saveGame = async (gameData) => {

    localGames.push(gameData);

    if (mongoose.connection.readyState === 1) {
        try {
            const game = new GameModel(gameData);
            await game.save();
            console.log(`Game ${gameData.gameId} saved to DB`);
        } catch (err) {
            console.error('Error saving game to DB:', err.message);
        }
    }
};

const getLeaderboard = async () => {
    if (mongoose.connection.readyState === 1) {
        try {
            const leaderboard = await GameModel.aggregate([
                { $match: { winner: { $ne: null } } },
                { $group: { _id: "$winner", wins: { $sum: 1 } } },
                { $sort: { wins: -1 } },
                { $limit: 10 }
            ]);
            return leaderboard.map(entry => ({ username: entry._id, wins: entry.wins }));
        } catch (err) {
            console.error('Error fetching leaderboard from DB:', err.message);
        }
    }


    const counts = {};
    localGames.forEach(g => {
        if (g.winner) {
            counts[g.winner] = (counts[g.winner] || 0) + 1;
        }
    });

    const sorted = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([username, wins]) => ({ username, wins }));

    return sorted;
};

module.exports = { saveGame, getLeaderboard };
