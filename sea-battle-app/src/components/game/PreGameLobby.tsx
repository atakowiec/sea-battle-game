import {useDispatch, useSelector} from "react-redux";
import {State} from "../../store";
import appStyle from "../../style/app.module.scss"
import useSocket from "../../socket/useSocket.ts";
import {gameActions} from "../../store/gameSlice.ts";

export default function PreGameLobby() {
    const game = useSelector((state: State) => state.game)
    const user = useSelector((state: State) => state.user)
    const playerPresent = game.player != null
    const isOwner = game.owner.username === user.username
    const socket = useSocket()
    const dispatch = useDispatch()

    function onCornerCollisionsChange() {
        if (!isOwner) return

        dispatch(gameActions.changeSetting({cornerCollisionsAllowed: !game.cornerCollisionsAllowed}))
        socket.emit("set_settings", {cornerCollisionsAllowed: !game.cornerCollisionsAllowed})
    }

    function onShipWrappingChange() {
        if (!isOwner) return

        dispatch(gameActions.changeSetting({shipWrappingAllowed: !game.shipWrappingAllowed}))
        socket.emit("set_settings", {shipWrappingAllowed: !game.shipWrappingAllowed})
    }

    function onOpenGameChange() {
        if (!isOwner) return

        dispatch(gameActions.changeSetting({isOpen: !game.isOpen}))
        socket.emit("set_settings", {isOpen: !game.isOpen})
    }

    function kick() {
        if (!playerPresent || !isOwner) return

        socket.emit("kick")
    }

    function leaveGame() {
        if (isOwner) return

        socket.emit("leave_game")
    }

    function deleteGame() {
        if (!isOwner) return

        socket.emit("delete_game")
    }

    function startGame() {
        if (!isOwner || !playerPresent) return

        socket.emit("start_game")
    }

    return (
        <div className={`${appStyle.centeredContainer}`}>
            <div className={`${appStyle.box} ${appStyle.preGameLobby}`}>
                <h1>
                    GAME LOBBY
                </h1>
                <h5>
                    ID: {game.id}
                </h5>
                <div className={appStyle.member}>
                    <span className={appStyle.rank}>
                        owner
                    </span>
                    <span className={appStyle.nickname}>
                        {game.owner.username}
                        {!game.owner.online && game.owner && " (offline)"}
                    </span>
                </div>
                <div className={appStyle.member}>
                    <span className={appStyle.rank}>
                        player
                    </span>
                    <span className={appStyle.nickname}>
                        {game.player?.username ?? "-"}
                        {!game.player?.online && game.player && " (offline)"}
                    </span>
                    {playerPresent && isOwner && <button onClick={kick} className={appStyle.kick}>kick</button>}
                </div>
                <div>
                    <label>
                        <input type={"checkbox"}
                               checked={game.shipWrappingAllowed}
                               onChange={onShipWrappingChange}
                               disabled={!isOwner}/>
                        Allow ship wrapping
                    </label>
                </div>
                <div>
                    <label>
                        <input type={"checkbox"}
                               checked={game.cornerCollisionsAllowed}
                               onChange={onCornerCollisionsChange}
                               disabled={!isOwner}/>
                        Allow corner collisions
                    </label>
                </div>
                <div>
                    <label>
                        <input type={"checkbox"}
                               checked={game.isOpen}
                               onChange={onOpenGameChange}
                               disabled={!isOwner}/>
                        Open game
                    </label>
                </div>
                {isOwner && <div>
                    <button className={appStyle.startGame} disabled={!playerPresent} onClick={startGame}>
                        Start game
                    </button>
                    <button className={appStyle.deleteGame} onClick={deleteGame}>
                        Delete game
                    </button>
                </div>}
                {!isOwner && <button className={appStyle.startGame} onClick={leaveGame}>
                    Leave game
                </button>}
            </div>
        </div>
    )
}