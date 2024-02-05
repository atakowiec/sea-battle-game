export interface BoardCell {
    ship: boolean;
    hit: boolean;
}

export type Board = BoardCell[][]

export type GameStatus = 'lobby' | 'preparing' | 'playing' | 'finished';

/**
 * GamePacket is the type of the object that is sent to the client
 * It contains all the information about the game that the client needs
 */
export interface GamePacket {
    id?: string;
    owner?: string;
    player?: string | null;
    status?: GameStatus;
    winner?: string | null;
    ownerTurn?: boolean;
    board?: Board;
    shots?: Board;
}