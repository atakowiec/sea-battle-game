export interface BoardCell {
    ship: boolean;
    hit: boolean;
}

export type Board = BoardCell[][]