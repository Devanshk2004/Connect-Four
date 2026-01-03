"use client";

import React from 'react';

const ROWS = 6;
const COLS = 7;

export default function Board({ board, onColumnClick, isMyTurn, winner }) {
    // board is 6x7 array
    // We'll render it as a grid

    return (
        <div className="flex flex-col items-center">
            <div className="bg-blue-600 p-4 rounded-lg shadow-xl inline-block">
                {board.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex">
                        {row.map((cell, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center p-1 cursor-pointer hover:brightness-110 transition-all"
                                onClick={() => onColumnClick(colIndex)}
                            >
                                <div
                                    className={`w-full h-full rounded-full shadow-inner transition-colors duration-300 ${cell === null
                                            ? "bg-gray-800"
                                            : cell === 'player1' || (cell && cell !== 'player2' && cell !== 'Bot_AI') // Simple check if not p2 or bot
                                                ? "bg-red-500 ring-4 ring-red-700" // Player 1 (Red)
                                                : "bg-yellow-400 ring-4 ring-yellow-600" // Player 2 (Yellow)
                                        }`}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Column indicators for easier mobile play could go here */}
        </div>
    );
}
