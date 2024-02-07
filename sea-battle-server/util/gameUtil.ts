import {BoardType, BoardCell, Ship, Position, GamePacket} from "@shared/gameTypes.ts";

function emptyCell(): BoardCell {
    return {ship: false, hit: false};
}

export function emptyBoard() {
    const board: BoardType = [];
    for (let i = 0; i < 10; i++) {
        const row: BoardCell[] = [];
        for (let j = 0; j < 10; j++) {
            row.push(emptyCell());
        }
        board.push(row);
    }
    return board;
}

export function getShip(board: BoardType, position: Position) {
    if (!board[position.x][position.y].ship) return null

    const ship = [] as Position[]
    const checked = [] as Position[]

    checkNeighbors(ship, position.x, position.y, board, checked)

    return ship
}

export function getBoardShips(board: BoardType): Ship[] {
    const ships = [] as Ship[]
    const checked = [] as Position[]

    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            if (checked.some(pos => pos.x === i && pos.y === j)) continue
            if (board[i][j].ship) {
                const ship = [] as Ship
                checkNeighbors(ship, i, j, board, checked)
                ships.push(ship)
            }
        }
    }

    return ships;
}

function checkNeighbors(ship: Ship, x: number, y: number, board: BoardType, checked: Position[]) {
    if (checked.some(pos => pos.x === x && pos.y === y)) return
    checked.push({x, y})
    ship.push({x, y, ship: true, hit: board[x][y].hit})

    const neighbors = getCellNeighborsPresence(x, y, board)
    if (neighbors.top) {
        checkNeighbors(ship, x - 1, y, board, checked)
    }

    if (neighbors.right) {
        checkNeighbors(ship, x, y + 1, board, checked)
    }

    if (neighbors.bottom) {
        checkNeighbors(ship, x + 1, y, board, checked)
    }

    if (neighbors.left) {
        checkNeighbors(ship, x, y - 1, board, checked)
    }
}

export function getBoardInfo(board: BoardType, game: GamePacket) {
    const ships = getBoardShips(board)
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
    if (!game.requiredShips)
        throw new Error("GamePacket requiredShips is undefined")

    // Check if there are too many ships of a certain type or there are too long ships
    const keys = Object.keys(shipTypes) as unknown as number[];
    keys.forEach((key) => {
        if (!game.requiredShips![key] || shipTypes[key] > game.requiredShips![key]) {
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

    return {
        wrongPlacement,
        shipCounts: shipTypes,
        ships,
        wrongShips,
    }
}

function getCellNeighborsPresence(x: number, y: number, board: BoardCell[][]) {
    return {
        top: x > 0 && board[x - 1][y].ship,
        right: y < 9 && board[x][y + 1].ship,
        bottom: x < 9 && board[x + 1][y].ship,
        left: y > 0 && board[x][y - 1].ship
    }
}

export function getCellNeighborCells(x: number, y: number, board: BoardCell[][], includeDiagonals = false): Position[] {
    const neighbors = [] as Position[]

    const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]]
    if (includeDiagonals) {
        directions.push([-1, -1], [-1, 1], [1, -1], [1, 1])
    }

    for (const [dx, dy] of directions) {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx <= 9 && ny >= 0 && ny <= 9) {
            neighbors.push({x: nx, y: ny, hit: board[nx][ny].hit, ship: board[nx][ny].ship})
        }
    }

    return neighbors
}