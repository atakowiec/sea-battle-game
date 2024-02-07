export interface BoardCell {
    ship: boolean;
    hit: boolean;
}

export type BoardType = BoardCell[][]

export type GameStatus = 'lobby' | 'preparing' | 'playing' | 'finished';

/**
 * GamePacket is the type of the object that is sent to the client
 * It contains all the information about the game that the client needs
 */
export interface GamePacket {
    id?: string;
    owner?: GameMemberData
    player?: GameMemberData | null;
    status?: GameStatus;
    winner?: string | null;
    yourTurn?: boolean;
    board?: BoardType;
    shots?: BoardType;
    shipWrappingAllowed?: boolean;
    cornerCollisionsAllowed?: boolean;
    isOpen?: boolean;
    requiredShips?: { [key: number]: number };
}

export interface GameMemberData {
    username?: string;
    online?: boolean;
    ready?: boolean;
}

export interface ChangedCell {
    x: number;
    y: number;
    hit: boolean;
    ship: boolean;
}

export interface OpenGame {
    id: string;
    owner: string;
}
