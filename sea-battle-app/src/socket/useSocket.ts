import {useContext} from "react";
import {SocketContext} from "./SocketProvider.tsx";

export default function () {
    const socketContext = useContext(SocketContext)

    return socketContext!.current!
}