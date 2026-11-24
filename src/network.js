
/**
 * Lelele Games - Network Layer
 *
 * Provides a transport interface for online chess.
 *
 * This module defines the network API used by online.js.
 * A signaling service is still required for automatic
 * room discovery and WebRTC connection establishment.
 */

export const NETWORK_EVENTS = {
    MESSAGE: "message",
    CONNECTION_CHANGE: "connection-change",
    ERROR: "error"
};

export class ChessNetwork {
    constructor(options = {}) {
        this.peerConnection = null;
        this.dataChannel = null;

        this.listeners = new Map();

        this.roomCode = null;
        this.playerId = options.playerId ?? null;

        this.connected = false;
        this.destroyed = false;

        this.configuration = {
            iceServers: options.iceServers ?? [
                {
                    urls: "stun:stun.l.google.com:19302"
                }
            ]
        };

        this.pendingMessages = [];
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
                    "Network event listener error:",
                    error
                );
            }
        }
    }

    // ========================================
    // Room API
    // ========================================

    /**
     * Prepare a room.
     *
     * This does not publish the room online.
     * A signaling adapter must provide room discovery.
     */
    async createRoom(roomCode, metadata = {}) {
        this.ensureAvailable();

        if (!/^\d{4}$/.test(roomCode)) {
            throw new Error("Invalid room code.");
        }

        this.roomCode = roomCode;

        this.roomMetadata = {
            ...metadata,
            roomCode
        };

        return {
            success: true,
            roomCode,
            requiresSignaling: true
        };
    }

    /**
     * Join a room through an external signaling adapter.
     */
    async joinRoom(roomCode, metadata = {}) {
        this.ensureAvailable();

        if (!/^\d{4}$/.test(roomCode)) {
            throw new Error("Invalid room code.");
        }

        this.roomCode = roomCode;

        this.roomMetadata = {
            ...metadata,
            roomCode
        };

        if (!this.signaling) {
            throw new Error(
                "No signaling service is configured."
            );
        }

        return await this.signaling.joinRoom(
            roomCode,
            metadata
        );
    }

    /**
     * Set the signaling adapter.
     *
     * The adapter must implement:
     * - createRoom(roomCode, metadata)
     * - joinRoom(roomCode, metadata)
     * - sendSignal(roomCode, signal)
     * - onSignal(callback)
     * - leaveRoom(roomCode)
     */
    setSignalingAdapter(adapter) {
        if (!adapter) {
            throw new Error("Invalid signaling adapter.");
        }

        this.signaling = adapter;

        this.signaling.onSignal(signal => {
            this.handleSignal(signal);
        });
    }

    // ========================================
    // WebRTC setup
    // ========================================

    createPeerConnection() {
        this.ensureAvailable();

        if (typeof RTCPeerConnection === "undefined") {
            throw new Error(
                "WebRTC is not supported in this browser."
            );
        }

        this.closePeerConnection();

        this.peerConnection = new RTCPeerConnection(
            this.configuration
        );

        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection?.connectionState;

            this.updateConnectionState(
                state === "connected",
                state
            );
        };

        this.peerConnection.onicecandidate = event => {
            if (!event.candidate) return;

            this.sendSignal({
                type: "ice-candidate",
                candidate: event.candidate
            });
        };

        this.peerConnection.ondatachannel = event => {
            this.attachDataChannel(event.channel);
        };

        return this.peerConnection;
    }

    createDataChannel(label = "chess-game") {
        if (!this.peerConnection) {
            throw new Error(
                "Peer connection has not been created."
            );
        }

        const channel = this.peerConnection.createDataChannel(
            label,
            {
                ordered: true
            }
        );

        this.attachDataChannel(channel);

        return channel;
    }

    attachDataChannel(channel) {
        this.dataChannel = channel;

        channel.onopen = () => {
            this.updateConnectionState(true, "connected");

            this.flushPendingMessages();
        };

        channel.onclose = () => {
            this.updateConnectionState(false, "closed");
        };

        channel.onerror = error => {
            this.emit(NETWORK_EVENTS.ERROR, {
                message: "Data channel error.",
                error
            });
        };

        channel.onmessage = event => {
            this.handleIncomingData(event.data);
        };
    }

    // ========================================
    // WebRTC signaling
    // ========================================

    async createOffer() {
        if (!this.peerConnection) {
            this.createPeerConnection();
        }

        this.createDataChannel();

        const offer = await this.peerConnection.createOffer();

        await this.peerConnection.setLocalDescription(offer);

        await this.sendSignal({
            type: "offer",
            description: this.peerConnection.localDescription
        });

        return offer;
    }

    async createAnswer() {
        if (!this.peerConnection) {
            this.createPeerConnection();
        }

        const answer = await this.peerConnection.createAnswer();

        await this.peerConnection.setLocalDescription(answer);

        await this.sendSignal({
            type: "answer",
            description: this.peerConnection.localDescription
        });

        return answer;
    }

    async handleSignal(signal) {
        if (!signal || typeof signal.type !== "string") {
            return;
        }

        try {
            switch (signal.type) {
                case "offer":
                    await this.handleOffer(signal.description);
                    break;

                case "answer":
                    await this.handleAnswer(signal.description);
                    break;

                case "ice-candidate":
                    await this.handleIceCandidate(
                        signal.candidate
                    );
                    break;

                default:
                    console.warn(
                        "Unknown signaling message:",
                        signal.type
                    );
            }
        } catch (error) {
            this.emit(NETWORK_EVENTS.ERROR, {
                message: "Signaling error.",
                error
            });
        }
    }

    async handleOffer(description) {
        if (!this.peerConnection) {
            this.createPeerConnection();
        }

        await this.peerConnection.setRemoteDescription(
            description
        );

        await this.createAnswer();
    }

    async handleAnswer(description) {
        if (!this.peerConnection) {
            throw new Error(
                "No peer connection exists."
            );
        }

        await this.peerConnection.setRemoteDescription(
            description
        );
    }

    async handleIceCandidate(candidate) {
        if (!this.peerConnection) {
            return;
        }

        await this.peerConnection.addIceCandidate(candidate);
    }

    async sendSignal(signal) {
        if (!this.signaling || !this.roomCode) {
            throw new Error(
                "Signaling service is not available."
            );
        }

        await this.signaling.sendSignal(
            this.roomCode,
            signal
        );
    }

    // ========================================
    // Message transport
    // ========================================

    async send(message) {
        this.ensureAvailable();

        if (!message || typeof message !== "object") {
            throw new Error("Invalid network message.");
        }

        const serialized = JSON.stringify(message);

        if (
            this.dataChannel &&
            this.dataChannel.readyState === "open"
        ) {
            this.dataChannel.send(serialized);

            return {
                success: true
            };
        }

        throw new Error("Peer is not connected.");
    }

    handleIncomingData(data) {
        let message;

        try {
            message = JSON.parse(data);
        } catch {
            this.emit(NETWORK_EVENTS.ERROR, {
                message: "Received invalid message data."
            });

            return;
        }

        if (
            !message ||
            typeof message !== "object" ||
            typeof message.type !== "string"
        ) {
            this.emit(NETWORK_EVENTS.ERROR, {
                message: "Received malformed message."
            });

            return;
        }

        this.emit(NETWORK_EVENTS.MESSAGE, message);
    }

    // ========================================
    // Connection state
    // ========================================

    updateConnectionState(connected, state) {
        this.connected = Boolean(connected);

        this.emit(
            NETWORK_EVENTS.CONNECTION_CHANGE,
            {
                connected: this.connected,
                state
            }
        );
    }

    isConnected() {
        return (
            this.connected &&
            this.dataChannel?.readyState === "open"
        );
    }

    // ========================================
    // Pending messages
    // ========================================

    flushPendingMessages() {
        if (!this.isConnected()) return;

        const messages = [...this.pendingMessages];

        this.pendingMessages = [];

        for (const message of messages) {
            this.send(message).catch(error => {
                this.emit(NETWORK_EVENTS.ERROR, {
                    message: error.message
                });
            });
        }
    }

    // ========================================
    // Reconnection
    // ========================================

    async reconnect(roomCode, metadata = {}) {
        if (!this.signaling) {
            throw new Error(
                "No signaling service is configured."
            );
        }

        this.roomCode = roomCode;

        return await this.signaling.reconnect(
            roomCode,
            metadata
        );
    }

    // ========================================
    // Leaving
    // ========================================

    async leaveRoom(roomCode = this.roomCode) {
        if (this.signaling && roomCode) {
            await this.signaling.leaveRoom(roomCode);
        }

        this.closePeerConnection();

        this.roomCode = null;

        this.roomMetadata = null;

        this.updateConnectionState(false, "closed");
    }

    // ========================================
    // Cleanup
    // ========================================

    closePeerConnection() {
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }

        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        this.connected = false;
    }

    ensureAvailable() {
        if (this.destroyed) {
            throw new Error(
                "Network instance has been destroyed."
            );
        }
    }

    destroy() {
        this.closePeerConnection();

        this.listeners.clear();

        this.pendingMessages = [];

        this.roomCode = null;

        this.signaling = null;

        this.destroyed = true;
    }
}

// ============================================
// Factory
// ============================================

export function createChessNetwork(options = {}) {
    return new ChessNetwork(options);
}
