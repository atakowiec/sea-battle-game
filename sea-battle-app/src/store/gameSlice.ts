import {createSlice} from "@reduxjs/toolkit";
import {BoardCell, emptyBoard} from "../util/gameUtil.ts";

export interface GameState {
    isStarted: boolean;
    isOver: boolean;
    user: string;
    opponent: string;
    board: BoardCell[][];
    opponentBoard: BoardCell[][];
}

const gameSlice = createSlice({
    name: 'game',
    initialState: {
        isStarted: false,
        isOver: false,
        user: '',
        opponent: '',
        board: emptyBoard(),
        opponentBoard: emptyBoard()
    } as GameState,
    reducers: {}
});

export default gameSlice;

export const actions = gameSlice.actions;