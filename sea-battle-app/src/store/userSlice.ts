import { createSlice} from "@reduxjs/toolkit";

export interface UserState {
    username: string | null;
}

const userSlice = createSlice({
    name: 'user',
    initialState: {
        username: localStorage.getItem('username'),
    } as UserState,
    reducers: {
        setUsername(state, action) {
            state.username = action.payload;
            localStorage.setItem('username', action.payload);
        }
    }
});

export const actions = userSlice.actions;

export default userSlice;