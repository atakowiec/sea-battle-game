import {createSlice} from "@reduxjs/toolkit";
import {Board, GamePacket, GameStatus} from "@shared/gameTypes.ts";
import {emptyBoard} from "../util/gameUtil.ts";

export interface GameState {
    id: string;
    status: GameStatus
    owner: string;
    player: string | null;
    board: Board | null;
    shots: Board | null;
    ownerTurn: boolean;
    winner: string | null;
    playerOnline?: boolean;
    ownerOnline?: boolean;
}

const gameSlice = createSlice({
    name: 'game',
    initialState: null as GameState | null,
    reducers: {
        setGameData(_, action) {
            if(action.payload === null) {
                return null;
            }

            const payload: GamePacket = action.payload;

            return {
                id: payload.id,
                owner: payload.owner,
                player: payload.player ?? null,
                status: payload.status,
                board: payload.board ?? emptyBoard(),
                shots: payload.shots ?? emptyBoard(),
                ownerTurn: payload.ownerTurn,
                winner: payload.winner ?? null,
                playerOnline: payload.playerOnline ?? false,
                ownerOnline: payload.ownerOnline ?? false,
            } as GameState;
        },
        updateGameData(state, action) {
            const payload: GamePacket = action.payload;

            if (state === null) {
                return state;
            }

            return {
                ...state,
                ...payload
            } as GameState;
        }
    }
});

export default gameSlice;

export const gameActions = gameSlice.actions;