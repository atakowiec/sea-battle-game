export interface BoardCell {
    ship: boolean;
    hit: boolean;
}

export type Board = BoardCell[][]

export type GameStatus = 'lobby' | 'preparing' | 'playing' | 'finished';

export interface Game {
    owner: {
        username: string;
        board: Board;
        shots: Board;
    }
    player: {
        username: string;
        board: Board;
        shots: Board;
    }
    turn: string;
    winner?: string;
}

export interface Room {
    id: string;
    owner: string;
    player: string | null;
    status: GameStatus;
    game: Game | null;
}