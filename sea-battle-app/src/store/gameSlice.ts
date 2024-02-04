import {createSlice} from "@reduxjs/toolkit";
import {Board, GameStatus} from "@shared/gameTypes.ts";
import {emptyBoard} from "../util/gameUtil.ts";

export interface GameState {
    id: string;
    status: GameStatus
    over: boolean;
    user: string;
    opponent: string;
    board: Board;
    opponentBoard: Board;
    turn: boolean;
    winner: string | null;
}

const gameSlice = createSlice({
    name: 'game',
    initialState: null as GameState | null,
    reducers: {
        setGameData(_, action) {
            return {
                status: "lobby",
                over: false,
                opponent: null,
                winner: null,
                board: emptyBoard(),
                opponentBoard: emptyBoard(),
                turn: false,
                ...action.payload
            };
        }
    }
});

export default gameSlice;

export const gameActions = gameSlice.actions;