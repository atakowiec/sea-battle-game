import appStyle from "../style/app.module.scss"
import {useDispatch, useSelector} from "react-redux";
import {State} from "../store";
import {useEffect, useRef, useState} from "react";
import useSocket from "../socket/useSocket.ts";
import {openGamesActions} from "../store/openGamesSlice.ts";

export default function MainMenu() {
    const username = useSelector((state: State) => state.user.username)
    const openGames = useSelector((state: State) => state.openGames)
    const gameIdRef = useRef<HTMLInputElement>(null)
    const [error, setError] = useState("")
    const socket = useSocket()
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(openGamesActions.setOpenGames([]))
    }, [dispatch]);

    function createNewRoom() {
        socket.emit("create_game")
    }

    function joinRoom(id?: string) {
        const gameId = id ?? gameIdRef.current!.value

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
                    <button onClick={() => joinRoom()}>
                        Join game
                    </button>
                </div>
                {openGames.length > 0 &&
                    <div className={appStyle.openGamesBox}>
                        <h4>Open games</h4>
                        <ul>
                            {openGames.map((game) => (
                                <li key={game.id}>
                                    <div>
                                        Gra gracza: <b>{game.owner}</b>
                                        <span className={appStyle.idBox}>
                                            {game.id}
                                        </span>
                                    </div>
                                    <button onClick={() => joinRoom(game.id)}>
                                        Join
                                    </button>
                                </li>)
                            )}
                        </ul>
                    </div>
                }
            </div>
        </div>
    )
}