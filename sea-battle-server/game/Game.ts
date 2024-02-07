import {BoardType, ChangedCell, GamePacket, GameStatus} from "@shared/gameTypes.ts";
import {SocketServerType, SocketType} from "./types.ts";
import {ServerToClientEventsKeys, ServerToClientEventsValues, SettingsType} from "@shared/socketTypes.ts";
import {emptyBoard} from "../util/gameUtil.ts";

export interface GameMember {
    username: string;
    socket: SocketType
    ready?: boolean;
    board?: BoardType;
    shots?: BoardType;
}

export class Game {
    static initializedGames = [] as Game[]
    static io: SocketServerType;

    ownerTimeout: NodeJS.Timeout | null = null;
    playerTimeout: NodeJS.Timeout | null = null;

    id: string;
    owner: GameMember;
    player: GameMember | null;
    status: GameStatus;
    ownerTurn: boolean;
    winner: string | null;
    cornerCollisionsAllowed: boolean;
    shipWrappingAllowed: boolean;

    requiredShips: { [key: number]: number } = {
        4: 1,
        3: 2,
        2: 3,
        1: 4
    }

    constructor(id: string, owner: SocketType) {
        this.id = id;
        this.owner = {
            username: owner.data.username!,
            socket: owner,
        };
        this.player = null;
        this.status = "lobby";
        this.ownerTurn = Math.random() > 0.5;
        this.winner = null;
        this.cornerCollisionsAllowed = false;
        this.shipWrappingAllowed = false;
    }

    static createGame(owner: SocketType) {
        let id: string
        do {
            id = Math.random().toString(36).substring(7)
        } while (Game.initializedGames.find(game => game.id === id))

        const game = new Game(id, owner);
        owner.data.game = game;

        Game.initializedGames.push(game);

        owner.join(id);
        game.emitOwner("game_set", game.getPacket(game.owner));
    }

    static checkUsername(socket: SocketType) {
        if (!socket.data.username) {
            socket.emit("error", "You need to set your username first");
            return false;
        }
        return true
    }

    setSettings(socket: SocketType, settings: SettingsType) {
        if (!Game.checkUsername(socket)) return;
        if (!this.checkAdmin(socket)) return;

        if (settings.shipWrappingAllowed !== undefined) {
            this.shipWrappingAllowed = settings.shipWrappingAllowed;
        }

        if (settings.cornerCollisionsAllowed !== undefined) {
            this.cornerCollisionsAllowed = settings.cornerCollisionsAllowed;
        }

        this.emitPlayer("game_updated", {
            shipWrappingAllowed: this.shipWrappingAllowed,
            cornerCollisionsAllowed: this.cornerCollisionsAllowed
        })
    }

    placeShips(socket: SocketType, ship: ChangedCell) {
        if (!ship)
            return;

        let board: BoardType | undefined = undefined;
        let member: GameMember | undefined = undefined;
        if (socket === this.owner.socket) {
            board = this.owner.board;
            member = this.owner;
        }
        else if (socket === this.player?.socket) {
            board = this.player.board;
            member = this.player;
        }
        if (!board || !member)
            return;

        const emitBoard = () => {
            if (board)
                socket.emit("game_updated", {board: board})
        }

        if (!Game.checkUsername(socket)) {
            emitBoard();
            return;
        }

        if(member.ready) {
            socket.emit("error", "You can't place ships when you are ready");
            return emitBoard();
        }

        if (this.status !== "preparing") {
            socket.emit("error", "The game has already started");
            emitBoard();
            return;
        }

        board![ship.x][ship.y].ship = ship.ship;

        // do not send it back, client already has it because he sent it lol
    }

    remove() {
        this.emitPlayer("game_set", null);
        this.emitOwner("game_set", null);

        if (this.player) {
            this.player.socket.leave(this.id);
            this.player.socket.data.game = null;
        }

        this.owner.socket.leave(this.id);
        this.owner.socket.data.game = null;

        Game.initializedGames = Game.initializedGames.filter(game => game.id !== this.id)
    }

    checkPlayerKick() {
        if (this.player?.socket.disconnected) {
            this.player = null;
            this.emitGameChange({
                player: null
            });
            this.emitOwner("info", "The player has been kicked from the game for being disconnected")
        }
    }

    checkOwnerKick() {
        if (this.owner.socket.disconnected) {
            this.remove()
        }
    }

    isAdmin(socket: SocketType) {
        return socket === this.owner.socket;
    }

    isPlayer(socket: SocketType) {
        return this.player && socket === this.player.socket;
    }

    checkAdmin(socket: SocketType) {
        if (!this.isAdmin(socket)) {
            socket.emit("error", "You are not the admin of this game");
            return false;
        }
        return true
    }

    startGame(socket: SocketType) {
        if (!Game.checkUsername(socket)) return;
        if (!this.checkAdmin(socket)) return;
        if (!this.player) {
            socket.emit("error", "The game is not full yet");
            return;
        }

        this.status = "preparing";
        this.player.board = emptyBoard()
        this.owner.board = emptyBoard()
        this.player.shots = emptyBoard()
        this.owner.shots = emptyBoard()

        this.emitGameChange();
    }

    deleteGame(socket: SocketType) {
        if (!Game.checkUsername(socket)) return;
        if (!this.checkAdmin(socket)) return;

        this.emit("info", "The game has been deleted")
        this.remove();
    }

    getPacket(member: GameMember): GamePacket {
        return {
            id: this.id,
            owner: {
                username: this.owner.username,
                ready: this.owner.ready,
                online: !this.owner.socket.disconnected
            },
            player: !this.player ? null : {
                username: this.player.username,
                ready: this.player.ready,
                online: !this.player.socket.disconnected
            },
            status: this.status,
            winner: this.winner,
            yourTurn: member === this.player ? this.ownerTurn : !this.ownerTurn,
            board: member.board,
            shots: member.shots,
            shipWrappingAllowed: this.shipWrappingAllowed,
            cornerCollisionsAllowed: this.cornerCollisionsAllowed,
            requiredShips: this.requiredShips
        }
    }

