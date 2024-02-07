import {BoardType, ChangedCell, GamePacket, GameStatus, OpenGame} from "@shared/gameTypes.ts";
import {SocketServerType, SocketType} from "./types.ts";
import {ServerToClientEventsKeys, ServerToClientEventsValues, SettingsType} from "@shared/socketTypes.ts";
import {emptyBoard, getBoardInfo, getCellNeighborCells, getShip} from "../util/gameUtil.ts";
import OpenGamesHandler from "./OpenGamesHandler.ts";

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
    isOpen: boolean;

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
        this.isOpen = true;
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
        owner.leave("open_games_broadcast");
        OpenGamesHandler.instance.onCreate(game);
        game.emitOwner("game_set", game.getPacket(game.owner));
    }

    static checkUsername(socket: SocketType) {
        if (!socket.data.username) {
            socket.emit("error", "You need to set your username first");
            return false;
        }
        return true
    }

    getGameMember(socket: SocketType) {
        if (this.owner.socket === socket) {
            return this.owner;
        } else if (this.player?.socket === socket) {
            return this.player;
        }

        // it should never get here but just in case
        socket.data.game = null;
        socket.emit("game_set", null)
        socket.emit("error", "You are not in this game");
        return null;
    }

    checkShips(player: GameMember): boolean {
        const boardInfo = getBoardInfo(player.board!, this.getPacket(player));

        if (boardInfo.wrongShips.length > 0) {
            player.socket.emit("error", "Some ships are placed incorrectly");
            return false;
        }

        // check if the player has all the required ships
        for (const [length, count] of Object.entries(this.requiredShips)) {
            if (boardInfo.shipCounts[parseInt(length)] !== count) {
                player.socket.emit("error", `You need ${count} ships of length ${length}`);
                return false;
            }
        }

        return true;
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

        if (settings.isOpen !== undefined) {
            this.isOpen = settings.isOpen;
            OpenGamesHandler.instance.onGameOpenStatusChange(this);
        }

        this.emitPlayer("game_updated", {
            shipWrappingAllowed: this.shipWrappingAllowed,
            cornerCollisionsAllowed: this.cornerCollisionsAllowed,
            isOpen: this.isOpen
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
        } else if (socket === this.player?.socket) {
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

        if (member.ready) {
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

    checkWin(member: GameMember) {
        const opponent = member === this.owner ? this.player! : this.owner;

        if (opponent.board!.every(row => row.every(cell => !cell.ship || cell.hit))) {
            this.win(member)
        }
    }

    win(member: GameMember) {
        this.winner = member.username;
        this.status = "finished";
        this.emitGameChange({
            status: this.status,
            winner: this.winner
        });
    }

    endScreenAction(socket: SocketType, action: "play_again" | "go_to_lobby" | "leave") {
        if (!Game.checkUsername(socket)) return;
        if (this.status !== "finished") return;

        if (action === "leave") {
            if (this.isAdmin(socket)) {
                this.emitPlayer("info", "The admin has left the game");
                this.emitOwner("info", "You have left the game");
                this.remove();
            } else {
                this.leave(socket);
            }
            return;
        }

        if (!this.checkAdmin(socket)) return;

        if (action === "play_again") {
            if (!this.player || this.player.socket.disconnected) {
                return;
            }

            this.status = "preparing";
            this.resetGame()
            this.emitPlayer("info", "The admin has started a new game");
            this.emitOwner("info", "New game started");
        }

        if (action === "go_to_lobby") {
            this.emitPlayer("info", "The admin has left to the lobby");
            this.emitOwner("info", "You have left to the lobby");
            this.status = "lobby";
            this.resetGame()
        }
    }

    resetGame() {
        this.winner = null;
        this.owner = {
            username: this.owner.username,
            socket: this.owner.socket,
            ready: false,
            shots: emptyBoard(),
            board: emptyBoard()
        }
        if (this.player) {
            this.player = {
                username: this.player.username,
                socket: this.player.socket,
                ready: false,
                shots: emptyBoard(),
                board: emptyBoard()
            }
        }

        this.emitGameChange();
    }

    sendShot(socket: SocketType, x: number, y: number) {
        if (!Game.checkUsername(socket)) return;
        const shooter = this.getGameMember(socket);
        if (!shooter) {
            return;
        }

        // some checks
        if (this.status !== "playing") {
            return;
        }
        if (this.ownerTurn && socket !== this.owner.socket) {
            return;
        }
        if (!this.ownerTurn && socket !== this.player?.socket) {
            return;
        }

        const target = this.ownerTurn ? this.player! : this.owner;
        // if the cell is already hit, do nothing
        if (target?.board![x][y].hit) return;

        // change target's board
        target!.board![x][y].hit = true;

        // change shooter's shots board
        shooter.shots![x][y].hit = true;
        shooter.shots![x][y].ship = target.board![x][y].ship;

        // send the hit cell to the target
        target.socket.emit("send_cell_change", [{x, y, hit: true, ship: target.board![x][y].ship}], true);

        // if the ship is sunk send all the neighbors as hit cells, respecting the board boundaries and game settings
        const shooterChanges = [{x, y, hit: true, ship: target.board![x][y].ship}]
        const ship = getShip(target.board!, {x, y});

        // check if the ship is sunk
        if (ship && ship.every(cell => cell.hit)) {
            // iterate over the ship cells
            for (const cell of ship) {
                const cellNeighbors = getCellNeighborCells(cell.x, cell.y, target.board!, !this.cornerCollisionsAllowed);

                // iterate over the neighbors and add them to the changes
                for (const neighbor of cellNeighbors) {
                    // if the neighbor is not already hit and not already in the changes array
                    if (!neighbor.ship && !neighbor.hit && !shooterChanges.some(pos => pos.x === neighbor.x && pos.y === neighbor.y)) {
                        // if any neighbor should be mark as hit, add it to the changes and change the shooter's shots board
                        shooterChanges.push({
                            x: neighbor.x,
                            y: neighbor.y,
                            hit: true,
                            ship: target.board![neighbor.x][neighbor.y].ship
                        })

                        shooter.shots![neighbor.x][neighbor.y].hit = true;
                    }
                }
            }
        }

        // send the changes to the shooter
        shooter.socket.emit("send_cell_change", shooterChanges, false);

        if (!target.board![x][y].ship) {
            this.ownerTurn = !this.ownerTurn;
            this.emitOwner("game_updated", {
                yourTurn: this.ownerTurn
            })

            this.emitPlayer("game_updated", {
                yourTurn: !this.ownerTurn
            })
        }

        this.checkWin(shooter);
    }

    startShooting(socket: SocketType) {
        if (!Game.checkUsername(socket)) return;
        if (!this.checkAdmin(socket)) return;

        if (this.status !== "preparing") return;

        if (!this.owner.ready || !this.player?.ready) {
            socket.emit("error", "Both players need to be ready");
            return;
        }

        this.status = "playing";
        this.ownerTurn = Math.random() > 0.5;
        this.emitPlayer("game_updated", {
            status: this.status,
            yourTurn: !this.ownerTurn
        });
        this.emitOwner("game_updated", {
            status: this.status,
            yourTurn: this.ownerTurn
        });
    }

    remove() {
        this.emitPlayer("game_set", null);
        this.emitOwner("game_set", null);

        if (this.player) {
            this.player.socket.leave(this.id);
            this.player.socket.data.game = null;
            this.player.socket.join("open_games_broadcast")
        }

        this.owner.socket.leave(this.id);
        this.owner.socket.data.game = null;
        this.owner.socket.join("open_games_broadcast")

        OpenGamesHandler.instance.onRemove(this);

        Game.initializedGames = Game.initializedGames.filter(game => game.id !== this.id)
    }

    checkPlayerKick() {
        if (this.player?.socket.disconnected) {
            this.player = null;
            this.emitOwner("info", "The player has been kicked from the game for being disconnected")

            if (this.status !== "lobby") {
                this.status = "lobby";
                this.resetGame()
            } else {
                this.emitGameChange({
                    player: null
                });
            }
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

        OpenGamesHandler.instance.onGameStart(this);

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
            yourTurn: member === this.owner ? this.ownerTurn : !this.ownerTurn,
            board: member.board,
            shots: member.shots,
            shipWrappingAllowed: this.shipWrappingAllowed,
            cornerCollisionsAllowed: this.cornerCollisionsAllowed,
            requiredShips: this.requiredShips,
            isOpen: this.isOpen
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
        this.player.socket.join("open_games_broadcast")
        this.player = null;

        this.emitGameChange({
            player: null
        });
        OpenGamesHandler.instance.onPlayerLeave(this);
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
        socket.leave("open_games_broadcast")
        OpenGamesHandler.instance.onPlayerJoin(this);
        this.emitOwner("game_updated", {
            player: {
                username: this.player.username,
                online: true,
                ready: false
            }
        })
        this.emitPlayer("game_set", this.getPacket(this.player))
        this.emitOwner("info", `${socket.data.username} has joined the game`)
        this.emitPlayer("info", `You have joined ${this.owner.username}'s game`)
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
        socket.join("open_games_broadcast")
        OpenGamesHandler.instance.onPlayerLeave(this);
        OpenGamesHandler.instance.sendOpenGames(socket);

        this.owner.socket.emit("info", `${socket.data.username} has left the game`)

        if (this.status !== "lobby") {
            this.status = "lobby";
            this.resetGame()
        }

        if (this.playerTimeout) {
            clearTimeout(this.playerTimeout);
        }
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
        socket.leave("open_games_broadcast")
        OpenGamesHandler.instance.onPlayerJoin(this);
        socket.emit("info", "You have reconnected to the game")
        socket.broadcast.to(this.id).emit("info", `${socket.data.username} has reconnected`)
    }

    toggleReady(socket: SocketType) {
        const gameMember = this.getGameMember(socket);
        if (!gameMember) return;

        if (!this.checkShips(gameMember))
            return;

        gameMember.ready = !gameMember.ready;
        this.emitGameChange({
            owner: {
                ready: this.owner.ready
            },
            player: this.player ? {
                ready: this.player.ready
            } : undefined
        })
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
        this.owner.ready = false;

        this.emitPlayer("info", `${this.owner.username} has disconnected, waiting for reconnection`)
        this.emitPlayer("game_updated", {
            owner: {
                online: false,
                ready: false
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
        this.player!.ready = false;

        this.emitOwner("game_updated", {
            player: {
                online: false,
                ready: false
            }
        })

        if (this.playerTimeout)
            clearTimeout(this.playerTimeout);

        this.playerTimeout = setTimeout(() => this.checkPlayerKick(), 60000);
    }

    getOpenGame(): OpenGame {
        return {
            id: this.id,
            owner: this.owner.username
        }
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
            if (this.player) {
                this.emitPlayer("game_set", this.getPacket(this.player!))
            }
            this.emitOwner("game_set", this.getPacket(this.owner))
        } else {
            this.emit("game_updated", packet);
        }
    }
}