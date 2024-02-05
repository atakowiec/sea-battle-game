import {State} from "../../store";
import {useDispatch, useSelector} from "react-redux";
import gameStyle from "../../style/game.module.scss"
import {BoardCell} from "@shared/gameTypes.ts";
import {gameActions, GameState} from "../../store/gameSlice.ts";

export default function Game() {
    const game = useSelector((state: State) => state.game)

    return (
        <div className={gameStyle.gameContainer}>
            <h1>Sea Battle Game</h1>
            <div className={gameStyle.box}>
                <Board yourBoard={true}/>
                <div className={gameStyle.centerBox}>
                    <GameInfo game={game}/>
                    <Chat/>
                </div>
                <Board yourBoard={false}/>
            </div>
        </div>
    )
}

function Board({yourBoard}: { yourBoard: boolean }) {
    const game = useSelector((state: State) => state.game)
    const board = yourBoard ? game.board! : game.shots!
    const dispatch = useDispatch()

    const onClick = (x: number, y: number) => {
        if (yourBoard) {
            dispatch(gameActions.placeShip({x, y}))
        } else {
            dispatch(gameActions.shoot({x, y}))
        }
    }

    return (
        <div className={gameStyle.board}>
            <h2>
                {yourBoard ? "Your board" : "Your shots"}
            </h2>
            <div className={gameStyle.row}>
                <div className={`${gameStyle.cell} ${gameStyle.colNumber}`}></div>
                {board[0].map((_, i) => (
                    <div key={i} className={`${gameStyle.cell} ${gameStyle.colNumber}`}>{i + 1}</div>
                ))}
            </div>
            {board.map((row, i) => (
                <div key={i} className={gameStyle.row}>
                    <div className={`${gameStyle.cell} ${gameStyle.rowLetter}`}> {String.fromCharCode(65 + i)}</div>
                    {row.map((cell, j) => (
                        <Cell key={j} cell={cell} x={i} y={j} click={() => onClick(i, j)}/>
                    ))}
                </div>
            ))}
        </div>
    )
}

function Cell({cell, click, x, y}: { cell: BoardCell, click: () => void, x: number, y: number }) {
    const game = useSelector((state: State) => state.game)
    const board = game.board!

    const neighbors = {
        top: x > 0 && board[x - 1][y].ship,
        right: y < 9 && board[x][y + 1].ship,
        bottom: x < 9 && board[x + 1][y].ship,
        left: y > 0 && board[x][y - 1].ship
    }

    return (
        <div className={gameStyle.cell} onClick={click}>
            {cell.hit && <div className={gameStyle.hit}/>}
            {cell.ship &&
                <div className={gameStyle.ship}>
                    <div className={`${gameStyle.shipPart} ${neighbors.top && gameStyle.top}`}/>
                    <div className={`${gameStyle.shipPart} ${neighbors.right && gameStyle.right}`}/>
                    <div className={`${gameStyle.shipPart} ${neighbors.bottom && gameStyle.bottom}`}/>
                    <div className={`${gameStyle.shipPart} ${neighbors.left && gameStyle.left}`}/>
                    <div className={`${gameStyle.shipPart} ${gameStyle.center}`}/>

                </div>}
        </div>
    )

}

function Chat() {
    return (
        <div>
            <h1>
                CHAT
            </h1>
        </div>
    )
}

function GameInfo({game}: { game: GameState }) {
    const username = useSelector((state: State) => state.user.username)
    const opponentOnline = username === game.owner ? game.playerOnline : game.ownerOnline

    function translateStatus(status: string) {
        switch (status) {
            case "lobby":
                return "In lobby"
            case "started":
                return "Game started"
            case "finished":
                return "Game finished"
            case "preparing":
                return "Placing ships"
            default:
                return "Unknown status"
        }
    }

    return (
        <div className={gameStyle.info}>
            <h2>
                Game Info
            </h2>
            <div className={gameStyle.gameId}>
                Game ID: {game.id}
            </div>
            <div className={gameStyle.opponent}>
                Opponent: {game.player === username ? game.owner : game.player} {!opponentOnline && "(offline)"}
            </div>
            <div className={gameStyle.status}>
                {translateStatus(game.status)}
            </div>
        </div>
    )
}