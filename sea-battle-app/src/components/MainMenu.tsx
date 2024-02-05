import appStyle from "../style/app.module.scss"
import {useSelector} from "react-redux";
import {State} from "../store";
import {useRef, useState} from "react";
import useSocket from "../socket/useSocket.ts";

export default function MainMenu() {
    const username = useSelector((state: State) => state.user.username)
    const gameIdRef = useRef<HTMLInputElement>(null)
    const [error, setError] = useState("")
    const socket = useSocket()

    function createNewRoom() {
        socket.emit("create_game")
    }

    function joinRoom() {
        const gameId = gameIdRef.current!.value

        socket.emit("join_game", gameId, (message: string) => {
            setError(message)
        })
    }

    return (
        <div className={appStyle.centeredContainer}>
            <div className={`${appStyle.preGameMenu} ${appStyle.box}`}>
                <h1>Sea Battle Game!</h1>
                <h5>Hello {username}</h5>
                <div>
                    <button onClick={createNewRoom}>
                        Create new game
                    </button>
                </div>
                <div className={appStyle.divider}>
                    or
                </div>
                <div>
                    <input ref={gameIdRef} placeholder="game id"/>
                    <div className={appStyle.error}>
                        {error}
                    </div>
                </div>
                <div>
                    <button onClick={joinRoom}>
                        Join game
                    </button>
                </div>
            </div>
        </div>
    )
}