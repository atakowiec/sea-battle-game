import {useSelector} from "react-redux";
import {State} from "../../store";
import appStyle from "../../style/app.module.scss"
import useSocket from "../../socket/useSocket.ts";

export default function PreGameLobby() {
    const game = useSelector((state: State) => state.game)
    const user = useSelector((state: State) => state.user)
    const playerPresent = game.player != null
    const isOwner = game.owner === user.username
    const socket = useSocket()

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
                        {game.owner}
                        {!game.ownerOnline && game.owner && " (offline)"}
                    </span>
                </div>
                <div className={appStyle.member}>
                    <span className={appStyle.rank}>
                        player
                    </span>
                    <span className={appStyle.nickname}>
                        {game.player ?? "-"}
                        {!game.playerOnline && game.player && " (offline)"}
                    </span>
                    {playerPresent && isOwner && <button onClick={kick} className={appStyle.kick}>kick</button>}
                </div>
                {isOwner && <div>
                    <button className={appStyle.startGame} disabled={!playerPresent}>
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