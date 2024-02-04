import appStyle from "../style/app.module.scss"
import {useDispatch, useSelector} from "react-redux";
import {State} from "../store";
import {useRef} from "react";
import useSocket from "../socket/useSocket.ts";
import {Room} from "@shared/gameTypes.ts";
import {gameActions} from "../store/gameSlice.ts";

export default function MainMenu() {
    const username = useSelector((state: State) => state.user.username)
    const gameIdRef = useRef(null)
    const socket = useSocket()
    const dispatch = useDispatch()

    function createNewRoom() {
        socket.emit("create_room", (room: Room) => {
            dispatch(gameActions.setGameData(room))
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
                </div>
                <div>
                    <button>
                        Join game
                    </button>
                </div>
            </div>
        </div>
    )
}