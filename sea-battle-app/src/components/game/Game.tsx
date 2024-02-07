import {State} from "../../store";
import {useDispatch, useSelector} from "react-redux";
import gameStyle from "../../style/game.module.scss"
import {BoardCell, ChangedCell, GameStatus, Ship, Position, BoardType} from "@shared/gameTypes.ts";
import {gameActions, GameState} from "../../store/gameSlice.ts";
import {useEffect, useState} from "react";
import useSocket from "../../socket/useSocket.ts";
import {notificationActions} from "../../store/notificationSlice.ts";

const falseMatrix: () => boolean[][] = () => Array.from({length: 10}, () => Array(10).fill(false))

export default function Game() {
    const game = useSelector((state: State) => state.game)
    const board = game.board!
    const [shipCounts, setShipCounts] = useState({} as { [key: number]: number })
    const [wrongPlacement, setWrongPlacement] = useState(falseMatrix())
    const socket = useSocket()
    const dispatch = useDispatch()

    useEffect(() => {
        socket.on("send_cell_change", (changedCell: ChangedCell[], yourBoard: boolean) => {
            dispatch(gameActions.changeCells({changedCell, yourBoard}))
        });

        return () => {
            console.log("unmount")
        }
    }, []);

    function checkBoard() {
        const ships = getBoardShips()
        const wrongShips = [] as Ship[]
        const wrongPlacement = [] as Position[]

        if (!game.shipWrappingAllowed) {
            for (const ship of ships) {
                const x = ship[0].x
                const y = ship[0].y

                if (!(ship.every(pos => pos.x === x) || ship.every(pos => pos.y === y))) {
                    wrongPlacement.push(...ship)
                    wrongShips.push(ship)
                }
            }
        }

        if (!game.cornerCollisionsAllowed) {
            for (const ship of ships) {
                for (const pos of ship) {
                    const cornerPositions = {
                        topLeft: {x: pos.x - 1, y: pos.y - 1},
                        topRight: {x: pos.x - 1, y: pos.y + 1},
                        bottomLeft: {x: pos.x + 1, y: pos.y - 1},
                        bottomRight: {x: pos.x + 1, y: pos.y + 1}
                    }

                    Object.values(cornerPositions).forEach(pos => {
                        const isThereShip = pos.x >= 0 && pos.x <= 9 && pos.y >= 0 && pos.y <= 9 && board[pos.x][pos.y].ship

                        if (!isThereShip) return

                        if (!ship.some(shipPos => shipPos.x === pos.x && shipPos.y === pos.y)) {
                            wrongPlacement.push(...ship)
                            wrongShips.push(ship)
                        }
                    })
                }
            }
        }

        // Count ships of each type
        const shipTypes: { [key: number]: number } = {}
        ships.forEach(ship => {
            if (wrongShips.includes(ship)) return

            const length = ship.length
            if (!shipTypes[length]) {
                shipTypes[length] = 1
            } else {
                shipTypes[length]++
            }
        })

        // Check if there are too many ships of a certain type or there are too long ships
        const keys = Object.keys(shipTypes) as unknown as number[];
        keys.forEach((key) => {
            if (!game.requiredShips[key] || shipTypes[key] > game.requiredShips[key]) {
                ships.forEach(ship => {
                    if (ship.length == key) {
                        wrongPlacement.push(...ship)
                    }
                })
            }
        })

        const newWrongPlacement = Array.from({length: 10}, () => Array(10).fill(false))
        wrongPlacement.forEach(pos => {
            newWrongPlacement[pos.x][pos.y] = true
        })
        setWrongPlacement(newWrongPlacement)
        setShipCounts(shipTypes)
    }

    useEffect(() => {
        checkBoard()
    }, [board])

    function getBoardShips(): Ship[] {
        const ships = [] as Ship[]
        const checked = [] as Position[]

        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                if (checked.some(pos => pos.x === i && pos.y === j)) continue
                if (board[i][j].ship) {
                    const ship = [] as Ship
                    checkNeighbors(ship, i, j)
                    ships.push(ship)
                }
            }
        }

        return ships;

        function checkNeighbors(ship: Ship, x: number, y: number) {
            if (checked.some(pos => pos.x === x && pos.y === y)) return
            checked.push({x, y})

            ship.push({x: x, y})

            const neighbors = getCellNeighborsPresence(x, y, board)
            if (neighbors.top) {
                checkNeighbors(ship, x - 1, y)
            }

            if (neighbors.right) {
                checkNeighbors(ship, x, y + 1)
            }

            if (neighbors.bottom) {
                checkNeighbors(ship, x + 1, y)
            }

            if (neighbors.left) {
                checkNeighbors(ship, x, y - 1)
            }
        }
    }

    return (
        <div className={gameStyle.gameContainer}>
            <h1>Sea Battle Game</h1>
            <div className={gameStyle.box}>
                <MyBoard wrongPlacement={wrongPlacement}/>
                <div className={gameStyle.centerBox}>
                    <GameInfo game={game} shipCounts={shipCounts} wrongPlacement={wrongPlacement}/>
                    <Chat/>
                </div>
                <OpponentBoard/>
            </div>
        </div>
    )
}

