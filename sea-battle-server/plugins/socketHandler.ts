import {Plugin} from "@hapi/hapi/lib/types/plugin";
import {Server} from "@hapi/hapi/lib/types/server";

module.exports = {
    name: 'socketHandler',
    version: '1.0.0',
    register: async function (server: Server) {
        const io = require('socket.io')(server.listener);

        io.on('connection', (socket: any) => {
            console.log('a user connected');

            socket.on('disconnect', () => {
                console.log('user disconnected');
            });
        });
    }
} as Plugin<any>