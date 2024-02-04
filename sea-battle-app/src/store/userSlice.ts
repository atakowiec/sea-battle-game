import { createSlice} from "@reduxjs/toolkit";

export interface UserState {
    username: string | null;
    usernameChecked: boolean;
}

const userSlice = createSlice({
    name: 'user',
    initialState: {
        username: null,
        usernameChecked: localStorage.getItem('username') === null
    } as UserState,
    reducers: {
        setUsername(state, action) {
            state.username = action.payload;
            state.usernameChecked = true;
            localStorage.setItem('username', action.payload);
        }
    }
});

export const actions = userSlice.actions;

export default userSlice;