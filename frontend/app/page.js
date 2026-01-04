"use client";

import { useEffect, useState } from "react";
import { socket } from "../socket";
import Board from "../components/Board";
import GameInfo from "../components/GameInfo";
import Leaderboard from "../components/Leaderboard";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [isInQueue, setIsInQueue] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [board, setBoard] = useState([]);
  const [turn, setTurn] = useState(null); // username of current turn
  const [players, setPlayers] = useState({}); // { player1, player2 }
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [error, setError] = useState(null);

  // Connection handling
  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onGameStart(data) {
      setIsInQueue(false);
      setGameId(data.gameId);
      setPlayers(data.players);
      setTurn(data.turn);
      // Initialize 6x7 board
      setBoard(Array(6).fill(null).map(() => Array(7).fill(null)));
      setWinner(null);
      setIsDraw(false);
      setError(null);
    }

    function onMoveMade({ row, col, player, nextTurn }) {
      setBoard(prev => {
        const newBoard = prev.map(r => [...r]);
        newBoard[row][col] = player;
        return newBoard;
      });
      setTurn(nextTurn);
    }

    function onGameOver({ winner, isDraw, reason }) {
      setWinner(winner);
      setIsDraw(isDraw);
      if (reason) setError(reason); // Show forfeit reason if any
      socket.emit('get_leaderboard'); // Refresh leaderboard
    }

    function onReconnectSuccess({ gameId, state }) {
      setGameId(gameId);
      setPlayers({ player1: state.players[0], player2: state.players[1] });
      setBoard(state.board);
      setTurn(state.turn);
      setWinner(state.winner);
      setIsDraw(state.isDraw);
      setIsInQueue(false);
    }

    function onPlayerDisconnected({ username }) {
      setError(`${username} disconnected. Waiting for reconnect...`);
    }

    function onPlayerReconnected({ username }) {
      setError(`${username} reconnected! Resuming...`);
      setTimeout(() => setError(null), 3000);
    }

    function onError({ message }) {
      setError(message);
      setIsInQueue(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("game_start", onGameStart);
    socket.on("move_made", onMoveMade);
    socket.on("game_over", onGameOver);
    socket.on("reconnect_success", onReconnectSuccess);
    socket.on("player_disconnected", onPlayerDisconnected);
    socket.on("player_reconnected", onPlayerReconnected);
    socket.on("error", onError);

    // Connect immediately
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("game_start", onGameStart);
      socket.off("move_made", onMoveMade);
      socket.off("game_over", onGameOver);
      socket.off("reconnect_success", onReconnectSuccess);
      socket.off("player_disconnected", onPlayerDisconnected);
      socket.off("player_reconnected", onPlayerReconnected);
      socket.off("error", onError);
      socket.disconnect();
    };
  }, []);

  const handleJoinQueue = () => {
    if (!username) return;
    setIsInQueue(true);
    setError(null);
    socket.emit("join_queue", { username });
  };

  const handleReconnect = () => {
    if (!username) return;
    socket.emit("reconnect_game", { username });
  };

  const handleColumnClick = (colIndex) => {
    if (!gameId || winner || isDraw) return;
    if (turn !== username) return; // Prevent move if not turn

    socket.emit("make_move", { col: colIndex });
  };

  const resetGame = () => {
    setGameId(null);
    setWinner(null);
    setIsDraw(false);
    setBoard([]);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 font-sans flex flex-col md:flex-row items-start justify-center">
      <div className="flex flex-col items-center w-full max-w-3xl self-center">
        <h1 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Connect Four
        </h1>

        {/* Status Bar */}
        <div className="mb-4">
          Status: <span className={isConnected ? "text-green-400" : "text-red-400"}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-100 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {!gameId ? (
          /* Matchmaking UI */
          <div className="bg-gray-900 p-8 rounded-xl shadow-2xl flex flex-col items-center gap-4 w-full max-w-md">
            <input
              type="text"
              placeholder="Enter Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="p-3 rounded bg-gray-800 border border-gray-700 w-full focus:outline-none focus:border-blue-500 text-center text-lg"
              disabled={isInQueue}
            />

            {!isInQueue ? (
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleJoinQueue}
                  disabled={!username}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg w-full transition-colors shadow-lg shadow-blue-900/20"
                >
                  Find Match
                </button>
                <button
                  onClick={handleReconnect}
                  disabled={!username}
                  className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  title="Rejoin existing game"
                >
                  ↻
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-blue-300">Searching for opponent...</p>
                <p className="text-xs text-gray-500">(Bot will join in 10s if no player found)</p>
              </div>
            )}
          </div>
        ) : (
          /* Game UI */
          <div className="w-full flex flex-col items-center animate-fade-in">
            <GameInfo
              myUsername={username}
              opponentName={players.player1 === username ? players.player2 : players.player1}
              turn={turn}
              winner={winner}
              isDraw={isDraw}
              gameId={gameId}
            />

            <Board
              board={board}
              onColumnClick={handleColumnClick}
              isMyTurn={turn === username}
              winner={winner}
              players={players}
            />

            {(winner || isDraw) && (
              <button
                onClick={resetGame}
                className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all"
              >
                Play Again
              </button>
            )}
          </div>
        )}
      </div>

      {/* Leaderboard Sidebar */}
      <div className="mt-8 md:mt-0">
        <Leaderboard />
      </div>
    </main>
  );
}
