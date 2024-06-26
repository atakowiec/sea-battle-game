import {createSlice} from "@reduxjs/toolkit";
import {BoardType, ChangedCell, GameMemberData, GamePacket, GameStatus} from "@shared/gameTypes.ts";

export interface GameState {
    id: string;
    status: GameStatus
    owner: GameMemberData;
    player: GameMemberData | null;
    board: BoardType | null;
    shots: BoardType | null;
    yourTurn: boolean;
    winner: string | null;
    shipWrappingAllowed?: boolean,
    cornerCollisionsAllowed?: boolean
    isOpen?: boolean;
    requiredShips: { [key: number]: number };
}

const gameSlice = createSlice({
    name: 'game',
    initialState: null as GameState | null,
    reducers: {
        setGameData(_, action) {
            if (action.payload === null) {
                return null;
            }

            const payload: GamePacket = action.payload;

            return {
                id: payload.id,
                player: payload.player ?? null,
                owner: payload.owner,
                status: payload.status,
                board: payload.board ?? null,
                shots: payload.shots ?? null,
                yourTurn: payload.yourTurn,
                winner: payload.winner ?? null,
                shipWrappingAllowed: payload?.shipWrappingAllowed ?? false,
                cornerCollisionsAllowed: payload?.cornerCollisionsAllowed ?? false,
                requiredShips: payload.requiredShips,
                isOpen: payload.isOpen
            } as GameState;
        },
        updateGameData(state, action) {
            const payload: GamePacket = action.payload;

            if (state === null) {
                return state;
            }

            console.log("Updating game data", payload)

            if (payload.player) {
                payload.player = {
                    ...state.player,
                    ...payload.player
                }
            }

            if (payload.owner) {
                payload.owner = {
                    ...state.owner,
                    ...payload.owner
                }
            }

            return {
                ...state,
                ...payload
            } as GameState;
        },
        changeSetting(state, action) {
            if (state === null) {
                return state;
            }

            state.cornerCollisionsAllowed = action.payload.cornerCollisionsAllowed ?? state.cornerCollisionsAllowed;
            state.shipWrappingAllowed = action.payload.shipWrappingAllowed ?? state.shipWrappingAllowed;
            state.isOpen = action.payload.isOpen ?? state.isOpen;
        },
        placeShip(state, action) {
            if (state === null || state.board === null) {
                return state;
            }

            if (state.status !== 'preparing') return state;

            const x = action.payload.x;
            const y = action.payload.y;

            state.board[x][y].ship = !state.board[x][y].ship;
        },
        changeCells(state, action) {
            if (state === null || state.shots === null) {
                return state;
            }

            const changedCells: ChangedCell[] = action.payload.changedCell;
            const boardToChange = action.payload.yourBoard ? state.board! : state.shots;

            for(const cell of boardToChange.flat())
                delete cell.new;

            for (const cell of changedCells) {
                if (cell.hit != undefined) {
                    boardToChange[cell.x][cell.y].hit = cell.hit;
                }

                if (cell.ship != undefined) {
                    boardToChange[cell.x][cell.y].ship = cell.ship;
                }

                boardToChange[cell.x][cell.y].new = true;
            }
        }
    }
});

export default gameSlice;

export const gameActions = gameSlice.actions;