function OpponentBoard() {
    const game = useSelector((state: State) => state.game)
    const board = game.shots!
    const socket = useSocket()

    function onClick(x: number, y: number) {
        if (game.status !== "playing") return
        if (!game.yourTurn) return

        const cell = board[x][y]
        if (cell.hit) return

        socket.emit("send_shot", x, y)
    }

    return (
        <div className={gameStyle.board}>
            <h2>
                Your shots
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
                        <Cell key={j} cell={cell} x={i} y={j} click={() => onClick(i, j)} board={board}/>
                    ))}
                </div>
            ))}
        </div>
    )
}

function MyBoard({wrongPlacement}: { wrongPlacement: boolean[][] }) {
    const game = useSelector((state: State) => state.game)
    const board = game.board!
    const dispatch = useDispatch()
    const socket = useSocket()
    const username = useSelector((state: State) => state.user.username)
    const playerData = game.owner.username === username ? game.owner : game.player

    const onClick = (x: number, y: number) => {
        if (game.status !== 'preparing') return;
        if (playerData?.ready) return;

        dispatch(gameActions.placeShip({x, y}))
        const currentCell = board[x][y]
        const change = {x, y, ship: !currentCell.ship, hit: currentCell.hit} as ChangedCell

        sendPlacedShip(change)
    }

    function sendPlacedShip(changedCell: ChangedCell) {
        socket.emit("place_ships", changedCell)
    }

    return (
        <div className={gameStyle.board}>
            <h2>
                Your board
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
                        <Cell key={j} cell={cell} x={i} y={j} click={() => onClick(i, j)}
                              placedWrong={wrongPlacement[i][j]}
                              board={board}/>
                    ))}
                </div>
            ))}
        </div>
    )
}

