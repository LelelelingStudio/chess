
/**
 * Lelele Games - Chess
 * Game Controller
 *
 * Connects the chess rules engine with the user interface.
 */

import {
    COLORS,
    PIECES,
    createInitialState,
    cloneState,
    makeMove,
    getLegalMoves,
    getAllLegalMoves,
    getGameStatus,
    getPieceAt,
    isInCheck,
    squareToNotation,
    notationToSquare,
    toFEN
} from "./chess-rules.js";

// ============================================
// Game Controller
// ============================================

export class ChessGame {
    constructor(options = {}) {
        this.mode = options.mode ?? "local";
        this.onChange = options.onChange ?? null;

        this.state = createInitialState();

        this.undoStack = [];
        this.redoStack = [];

        this.gameOver = false;
        this.result = null;

        this.listeners = new Set();

        this.startedAt = Date.now();
        this.endedAt = null;
    }

    // ========================================
    // Event system
    // ========================================

    subscribe(listener) {
        if (typeof listener !== "function") {
            return () => {};
        }

        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    emit(event = "change") {
        const snapshot = this.getSnapshot();

        for (const listener of this.listeners) {
            listener(snapshot, event);
        }

        if (typeof this.onChange === "function") {
            this.onChange(snapshot, event);
        }
    }

    // ========================================
    // Game state
    // ========================================

    getSnapshot() {
        return {
            mode: this.mode,

            state: cloneState(this.state),

            currentTurn: this.state.turn,

            status: getGameStatus(this.state),

            gameOver: this.gameOver,

            result: this.result,

            moveCount: this.state.moveHistory.length,

            fen: toFEN(this.state)
        };
    }

    getCurrentPlayer() {
        return this.state.turn;
    }

    getBoard() {
        return this.state.board.map(
            piece => piece ? { ...piece } : null
        );
    }

    getPiece(square) {
        return getPieceAt(this.state, square);
    }

    getLegalMoves(square) {
        if (this.gameOver) {
            return [];
        }

        return getLegalMoves(this.state, square);
    }

    getAllLegalMoves(color = this.state.turn) {
        if (this.gameOver && color === this.state.turn) {
            return [];
        }

        return getAllLegalMoves(this.state, color);
    }

    isCheck(color = this.state.turn) {
        return isInCheck(this.state, color);
    }

    getStatus() {
        return getGameStatus(this.state);
    }

    // ========================================
    // Move handling
    // ========================================

    /**
     * Move a piece using board indexes.
     *
     * Example:
     * game.move(52, 36);
     */
    move(from, to, promotion = PIECES.QUEEN) {
        if (this.gameOver) {
            return {
                success: false,
                reason: "game-over"
            };
        }

        const piece = getPieceAt(this.state, from);

        if (!piece) {
            return {
                success: false,
                reason: "empty-square"
            };
        }

        if (piece.color !== this.state.turn) {
            return {
                success: false,
                reason: "wrong-turn"
            };
        }

        const previousState = cloneState(this.state);

        const nextState = makeMove(this.state, {
            from,
            to,
            promotion
        });

        if (!nextState) {
            return {
                success: false,
                reason: "illegal-move"
            };
        }

        this.undoStack.push(previousState);
        this.redoStack = [];

        this.state = nextState;

        const status = getGameStatus(this.state);

        if (
            status.status === "checkmate" ||
            status.status === "stalemate" ||
            status.status === "draw"
        ) {
            this.finish(status);
        }

        this.emit("move");

        return {
            success: true,
            move: this.getLastMove(),
            status,
            snapshot: this.getSnapshot()
        };
    }

    /**
     * Move using chess notation.
     *
     * Example:
     * game.moveNotation("e2", "e4");
     */
    moveNotation(from, to, promotion = PIECES.QUEEN) {
        const fromSquare = notationToSquare(from);
        const toSquare = notationToSquare(to);

        if (fromSquare === -1 || toSquare === -1) {
            return {
                success: false,
                reason: "invalid-notation"
            };
        }

        return this.move(
            fromSquare,
            toSquare,
            promotion
        );
    }

    /**
     * Get the last recorded move.
     */
    getLastMove() {
        const history = this.state.moveHistory;

        if (history.length === 0) {
            return null;
        }

        const move = history[history.length - 1];

        return {
            ...move,

            fromNotation: squareToNotation(move.from),

            toNotation: squareToNotation(move.to)
        };
    }

    // ========================================
    // Undo and redo
    // ========================================

    undo() {
        if (this.undoStack.length === 0) {
            return {
                success: false,
                reason: "nothing-to-undo"
            };
        }

        if (this.gameOver) {
            this.gameOver = false;
            this.result = null;
            this.endedAt = null;
        }

        this.redoStack.push(cloneState(this.state));

        this.state = this.undoStack.pop();

        this.emit("undo");

        return {
            success: true,
            snapshot: this.getSnapshot()
        };
    }

    redo() {
        if (this.redoStack.length === 0) {
            return {
                success: false,
                reason: "nothing-to-redo"
            };
        }

        this.undoStack.push(cloneState(this.state));

        this.state = this.redoStack.pop();

        const status = getGameStatus(this.state);

        if (
            status.status === "checkmate" ||
            status.status === "stalemate" ||
            status.status === "draw"
        ) {
            this.finish(status);
        }

        this.emit("redo");

        return {
            success: true,
            snapshot: this.getSnapshot()
        };
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    // ========================================
    // Game lifecycle
    // ========================================

    newGame(options = {}) {
        if (options.mode) {
            this.mode = options.mode;
        }

        this.state = createInitialState();

        this.undoStack = [];
        this.redoStack = [];

        this.gameOver = false;
        this.result = null;

        this.startedAt = Date.now();
        this.endedAt = null;

        this.emit("new-game");

        return this.getSnapshot();
    }

    finish(status) {
        this.gameOver = true;

        this.endedAt = Date.now();

        this.result = {
            status: status.status,
            winner: status.winner,
            reason: status.reason
        };
    }

    resign(color = this.state.turn) {
        if (this.gameOver) {
            return {
                success: false,
                reason: "game-over"
            };
        }

        if (
            color !== COLORS.WHITE &&
            color !== COLORS.BLACK
        ) {
            return {
                success: false,
                reason: "invalid-color"
            };
        }

        const winner =
            color === COLORS.WHITE
                ? COLORS.BLACK
                : COLORS.WHITE;

        this.finish({
            status: "resignation",
            winner,
            reason: "resignation"
        });

        this.emit("resign");

        return {
            success: true,
            result: this.result
        };
    }

    agreeDraw() {
        if (this.gameOver) {
            return {
                success: false,
                reason: "game-over"
            };
        }

        this.finish({
            status: "draw",
            winner: null,
            reason: "agreement"
        });

        this.emit("draw");

        return {
            success: true,
            result: this.result
        };
    }

    // ========================================
    // Move history
    // ========================================

    getMoveHistory() {
        return this.state.moveHistory.map(
            (move, index) => ({
                number: Math.floor(index / 2) + 1,

                color: move.color,

                piece: move.piece,

                from: squareToNotation(move.from),

                to: squareToNotation(move.to),

                captured: move.captured,

                promotion: move.promotion,

                castling: move.castling,

                enPassant: move.enPassant
            })
        );
    }

    clearHistory() {
        this.state.history = [];
        this.state.moveHistory = [];

        this.undoStack = [];
        this.redoStack = [];

        this.emit("history-cleared");
    }

    // ========================================
    // Game information
    // ========================================

    getDuration() {
        const end = this.endedAt ?? Date.now();

        return Math.max(
            0,
            Math.floor((end - this.startedAt) / 1000)
        );
    }

    getStatistics() {
        const history = this.state.moveHistory;

        return {
            totalMoves: history.length,

            whiteMoves: history.filter(
                move => move.color === COLORS.WHITE
            ).length,

            blackMoves: history.filter(
                move => move.color === COLORS.BLACK
            ).length,

            captures: history.filter(
                move => move.captured !== null
            ).length,

            promotions: history.filter(
                move => move.promotion !== null
            ).length,

            durationSeconds: this.getDuration(),

            status: this.getStatus()
        };
    }

    exportGame() {
        return {
            version: 1,

            mode: this.mode,

            fen: toFEN(this.state),

            moves: this.getMoveHistory(),

            result: this.result,

            statistics: this.getStatistics()
        };
    }
}

// ============================================
// Factory
// ============================================

export function createGame(options = {}) {
    return new ChessGame(options);
}
