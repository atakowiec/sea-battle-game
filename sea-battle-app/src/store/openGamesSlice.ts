import {createSlice} from "@reduxjs/toolkit";
import {OpenGame} from "@shared/gameTypes.ts";

const openGamesSlice = createSlice({
    name: 'openGames',
    initialState: [] as OpenGame[],
    reducers: {
        addOpenGame(state, action) {
            state.push(action.payload);
        },
        removeOpenGame(state, action) {
            return state.filter(game => game.id !== action.payload);
        },
        setOpenGames(_, action) {
            return action.payload;
        }
    },
});

export const openGamesActions = openGamesSlice.actions;

export default openGamesSlice;