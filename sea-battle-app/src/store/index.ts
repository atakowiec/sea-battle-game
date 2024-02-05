import {configureStore} from "@reduxjs/toolkit";
import userSlice, {UserState} from "./userSlice";
import gameSlice, {GameState} from "./gameSlice";
import chatSlice, {ChatState} from "./chatSlice.ts";
import notificationSlice, {Notification} from "./notificationSlice.ts";

export interface State {
    user: UserState
    game: GameState
    chat: ChatState
    notifications: Notification[]
}

export const store = configureStore({
    reducer: {
        user: userSlice.reducer,
        game: gameSlice.reducer,
        chat: chatSlice.reducer,
        notifications: notificationSlice.reducer
    }
});