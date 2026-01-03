"use client";

import React from 'react';

export default function GameInfo({ myUsername, opponentName, turn, winner, isDraw, gameId }) {
    const isMyTurn = turn === myUsername;

    let statusMessage;
    if (winner) {
        statusMessage = winner === myUsername ? "🎉 You Won!" : `😞 ${winner} Won!`;
    } else if (isDraw) {
        statusMessage = "🤝 It's a Draw!";
    } else {
        statusMessage = isMyTurn ? "🟢 Your Turn" : `🔴 ${opponentName}'s Turn`;
    }

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-4 w-full max-w-md text-center">
            <div className="text-sm text-gray-400 mb-2">Game ID: {gameId}</div>
            <div className="flex justify-between items-center mb-4 text-xl font-bold">
                <div className="text-red-500">{myUsername} (You)</div>
                <div className="text-gray-500">vs</div>
                <div className="text-yellow-400">{opponentName}</div>
            </div>

            <div className={`text-2xl font-bold p-2 rounded ${winner
                    ? winner === myUsername ? "bg-green-600" : "bg-red-600"
                    : isMyTurn ? "bg-green-600 animate-pulse" : "bg-gray-700"
                }`}>
                {statusMessage}
            </div>
        </div>
    );
}
