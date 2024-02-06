import {createSlice} from "@reduxjs/toolkit";
import {BoardType, GamePacket, GameStatus} from "@shared/gameTypes.ts";
import useSocket from "../socket/useSocket.ts";

export interface GameState {
    id: string;
    status: GameStatus
    owner: string;
    player: string | null;
    board: BoardType | null;
    shots: BoardType | null;
    yourTurn: boolean;
    winner: string | null;
    playerOnline?: boolean;
    ownerOnline?: boolean;
    shipWrappingAllowed?: boolean,
    cornerCollisionsAllowed?: boolean
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
                owner: payload.owner,
                player: payload.player ?? null,
                status: payload.status,
                board: payload.board ?? null,
                shots: payload.shots ?? null,
                yourTurn: payload.yourTurn,
                winner: payload.winner ?? null,
                playerOnline: payload.playerOnline ?? false,
                ownerOnline: payload.ownerOnline ?? false,
                shipWrappingAllowed: payload?.shipWrappingAllowed ?? false,
                cornerCollisionsAllowed: payload?.cornerCollisionsAllowed ?? false
            } as GameState;
        },
        updateGameData(state, action) {
            const payload: GamePacket = action.payload;

            if (state === null) {
                return state;
            }

            console.log("Updating game data", payload)

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
        shoot(state, action) {
            if (state === null || state.shots === null) {
                return state;
            }

            if (state.status !== 'playing' || !state.yourTurn) return state;

            const x = action.payload.x;
            const y = action.payload.y;

            if (state.shots[x][y].hit) return state;

            state.shots[x][y].hit = true;
        }
    }
});

export default gameSlice;

export const gameActions = gameSlice.actions;