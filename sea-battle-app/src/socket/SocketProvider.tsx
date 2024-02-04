import {createContext, MutableRefObject, ReactNode, useEffect, useRef} from "react";
import io, {Socket} from "socket.io-client";
import {useSelector} from "react-redux";
import {State} from "../store";

export const SocketContext = createContext<MutableRefObject<Socket | null> | null>(null);

export function SocketProvider({children}: { children?: ReactNode }) {
    const socketRef = useRef<Socket | null>(null);
    const nickname = useSelector((state: State) => state.user.username)

    useEffect(() => {
        const socket = io('http://localhost:3000');

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('connected');
        });

        socket.on('disconnect', () => {
            console.log('disconnected');
        });

        if (nickname) {
            // if nickname has been retrieved from localstorage on first render send id to server
            socket.emit("set_username", nickname)
        }

        return () => {
            socket.disconnect()
        }
    }, []);

    return (
        <SocketContext.Provider value={socketRef}>
            {children}
        </SocketContext.Provider>
    )
}