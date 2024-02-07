import {createSlice} from "@reduxjs/toolkit";
import {BoardType, GameMemberData, GamePacket, GameStatus} from "@shared/gameTypes.ts";

export interface GameState {
    id: string;
    status: GameStatus
    owner: GameMemberData;
    player: GameMemberData | null;
    board: BoardType | null;
    shots: BoardType | null;
    yourTurn: boolean;
    winner: string | null;
    shipWrappingAllowed?: boolean,
    cornerCollisionsAllowed?: boolean
    isOpen?: boolean;
    requiredShips: { [key: number]: number };
}

const gameSlice = createSlice({
    name: 'game',
    initialState: null as GameState | null,
    reducers: {
        setGameData(_, action) {
            if (action.payload === null) {
                return null;
            }

            const payload: GamePacket = action.payload;

            return {
                id: payload.id,
                player: payload.player ?? null,
                owner: payload.owner,
                status: payload.status,
                board: payload.board ?? null,
                shots: payload.shots ?? null,
                yourTurn: payload.yourTurn,
                winner: payload.winner ?? null,
                shipWrappingAllowed: payload?.shipWrappingAllowed ?? false,
                cornerCollisionsAllowed: payload?.cornerCollisionsAllowed ?? false,
                requiredShips: payload.requiredShips,
                isOpen: payload.isOpen
            } as GameState;
        },
        updateGameData(state, action) {
            const payload: GamePacket = action.payload;

            if (state === null) {
                return state;
            }

            console.log("Updating game data", payload)

            if(payload.player) {
                payload.player = {
                    ...state.player,
                    ...payload.player
                }
            }

            if(payload.owner) {
                payload.owner = {
                    ...state.owner,
                    ...payload.owner
                }
            }

            return {
                ...state,
                ...payload
            } as GameState;
        },
        changeSetting(state, action) {
            if (state === null) {
                return state;
            }

            state.cornerCollisionsAllowed = action.payload.cornerCollisionsAllowed ?? state.cornerCollisionsAllowed;
            state.shipWrappingAllowed = action.payload.shipWrappingAllowed ?? state.shipWrappingAllowed;
            state.isOpen = action.payload.isOpen ?? state.isOpen;
        },
        placeShip(state, action) {
            if (state === null || state.board === null) {
                return state;
            }

            if (state.status !== 'preparing') return state;

            const x = action.payload.x;
            const y = action.payload.y;

            state.board[x][y].ship = !state.board[x][y].ship;
        },
        shoot(state, action) {
            if (state === null || state.shots === null) {
                return state;
            }

            if (state.status !== 'playing' || !state.yourTurn) return state;

            const x = action.payload.x;
            const y = action.payload.y;

            if (state.shots[x][y].hit) return state;

            state.shots[x][y].hit = true;
        }
    }
});

export default gameSlice;

export const gameActions = gameSlice.actions;