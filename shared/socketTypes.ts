import {ChangedCell, GamePacket, OpenGame} from "./gameTypes";

export interface ServerToClientEvents {
    game_updated: (game: GamePacket) => void
    game_set: (game: GamePacket | null) => void
    error: (message: string) => void
    info: (message: string) => void
    chat: (username: string, message: string) => void
    set_open_games: (openGames: OpenGame[]) => void
    add_open_game: (openGame: OpenGame) => void
    remove_open_game: (id: string) => void
    send_cell_change: (cells: ChangedCell[], yourBoard: boolean) => void
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
    start_shooting: () => void
    send_shot: (x: number, y: number) => void
    end_screen_action: (action: string) => void
    surrender: () => void
}

export interface SettingsType {
    shipWrappingAllowed?: boolean,
    cornerCollisionsAllowed?: boolean,
    isOpen?: boolean,
}

export type ClientToServerEventsKeys = keyof ClientToServerEvents

export type ClientToServerEventsValues = Parameters<ClientToServerEvents[keyof ClientToServerEvents]>