import {Socket} from "socket.io";

export interface SocketType extends Socket {
    username: string
}