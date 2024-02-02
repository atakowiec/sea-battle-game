import { createSlice} from "@reduxjs/toolkit";

export interface UserState {
    nickname: string | null;
}

const userSlice = createSlice({
    name: 'user',
    initialState: {
        nickname: localStorage.getItem('nickname'),
    } as UserState,
    reducers: {
        setNickname(state, action) {
            state.nickname = action.payload;
        }
    }
});

export const actions = userSlice.actions;

export default userSlice;