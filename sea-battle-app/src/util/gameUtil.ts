export interface BoardCell {
    ship: boolean;
    hit: boolean;
}

function emptyCell(): BoardCell {
    return {ship: false, hit: false};
}

export function emptyBoard() {
    const board: BoardCell[][] = [];
    for (let i = 0; i < 10; i++) {
        const row: BoardCell[] = [];
        for (let j = 0; j < 10; j++) {
            row.push(emptyCell());
        }
        board.push(row);
    }
    return board;
}