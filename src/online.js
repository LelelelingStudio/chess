
/**
 * Lelele Games - Online Multiplayer
 *
 * Manages online chess rooms and multiplayer events.
 * Actual transport is provided by network.js.
 */

import {
    COLORS
} from "./chess-rules.js";

// ============================================
// Constants
// ============================================

export const ONLINE_EVENTS = {
    ROOM_CREATED: "room-created",
    ROOM_JOINED: "room-joined",
    PLAYER_JOINED: "player-joined",
    PLAYER_LEFT: "player-left",
    MOVE: "move",
    UNDO_REQUEST: "undo-request",
    UNDO_RESPONSE: "undo-response",
    DRAW_REQUEST: "draw-request",
    DRAW_RESPONSE: "draw-response",
    RESIGN: "resign",
    GAME_RESTART: "game-restart",
    CONNECTION_CHANGE: "connection-change",
    ERROR: "error"
};

const ROOM_CODE_LENGTH = 4;

const ROOM_CODE_CHARACTERS = "0123456789";

const REQUEST_TIMEOUT = 30000;

// ============================================
// Helpers
// ============================================

function createRoomCode() {
    let code = "";

    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        const index = Math.floor(
            Math.random() * ROOM_CODE_CHARACTERS.length
        );

        code += ROOM_CODE_CHARACTERS[index];
    }

    return code;
}

function createRequestId() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8)
    );
}

function isValidRoomCode(code) {
    return (
        typeof code === "string" &&
        new RegExp(`^\\d{${ROOM_CODE_LENGTH}}$`).test(code)
    );
}

function oppositeColor(color) {
    return color === COLORS.WHITE
        ? COLORS.BLACK
        : COLORS.WHITE;
}

// ============================================
// Online Game Manager
// ============================================

export class OnlineGame {
    constructor(options = {}) {
        this.network = options.network ?? null;

        this.playerName = options.playerName ?? "Player";

        this.roomCode = null;

        this.playerId = options.playerId ?? createRequestId();

        this.localColor = null;

        this.opponent = null;

        this.isHost = false;

        this.connected = false;

        this.gameStarted = false;

        this.pendingRequests = new Map();

        this.listeners = new Map();

        this.requestTimers = new Map();

        this.roomState = "idle";

        this.bindNetworkEvents();
    }

    // ========================================
    // Event system
    // ========================================

    on(event, callback) {
        if (typeof callback !== "function") {
            return () => {};
        }

        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        this.listeners.get(event).add(callback);

        return () => this.off(event, callback);
    }

    off(event, callback) {
        this.listeners.get(event)?.delete(callback);
    }

    emit(event, data = {}) {
        const callbacks = this.listeners.get(event);

        if (!callbacks) return;

        for (const callback of callbacks) {
            try {
                callback(data);
            } catch (error) {
                console.error(
                    "Online event listener error:",
                    error
                );
            }
        }
    }

    // ========================================
    // Network integration
    // ========================================

    bindNetworkEvents() {
        if (!this.network) return;

        this.network.on("message", message => {
            this.handleNetworkMessage(message);
        });

        this.network.on("connection-change", status => {
            this.connected = status.connected;

            this.emit(
                ONLINE_EVENTS.CONNECTION_CHANGE,
                status
            );
        });

        this.network.on("error", error => {
            this.emit(ONLINE_EVENTS.ERROR, {
                message: error?.message ?? String(error)
            });
        });
    }

    setNetwork(network) {
        this.network = network;

        this.bindNetworkEvents();
    }

    // ========================================
    // Room creation
    // ========================================

    /**
     * Create a new room.
     *
     * Network layer must provide:
     * network.createRoom(roomCode, metadata)
     */
    async createRoom() {
        if (!this.network) {
            return this.fail("network-unavailable");
        }

        if (this.roomState !== "idle") {
            return this.fail("already-in-room");
        }

        const roomCode = createRoomCode();

        try {
            await this.network.createRoom(
                roomCode,
                {
                    playerId: this.playerId,
                    playerName: this.playerName,
                    createdAt: Date.now()
                }
            );

            this.roomCode = roomCode;

            this.localColor = COLORS.WHITE;

            this.isHost = true;

            this.roomState = "waiting";

            this.connected = true;

            this.emit(ONLINE_EVENTS.ROOM_CREATED, {
                roomCode,
                color: this.localColor
            });

            return {
                success: true,
                roomCode,
                color: this.localColor
            };
        } catch (error) {
            return this.fail(
                "room-creation-failed",
                error
            );
        }
    }

