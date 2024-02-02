import {configureStore} from "@reduxjs/toolkit";
import userSlice from "./userSlice";
import gameSlice from "./gameSlice";

export const store = configureStore({
    reducer: {
        user: userSlice.reducer,
        game: gameSlice.reducer
    }
});