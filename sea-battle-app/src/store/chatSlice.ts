import {createSlice} from "@reduxjs/toolkit";
import {ChatMessage} from "@shared/chatTypes.ts";

export type ChatState = ChatMessage[];

const chatSlice = createSlice({
    name: "chat",
    initialState: [] as ChatMessage[],
    reducers: {
        add: (state, action) => {
            state.push({
                type: action.payload.type,
                sender: action.payload.sender,
                message: action.payload.message
            })
        }
    }
})

export const actions = chatSlice.actions

export default chatSlice;