import {createSlice} from "@reduxjs/toolkit";
import {Board} from "@shared/gameTypes.ts";

export interface GameState {
    isStarted: boolean;
    isOver: boolean;
    user: string;
    opponent: string;
    board: Board;
    opponentBoard: Board;
}

const gameSlice = createSlice({
    name: 'game',
    initialState: null as GameState | null,
    reducers: {}
});

export default gameSlice;

export const actions = gameSlice.actions;