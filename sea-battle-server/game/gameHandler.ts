import {Plugin} from "@hapi/hapi/lib/types/plugin";
import {Server} from "@hapi/hapi/lib/types/server";
import {InterServerEvents, SocketData, SocketServerType, SocketType} from "./types.ts";
import {Game} from "./Game.ts";
import {Server as SocketIOServer} from "socket.io";
import {ClientToServerEvents, ServerToClientEvents} from "@shared/socketTypes.ts";
import OpenGamesHandler from "./OpenGamesHandler.ts";


module.exports = {
    name: 'socketHandler',
    version: '1.0.0',
    register: async function (server: Server) {
        const io: SocketServerType = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server.listener, {
            cors: {
                origin: ["http://localhost:5173", "http://192.168.0.25:5173", "http://83.5.108.177", "http://statki:5173"],
            }
        });

        Game.io = io

        io.on('connection', (socket) => {
            console.log(`socket ${socket.id} connected`);
            socket.join("open_games_broadcast")

            socket.on("create_game", () => Game.createGame(socket))

            socket.on("join_game", (id, errorCallback) => joinRoom(socket, id, errorCallback))

            socket.on("kick", () => socket.data.game?.kick(socket))

            socket.on("leave_game", () => socket.data.game?.leave(socket))

            socket.on("delete_game", () => socket.data.game?.deleteGame(socket))

            socket.on("start_game", () => socket.data.game?.startGame(socket))

            socket.on("set_settings", (settings) => socket.data.game?.setSettings(socket, settings))

            socket.on("set_username", (username, callback) => setUserName(socket, username, callback))

            socket.on("place_ships", (ship) => socket.data.game?.placeShips(socket, ship))

            socket.on("toggle_ready", () => socket.data.game?.toggleReady(socket))

            socket.on("start_shooting", () => socket.data.game?.startShooting(socket))

            socket.on("send_shot", (x, y) => socket.data.game?.sendShot(socket, x, y))

            socket.on("end_screen_action", (action) => socket.data.game?.endScreenAction(socket, action as any))

            socket.on("surrender", () => socket.data.game?.surrender(socket))

            socket.on('disconnect', () => {
                console.log(`socket ${socket.id} disconnected`);

                socket.data.game?.onDisconnect(socket)
            });
        });
    }
} as Plugin<any>

function setUserName(socket: SocketType, username: string | null, callback: (error: boolean, message?: string) => void) {
    if(socket.data.username === username) return callback(false);

    let otherSocket = [...Game.io.of("/").sockets.values()].find((socket) => socket.data.username === username)
    if (otherSocket?.connected) {
        console.log(`socket ${socket.id} attempted to use taken username ${username}`)
        return callback(true, "Username is taken!")
    }

    if (otherSocket) {
        otherSocket.disconnect();
    }

    socket.data.username = username

    const game = Game.initializedGames.find(game => game.owner.username === username || game.player?.username === username)
    if (game) {
        game.reconnect(socket)
    }

    callback(false)
    OpenGamesHandler.instance.sendOpenGames(socket)
    console.log(`Set username to ${username} for socket ${socket.id}`)
}

function joinRoom(socket: SocketType, id: string, errorCallback: (message: string) => void) {
    const game = Game.initializedGames.find(game => game.id === id)
    if (!game) {
        errorCallback("Game not found")
        return
    }

    game.join(socket, errorCallback)
}