function Cell({cell, click, x, y, placedWrong, board}: {
    board: BoardType,
    cell: BoardCell,
    click?: () => void,
    x: number,
    y: number,
    placedWrong?: boolean
}) {
    const neighbors = getCellNeighborsPresence(x, y, board)

    return (
        <div className={gameStyle.cell} onClick={click ? click : undefined}>
            {cell.ship &&
                <div className={`${gameStyle.ship} ${placedWrong && gameStyle.wrongPlaced}`}>
                    <div className={`${gameStyle.shipPart} ${neighbors.top && gameStyle.top}`}/>
                    <div className={`${gameStyle.shipPart} ${neighbors.right && gameStyle.right}`}/>
                    <div className={`${gameStyle.shipPart} ${neighbors.bottom && gameStyle.bottom}`}/>
                    <div className={`${gameStyle.shipPart} ${neighbors.left && gameStyle.left}`}/>
                    <div className={`${gameStyle.shipPart} ${gameStyle.center}`}/>
                </div>}
            {cell.hit && <div className={gameStyle.hit}/>}
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

function GameInfo({game, shipCounts, wrongPlacement}: {
    game: GameState,
    shipCounts: { [_: number]: number },
    wrongPlacement: boolean[][]
}) {
    const socket = useSocket()
    const username = useSelector((state: State) => state.user.username)
    const playerData = useSelector((state: State) => state.game.owner.username === username ? state.game.owner : state.game.player)
    const dispatch = useDispatch()

    function translateStatus(status: GameStatus) {
        switch (status) {
            case "lobby":
                return "In lobby"
            case "playing":
                return game.yourTurn ? "Your turn" : "Opponent's turn"
            case "finished":
                return "Game finished"
            case "preparing":
                return "Placing ships"
            default:
                return "Unknown status"
        }
    }

    function startShooting() {
        if (!game.player?.ready || !game.owner.ready) return

        socket.emit("start_shooting")
    }

    function ready() {
        let anyWrong = false
        for (const row of wrongPlacement) {
            if (row.some(cell => cell)) {
                anyWrong = true
                break
            }
        }

        if (anyWrong) {
            dispatch(notificationActions.addNotification({message: "Your ships are placed incorrectly", type: "error"}))
            return
        }

        socket.emit("toggle_ready")
    }

    return (
        <div className={gameStyle.info}>
            <div className={gameStyle.infoBox}>
                <h2>
                    Game Info
                </h2>
                <div className={gameStyle.gameId}>
                    Game ID: {game.id}
                </div>
            </div>
            <div className={gameStyle.infoBox}>
                <h2>Participants</h2>
                <div className={gameStyle.membersBox}>
                    <div className={gameStyle.member}>
                        {game.status == "preparing" && game.owner.ready && "(Ready) "}
                        {!game.owner.online && <div className={gameStyle.offlineIndicator}></div>}
                        {game.owner.username}
                    </div>
                    <div className={gameStyle.membersDivider}>
                        vs
                    </div>
                    <div className={gameStyle.member}>
                        {game.player?.username}
                        {!game.player?.online && <div className={gameStyle.offlineIndicator}></div>}
                        {game.status == "preparing" && game.player?.ready && " (Ready)"}
                    </div>
                </div>
            </div>
            <div className={gameStyle.infoBox}>
                <h2>
                    Game stage
                </h2>
                <div className={gameStyle.status}>
                    {translateStatus(game.status)}
                </div>
            </div>
            {game.status === "preparing" && <div className={gameStyle.infoBox}>
                <h2>Required ships</h2>
                {(Object.keys(game.requiredShips) as unknown as number[]).map((key) => {
                    const needShips = game.requiredShips[key] - (shipCounts[key] || 0)

                    return (
                        <div key={key}
                             className={`${gameStyle.shipCountBox} ${needShips < 0 ? gameStyle.invalid : ""} ${needShips == 0 ? gameStyle.correct : ""}`}>
                            <div className={gameStyle.count}>
                                {shipCounts[key] ?? 0} / {game.requiredShips[key]}
                            </div>
                            <div className={gameStyle.preview}>
                                {Array.from({length: key}, (_, index) => (
                                    <div className={`${gameStyle.part}`} key={"part-" + key + "-" + index}></div>
                                ))}
                            </div>
                        </div>
                    )
                })}

                {username === game.owner.username &&
                    <button className={`${gameStyle.startGameButton} ${gameStyle.button}`} onClick={startShooting}
                            disabled={!game.player?.ready || !game.owner.ready}>
                        Start game
                    </button>}

                {<button className={gameStyle.button}
                         onClick={ready}>{playerData?.ready ? "Not ready" : "Ready"}</button>}
            </div>}
        </div>
    )
}

function getCellNeighborsPresence(x: number, y: number, board: BoardCell[][]) {
    return {
        top: x > 0 && board[x - 1][y].ship,
        right: y < 9 && board[x][y + 1].ship,
        bottom: x < 9 && board[x + 1][y].ship,
        left: y > 0 && board[x][y - 1].ship
    }
}