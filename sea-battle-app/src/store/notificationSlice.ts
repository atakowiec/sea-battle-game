import {createSlice} from "@reduxjs/toolkit";
import {Notification} from "@shared/chatTypes.ts";

export let id = 0;

const notificationSlice = createSlice({
    name: 'notification',
    initialState: [] as Notification[],
    reducers: {
        addNotification(state, action) {
            state.push({
                id: ++id,
                message: action.payload.message,
                type: action.payload.type,
                title: action.payload.title
            });

            return state;
        },
        removeNotification(state, action) {
            return state.filter(notification => notification.id !== action.payload);
        },
        removeNotificationsOfType(state, action) {
            return state.filter(notification => notification.type !== action.payload);
        }
    }
});

export const notificationActions = notificationSlice.actions;

export default notificationSlice;