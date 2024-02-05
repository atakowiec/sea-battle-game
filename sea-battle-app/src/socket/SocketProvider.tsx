import {createContext, MutableRefObject, ReactNode, useEffect, useRef} from "react";
import io, {Socket} from "socket.io-client";
import {useDispatch} from "react-redux";
import {actions} from "../store/userSlice";
import {id, notificationActions} from "../store/notificationSlice";
import {ClientToServerEvents, ServerToClientEvents} from "@shared/socketTypes.ts";
import {gameActions} from "../store/gameSlice.ts";

export const SocketContext = createContext<MutableRefObject<Socket<ServerToClientEvents, ClientToServerEvents> | null> | null>(null);

export function SocketProvider({children}: { children?: ReactNode }) {
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const dispatch = useDispatch()

    useEffect(() => {
        const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3000');

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('connected');

            if (localStorage.getItem("username") && localStorage.getItem("username") !== "null") {
                // if username has been retrieved from localstorage on first render send id to server
                socket.emit("set_username", localStorage.getItem("username"), (error, message) => {
                    if (error) {
                        dispatch(actions.setUsername(""));

                        return dispatch(notificationActions.addNotification({
                            type: "error",
                            message: message
                        }))
                    }

                    dispatch(actions.setUsername(localStorage.getItem("username")))
                })
            } else {
                dispatch(actions.setUsername(null))
            }
        });

        socket.on("game_updated", (gameData) => dispatch(gameActions.updateGameData(gameData)))
        socket.on("game_set", (gameData) => {
            dispatch(gameActions.setGameData(gameData));
        })

        socket.on('info', (message) => {
            dispatch(notificationActions.addNotification({
                type: "info",
                message: message
            }))

            const newId = id;

            setTimeout(() => {
                dispatch(notificationActions.removeNotification(newId))
            }, 3000)
        });

        socket.on('error', (message) => {
            dispatch(notificationActions.addNotification({
                type: "error",
                message: message
            }))

            const newId = id;

            setTimeout(() => {
                dispatch(notificationActions.removeNotification(newId))
            }, 3000)
        });

        socket.on('disconnect', () => {
            console.log('disconnected');
        });

        return () => {
            socket.disconnect()
            socket.offAny()
        }
    }, [dispatch]);

    return (
        <SocketContext.Provider value={socketRef}>
            {children}
        </SocketContext.Provider>
    )
}