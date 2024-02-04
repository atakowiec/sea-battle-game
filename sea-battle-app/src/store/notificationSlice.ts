import {createSlice} from "@reduxjs/toolkit";

let id = 0;

export interface Notification {
    id: number;
    message: string | null;
    type: "error" | "success" | "info";
}

const notificationSlice = createSlice({
    name: 'notification',
    initialState: [] as Notification[],
    reducers: {
        addNotification(state, action) {
            state.push({
                id: id++,
                message: action.payload.message,
                type: action.payload.type
            });

            // todo remove notification after 5 seconds
            return state;
        },
        removeNotification(state, action) {
            return state.filter(notification => notification.id !== action.payload);
        }
    }
});

export const actions = notificationSlice.actions;

export default notificationSlice;