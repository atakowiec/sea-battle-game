import {Plugin} from "@hapi/hapi/lib/types/plugin";
import {Server} from "@hapi/hapi/lib/types/server";
import {SocketType} from "./types.ts";

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

            socket.on("set_username", nickname => {
                socket.nickname = nickname
                console.log(`Set nickname to ${nickname} for socket ${socket.id}`)
            })

            socket.on('disconnect', () => {
                console.log(`socket ${socket.id} disconnected`);
            });
        });
    }
} as Plugin<any>