    // ========================================
    // Room joining
    // ========================================

    /**
     * Join an existing room.
     */
    async joinRoom(roomCode) {
        if (!this.network) {
            return this.fail("network-unavailable");
        }

        if (!isValidRoomCode(roomCode)) {
            return this.fail("invalid-room-code");
        }

        if (this.roomState !== "idle") {
            return this.fail("already-in-room");
        }

        try {
            const result = await this.network.joinRoom(
                roomCode,
                {
                    playerId: this.playerId,
                    playerName: this.playerName
                }
            );

            if (!result || result.success === false) {
                return this.fail("room-join-failed");
            }

            this.roomCode = roomCode;

            this.localColor = COLORS.BLACK;

            this.isHost = false;

            this.opponent = result.host ?? null;

            this.roomState = "playing";

            this.connected = true;

            this.gameStarted = true;

            this.emit(ONLINE_EVENTS.ROOM_JOINED, {
                roomCode,
                color: this.localColor,
                opponent: this.opponent
            });

            return {
                success: true,
                roomCode,
                color: this.localColor,
                opponent: this.opponent
            };
        } catch (error) {
            return this.fail(
                "room-join-failed",
                error
            );
        }
    }

    // ========================================
    // Player information
    // ========================================

    setOpponent(player) {
        this.opponent = {
            id: player.id,
            name: player.name ?? "Opponent"
        };

        this.roomState = "playing";

        this.gameStarted = true;

        this.emit(ONLINE_EVENTS.PLAYER_JOINED, {
            opponent: this.opponent
        });
    }

    getRoomInfo() {
        return {
            roomCode: this.roomCode,
            playerId: this.playerId,
            playerName: this.playerName,
            localColor: this.localColor,
            opponent: this.opponent,
            isHost: this.isHost,
            connected: this.connected,
            gameStarted: this.gameStarted,
            roomState: this.roomState
        };
    }

    // ========================================
    // Sending game events
    // ========================================

    async sendMove(move) {
        if (!this.canSendMove()) {
            return this.fail("cannot-send-move");
        }

        return this.send({
            type: ONLINE_EVENTS.MOVE,
            move,
            playerId: this.playerId,
            timestamp: Date.now()
        });
    }

    canSendMove() {
        return (
            this.connected &&
            this.gameStarted &&
            this.roomState === "playing"
        );
    }

    // ========================================
    // Undo requests
    // ========================================

    async requestUndo() {
        return this.sendRequest(
            ONLINE_EVENTS.UNDO_REQUEST,
            {}
        );
    }

    respondUndo(requestId, accepted) {
        return this.send({
            type: ONLINE_EVENTS.UNDO_RESPONSE,
            requestId,
            accepted: Boolean(accepted),
            playerId: this.playerId
        });
    }

    // ========================================
    // Draw requests
    // ========================================

    async requestDraw() {
        return this.sendRequest(
            ONLINE_EVENTS.DRAW_REQUEST,
            {}
        );
    }

    respondDraw(requestId, accepted) {
        return this.send({
            type: ONLINE_EVENTS.DRAW_RESPONSE,
            requestId,
            accepted: Boolean(accepted),
            playerId: this.playerId
        });
    }

    // ========================================
    // Resignation
    // ========================================

    async resign() {
        if (!this.gameStarted) {
            return this.fail("game-not-started");
        }

        const result = await this.send({
            type: ONLINE_EVENTS.RESIGN,
            playerId: this.playerId,
            color: this.localColor
        });

        this.gameStarted = false;

        this.roomState = "finished";

        this.emit(ONLINE_EVENTS.RESIGN, {
            color: this.localColor
        });

        return result;
    }

    // ========================================
    // Restart
    // ========================================

    async requestRestart() {
        return this.send({
            type: ONLINE_EVENTS.GAME_RESTART,
            playerId: this.playerId
        });
    }

    // ========================================
    // Request management
    // ========================================

    async sendRequest(type, payload) {
        const requestId = createRequestId();

        const message = {
            ...payload,
            type,
            requestId,
            playerId: this.playerId,
            timestamp: Date.now()
        };

        this.pendingRequests.set(requestId, {
            type,
            createdAt: Date.now()
        });

        return this.send(message);
    }

    clearRequest(requestId) {
        this.pendingRequests.delete(requestId);

        const timer = this.requestTimers.get(requestId);

        if (timer) {
            clearTimeout(timer);
            this.requestTimers.delete(requestId);
        }
    }

