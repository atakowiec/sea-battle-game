import {createContext, MutableRefObject, ReactNode, useEffect, useRef} from "react";
import io, {Socket} from "socket.io-client";
import {useDispatch} from "react-redux";
import {actions} from "../store/userSlice";
import {actions as notificationActions} from "../store/notificationSlice";

export const SocketContext = createContext<MutableRefObject<Socket | null> | null>(null);

export function SocketProvider({children}: { children?: ReactNode }) {
    const socketRef = useRef<Socket | null>(null);
    const dispatch = useDispatch()

    useEffect(() => {
        const socket = io('http://localhost:3000');

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('connected');

            if (localStorage.getItem("username")) {
                // if username has been retrieved from localstorage on first render send id to server
                socket.emit("set_username", localStorage.getItem("username"), (error: boolean, message?: string) => {
                    if (error) {
                        return dispatch(notificationActions.addNotification({
                            type: "error",
                            message: message
                        }))
                    }

                    dispatch(actions.setUsername(localStorage.getItem("username")))
                })
            }
        });

        socket.on('disconnect', () => {
            console.log('disconnected');
        });

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