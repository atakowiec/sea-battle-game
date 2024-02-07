import {Game} from "./Game.ts";
import {SocketType} from "./types.ts";

export default class OpenGamesHandler {
    static instance: OpenGamesHandler = new OpenGamesHandler();
    private games: Game[] = [];

    public onCreate(game: Game): void {
        if (!game.isOpen) return;
        this.games.push(game);
        this.broadcastOpenGame(game);
    }

    public onRemove(game: Game): void {
        this.games = this.games.filter(g => g !== game);
        this.broadcastRemoveOpenGame(game);
    }

    public onPlayerJoin(game: Game): void {
        if (!game.player) return
        this.games = this.games.filter(g => g !== game);
        this.broadcastRemoveOpenGame(game);
    }

    public onPlayerLeave(game: Game): void {
        if (game.player || !game.isOpen || game.status != "lobby") return
        this.games.push(game);
        this.broadcastOpenGame(game);
    }

    public onGameStart(game: Game): void {
        this.games = this.games.filter(g => g !== game);
        this.broadcastRemoveOpenGame(game);
    }

    public onGameOpenStatusChange(game: Game): void {
        if (game.player || game.status != "lobby") return

        if (game.isOpen) {
            this.games.push(game);
            this.broadcastOpenGame(game);
        } else {
            this.games = this.games.filter(g => g !== game);
            this.broadcastRemoveOpenGame(game);
        }
    }

    public broadcastOpenGame(game: Game): void {
        Game.io.to("open_games_broadcast").emit("add_open_game", game.getOpenGame())
    }

    public broadcastRemoveOpenGame(game: Game): void {
        Game.io.to("open_games_broadcast").emit("remove_open_game", game.id)
    }

    public sendOpenGames(socket: SocketType): void {
        socket.emit("set_open_games", this.games.map(game => game.getOpenGame()))
    }
}