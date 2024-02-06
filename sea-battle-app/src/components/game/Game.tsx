import {State} from "../../store";
import {useDispatch, useSelector} from "react-redux";
import gameStyle from "../../style/game.module.scss"
import {BoardCell} from "@shared/gameTypes.ts";
import {gameActions, GameState} from "../../store/gameSlice.ts";
import {useEffect, useState} from "react";

interface Position {
    x: number
    y: number
}

type Ship = Position[]

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
    const [wrongPlacement, setWrongPlacement] =
        useState(Array.from({length: 10}, () => Array(10).fill(false)) as boolean[][])

    const onClick = (x: number, y: number) => {
        if (yourBoard) {
            dispatch(gameActions.placeShip({x, y}))
        } else {
            dispatch(gameActions.shoot({x, y}))
        }
    }

    useEffect(() => {
        checkBoard()
    }, [board])

    function checkBoard() {
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

        const newWrongPlacement = Array.from({length: 10}, () => Array(10).fill(false))
        wrongPlacement.forEach(pos => {
            newWrongPlacement[pos.x][pos.y] = true
        })

        setWrongPlacement(newWrongPlacement)

        // Count ships of each type
        const shipTypes : { [key: number]: number } = {}
        ships.forEach(ship => {
            if (wrongShips.includes(ship)) return

            const length = ship.length
            if (!shipTypes[length]) {
                shipTypes[length] = 1
            } else {
                shipTypes[length]++
            }
        })

        function checkNeighbors(ship: Ship, x: number, y: number) {
            if (checked.some(pos => pos.x === x && pos.y === y)) return
            checked.push({x, y})

            ship.push({x: x, y})

            const neighbors = getCellNeighbors(x, y, board)
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
                        <Cell key={j} cell={cell} x={i} y={j} click={() => onClick(i, j)}
                              placedWrong={wrongPlacement[i][j]}/>
                    ))}
                </div>
            ))}
        </div>
    )
}

function Cell({cell, click, x, y, placedWrong}: {
    cell: BoardCell,
    click: () => void,
    x: number,
    y: number,
    placedWrong: boolean
}) {
    const game = useSelector((state: State) => state.game)
    const board = game.board!
    const neighbors = getCellNeighbors(x, y, board)

    return (
        <div className={gameStyle.cell} onClick={click}>
            {cell.hit && <div className={gameStyle.hit}/>}
            {cell.ship &&
                <div className={`${gameStyle.ship} ${placedWrong && gameStyle.wrongPlaced}`}>
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

function getCellNeighbors(x: number, y: number, board: BoardCell[][]) {
    return {
        top: x > 0 && board[x - 1][y].ship,
        right: y < 9 && board[x][y + 1].ship,
        bottom: x < 9 && board[x + 1][y].ship,
        left: y > 0 && board[x][y - 1].ship
    }
}