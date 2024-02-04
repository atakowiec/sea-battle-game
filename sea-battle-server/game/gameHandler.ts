import {Plugin} from "@hapi/hapi/lib/types/plugin";
import {Server} from "@hapi/hapi/lib/types/server";
import {SocketType} from "./types.ts";
import {Room} from "@shared/gameTypes.ts"

let rooms = [] as Room[]

module.exports = {
    name: 'socketHandler',
    version: '1.0.0',
    register: async function (server: Server) {
        const io = require('socket.io')(server.listener, {
            cors: {
                origin: "http://localhost:5173",
            }
        });

        io.on('connection', (socket: SocketType) => {
            console.log(`socket ${socket.id} connected`);

            socket.on("create_room", callback => createRoom(socket, callback))

            socket.on("set_username", (username: string, callback: (error: boolean, message?: string) => void) => {
                if ([...io.of("/").sockets.values()].find((socket: SocketType) => socket.username === username)) {
                    console.log(`socket ${socket.id} attempted to use taken username ${username}`)
                    return callback(true, "Username is taken!")
                }

                socket.username = username
                callback(false)
                console.log(`Set username to ${username} for socket ${socket.id}`)
            })

            socket.on('disconnect', () => {
                console.log(`socket ${socket.id} disconnected`);
            });
        });
    }
} as Plugin<any>

function createRoom(socket: SocketType, callback: (room: Room) => void) {
    if (!socket.username) {
        socket.emit("error", "You need to set your username first")
        return
    }

    if (rooms.find(room => (room.status == "preparing" || room.status == "playing")
        && (room.owner === socket.username || room.player == socket.username))) {

        // todo handle error event
        socket.emit("error", "You already have active room, try changing your username")
        return
    }

    // remove all rooms of the user
    rooms = rooms.filter(room => room.owner !== socket.username && room.player !== socket.username)

    let id: string
    do {
        id = Math.random().toString(36).substring(7)
    } while (rooms.find(room => room.id === id))

    const room: Room = {
        id: id,
        owner: socket.username,
        player: null,
        game: null,
        status: "lobby"
    }

    rooms.push(room)

    callback(room)
}