    /**
     * Kick a player from the game
     * @param socket The socket that wants to kick the player
     */
    kick(socket: SocketType) {
        if (!Game.checkUsername(socket)) return;
        if (!this.checkAdmin(socket)) return;
        if (!this.player) return;

        this.emitOwner("info", "The player has been kicked from the game")
        this.emitPlayer("info", "You have been kicked from the game")

        this.emitPlayer("game_set", null);
        this.player.socket.leave(this.id);
        this.player.socket.data.game = null;
        this.player = null;
        this.emitGameChange({
            player: null
        });
    }

    join(socket: SocketType, errorCallback: (message: string) => void) {
        if (this.status !== "lobby") {
            errorCallback("This game has already started")
            return
        }

        if (socket.data.game) {
            errorCallback("You are already in a game")
            return
        }

        if (this.owner.username === socket.data.username) {
            errorCallback("You can't join your own game")
            return
        }

        if (this.player) {
            // same as above
            errorCallback("This game is already full")
            return
        }

        this.player = {
            username: socket.data.username!,
            socket
        }

        socket.join(this.id)
        socket.data.game = this
        this.emitOwner("game_updated", {
            player: {
                username: this.player.username,
                online: true,
                ready: false
            }
        })
        this.emitPlayer("game_set", this.getPacket(this.player))
    }

    /**
     * Leave the game
     * NOTE: It does not allow the owner to leave the game
     *
     * @param socket The socket that wants to leave the game
     */
    leave(socket: SocketType) {
        if (!Game.checkUsername(socket)) return;
        if (!this.isPlayer(socket)) {
            socket.emit("error", "Only the player can leave the game");
            return;
        }

        // emit changes to players
        this.emitPlayer("game_set", null);
        this.emitGameChange({
            player: null
        });

        // remove the player from the game
        this.player = null;
        socket.leave(this.id);
        socket.data.game = null;

        this.owner.socket.emit("info", `${socket.data.username} has left the game`)
    }

    /**
     * Reconnect a socket to the game based on the username
     * @param socket
     */
    reconnect(socket: SocketType) {
        if (this.owner.username === socket.data.username) {
            this.owner.socket = socket;
            this.emitOwner("game_set", this.getPacket(this.owner));
            this.emitPlayer("game_updated", {
                owner: {
                    online: true
                }
            })

            if (this.ownerTimeout)
                clearTimeout(this.ownerTimeout)
        } else if (this.player?.username === socket.data.username) {
            this.player.socket = socket;
            this.emitPlayer("game_set", this.getPacket(this.player));
            this.emitOwner("game_updated", {
                player: {
                    online: true
                }
            })

            if (this.playerTimeout)
                clearTimeout(this.playerTimeout)
        }

        socket.join(this.id);
        socket.data.game = this;
        socket.emit("info", "You have reconnected to the game")
        socket.broadcast.to(this.id).emit("info", `${socket.data.username} has reconnected`)
    }

    toggleReady(socket: SocketType) {
        if (this.owner.socket === socket) {
            this.owner.ready = !this.owner.ready;
            this.emitGameChange({
                owner: {
                    ready: this.owner.ready
                }
            })
        } else if (this.player?.socket === socket) {
            this.player.ready = !this.player.ready;
            this.emitGameChange({
                player: {
                    ready: this.player.ready
                }
            })
        } else {
            socket.emit("game_set", null)
            socket.emit("error", "You are not in this game");
            return;
        }
    }

    onDisconnect(socket: SocketType) {
        if (socket === this.owner.socket) {
            this.onOwnerDisconnect();
        } else if (this.player && socket === this.player.socket) {
            this.onPlayerDisconnect();
        }
    }

    /**
     * Run when the owner disconnects
     */
    onOwnerDisconnect() {
        if (!this.player || this.player.socket.disconnected) return this.remove();
        this.emitPlayer("info", `${this.owner.username} has disconnected, waiting for reconnection`)
        this.emitPlayer("game_updated", {
            owner: {
                online: false
            }
        })

        if (this.ownerTimeout)
            clearTimeout(this.ownerTimeout);

        this.ownerTimeout = setTimeout(() => this.checkOwnerKick(), 60000);
    }

    /**
     * Run when the player disconnects
     */
    onPlayerDisconnect() {
        this.emitOwner("info", `${this.player?.username} has disconnected, waiting for reconnection`)
        this.emitOwner("game_updated", {
            player: {
                online: false
            }
        })

        if (this.playerTimeout)
            clearTimeout(this.playerTimeout);

        this.playerTimeout = setTimeout(() => this.checkPlayerKick(), 60000);
    }

    emitOwner(event: ServerToClientEventsKeys, ...args: ServerToClientEventsValues) {
        if (this.owner) {
            this.owner.socket.emit(event, ...args);
        }
    }

    emitPlayer(event: ServerToClientEventsKeys, ...args: ServerToClientEventsValues) {
        if (this.player) {
            this.player.socket.emit(event, ...args);
        }
    }

    emit(event: ServerToClientEventsKeys, ...args: ServerToClientEventsValues) {
        this.emitOwner(event, ...args);
        this.emitPlayer(event, ...args);
    }


    emitGameChange(packet?: GamePacket) {
        if (!packet) {
            this.emitPlayer("game_set", this.getPacket(this.player!))
            this.emitOwner("game_set", this.getPacket(this.owner))
        } else {
            this.emit("game_updated", packet);
        }
    }
}