import {ChangedCell, GamePacket} from "./gameTypes";

export interface ServerToClientEvents {
    game_updated: (game: GamePacket) => void
    game_set: (game: GamePacket | null) => void
    error: (message: string) => void
    info: (message: string) => void
    chat: (username: string, message: string) => void
}

export type ServerToClientEventsKeys = keyof ServerToClientEvents

export type ServerToClientEventsValues = Parameters<ServerToClientEvents[keyof ServerToClientEvents]>

export interface ClientToServerEvents {
    create_game: () => void
    join_game: (id: string, errorCallback: (message: string) => void) => void
    kick: () => void
    leave_game: () => void
    set_username: (username: string | null, callback: (error: boolean, message?: string) => void) => void
    delete_game: () => void
    start_game: () => void
    set_settings: (settings: SettingsType) => void
    place_ships: (ship: ChangedCell) => void
    toggle_ready: () => void
}

export interface SettingsType {
    shipWrappingAllowed?: boolean,
    cornerCollisionsAllowed?: boolean
}

export type ClientToServerEventsKeys = keyof ClientToServerEvents

export type ClientToServerEventsValues = Parameters<ClientToServerEvents[keyof ClientToServerEvents]>