    // ========================================
    // Message handling
    // ========================================

    handleNetworkMessage(message) {
        if (!message || typeof message.type !== "string") {
            return;
        }

        if (message.playerId === this.playerId) {
            return;
        }

        switch (message.type) {
            case ONLINE_EVENTS.PLAYER_JOINED:
                this.setOpponent(message.player);
                break;

            case ONLINE_EVENTS.PLAYER_LEFT:
                this.opponent = null;
                this.gameStarted = false;

                this.emit(ONLINE_EVENTS.PLAYER_LEFT, message);
                break;

            case ONLINE_EVENTS.MOVE:
                this.emit(ONLINE_EVENTS.MOVE, message);
                break;

            case ONLINE_EVENTS.UNDO_REQUEST:
                this.emit(ONLINE_EVENTS.UNDO_REQUEST, message);
                break;

            case ONLINE_EVENTS.UNDO_RESPONSE:
                this.handleRequestResponse(
                    message,
                    ONLINE_EVENTS.UNDO_RESPONSE
                );
                break;

            case ONLINE_EVENTS.DRAW_REQUEST:
                this.emit(ONLINE_EVENTS.DRAW_REQUEST, message);
                break;

            case ONLINE_EVENTS.DRAW_RESPONSE:
                this.handleRequestResponse(
                    message,
                    ONLINE_EVENTS.DRAW_RESPONSE
                );
                break;

            case ONLINE_EVENTS.RESIGN:
                this.gameStarted = false;
                this.roomState = "finished";

                this.emit(ONLINE_EVENTS.RESIGN, message);
                break;

            case ONLINE_EVENTS.GAME_RESTART:
                this.emit(ONLINE_EVENTS.GAME_RESTART, message);
                break;

            default:
                this.emit("unknown-message", message);
        }
    }

    handleRequestResponse(message, eventType) {
        const request = this.pendingRequests.get(
            message.requestId
        );

        if (!request) return;

        this.clearRequest(message.requestId);

        this.emit(eventType, {
            requestId: message.requestId,
            accepted: Boolean(message.accepted)
        });
    }

    // ========================================
    // Transport
    // ========================================

    async send(message) {
        if (!this.network || !this.connected) {
            return this.fail("not-connected");
        }

        try {
            await this.network.send(message);

            return {
                success: true
            };
        } catch (error) {
            return this.fail("send-failed", error);
        }
    }

    // ========================================
    // Connection recovery
    // ========================================

    async reconnect() {
        if (!this.network || !this.roomCode) {
            return this.fail("no-room-to-reconnect");
        }

        try {
            const result = await this.network.reconnect(
                this.roomCode,
                {
                    playerId: this.playerId
                }
            );

            this.connected = Boolean(result?.connected);

            this.emit(ONLINE_EVENTS.CONNECTION_CHANGE, {
                connected: this.connected,
                reconnecting: false
            });

            return {
                success: this.connected
            };
        } catch (error) {
            this.connected = false;

            return this.fail(
                "reconnection-failed",
                error
            );
        }
    }

    // ========================================
    // Leaving
    // ========================================

    async leaveRoom() {
        if (this.network && this.roomCode) {
            try {
                await this.network.leaveRoom(
                    this.roomCode
                );
            } catch (error) {
                console.warn(
                    "Error leaving room:",
                    error
                );
            }
        }

        for (const requestId of this.pendingRequests.keys()) {
            this.clearRequest(requestId);
        }

        this.roomCode = null;
        this.localColor = null;
        this.opponent = null;

        this.isHost = false;
        this.connected = false;
        this.gameStarted = false;

        this.roomState = "idle";

        this.emit(ONLINE_EVENTS.CONNECTION_CHANGE, {
            connected: false
        });

        return {
            success: true
        };
    }

    // ========================================
    // Error handling
    // ========================================

    fail(code, error = null) {
        const result = {
            success: false,
            error: code,
            message: error?.message ?? null
        };

        this.emit(ONLINE_EVENTS.ERROR, result);

        return result;
    }

    // ========================================
    // Cleanup
    // ========================================

    destroy() {
        for (const requestId of this.pendingRequests.keys()) {
            this.clearRequest(requestId);
        }

        this.listeners.clear();

        this.network = null;

        this.roomCode = null;

        this.roomState = "idle";

        this.connected = false;

        this.gameStarted = false;
    }
}

// ============================================
// Factory
// ============================================

export function createOnlineGame(options = {}) {
    return new OnlineGame(options);
}
