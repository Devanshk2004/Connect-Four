"use client";

import React, { useEffect, useState } from 'react';
import { socket } from '../socket';

export default function Leaderboard() {
    const [leaders, setLeaders] = useState([]);

    useEffect(() => {
        // Request initial
        socket.emit('get_leaderboard');

        const handleUpdate = (data) => {
            setLeaders(data);
        };

        socket.on('leaderboard_update', handleUpdate);

        return () => {
            socket.off('leaderboard_update', handleUpdate);
        };
    }, []);

    return (
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-sm ml-4 h-fit">
            <h2 className="text-2xl font-bold mb-4 text-purple-400 border-b border-gray-700 pb-2">🏆 Leaderboard</h2>
            {leaders.length === 0 ? (
                <p className="text-gray-500 text-center">No games played yet.</p>
            ) : (
                <ul className="space-y-2">
                    {leaders.map((player, index) => (
                        <li key={player.username} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                            <span className="font-bold flex items-center">
                                <span className={`mr-2 w-6 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                                    {index + 1}.
                                </span>
                                {player.username}
                            </span>
                            <span className="text-green-400 font-mono">{player.wins} Wins</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
