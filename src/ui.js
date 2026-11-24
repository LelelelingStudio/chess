
/**
 * Lelele Games - Chess UI
 *
 * Handles board rendering and basic user interactions.
 */

import {
    COLORS,
    PIECE_TYPES,
    getLegalMoves,
    getGameStatus,
    algebraicToPosition,
    positionToAlgebraic
} from "./chess-rules.js";

const PIECE_SYMBOLS = {
    [COLORS.WHITE]: {
        [PIECE_TYPES.KING]: "♔",
        [PIECE_TYPES.QUEEN]: "♕",
        [PIECE_TYPES.ROOK]: "♖",
        [PIECE_TYPES.BISHOP]: "♗",
        [PIECE_TYPES.KNIGHT]: "♘",
        [PIECE_TYPES.PAWN]: "♙"
    },
    [COLORS.BLACK]: {
        [PIECE_TYPES.KING]: "♚",
        [PIECE_TYPES.QUEEN]: "♛",
        [PIECE_TYPES.ROOK]: "♜",
        [PIECE_TYPES.BISHOP]: "♝",
        [PIECE_TYPES.KNIGHT]: "♞",
        [PIECE_TYPES.PAWN]: "♟"
    }
};

export class ChessUI {
    constructor(options = {}) {
        this.game = options.game ?? null;

        this.boardElement =
            document.querySelector(
                options.boardSelector ?? "#chess-board"
            );

        this.statusElement =
            document.querySelector(
                options.statusSelector ?? "#game-status"
            );

        this.turnElement =
            document.querySelector(
                options.turnSelector ?? "#current-turn"
            );

        this.historyElement =
            document.querySelector(
                options.historySelector ?? "#move-history"
            );

        this.capturedElement =
            document.querySelector(
                options.capturedSelector ?? "#captured-pieces"
            );

        this.selectedSquare = null;

        this.legalMoves = [];

        this.unsubscribe = null;

        this.language = "en";

        this.onPromotion = options.onPromotion ?? null;

        this.onMove = options.onMove ?? null;

        this.onSquareClick = options.onSquareClick ?? null;

        this.boundClickHandler =
            this.handleBoardClick.bind(this);

        if (this.boardElement) {
            this.boardElement.addEventListener(
                "click",
                this.boundClickHandler
            );
        }

        if (this.game) {
            this.connectGame(this.game);
        }
    }

    // ========================================
    // Game connection
    // ========================================

    connectGame(game) {
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        this.game = game;

        this.unsubscribe = game.subscribe(() => {
            this.render();
        });

        this.render();
    }

    // ========================================
    // Rendering
    // ========================================

    render() {
        if (!this.game || !this.boardElement) return;

        const snapshot = this.game.getSnapshot();

        this.renderBoard(snapshot);
        this.renderStatus(snapshot);
        this.renderHistory(snapshot);
        this.renderCaptured(snapshot);
    }

    renderBoard(snapshot) {
        const board = snapshot.board;

        this.boardElement.innerHTML = "";

        this.boardElement.setAttribute(
            "role",
            "grid"
        );

        this.boardElement.setAttribute(
            "aria-label",
            this.language === "zh"
                ? "国际象棋棋盘"
                : "Chess board"
        );

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement("button");

                const piece = board[row][col];

                const squareName =
                    positionToAlgebraic(row, col);

                const isLight =
                    (row + col) % 2 === 0;

                square.type = "button";

                square.className = [
                    "chess-square",
                    isLight ? "light" : "dark"
                ].join(" ");

                square.dataset.row = row;
                square.dataset.col = col;
                square.dataset.square = squareName;

                square.setAttribute(
                    "role",
                    "gridcell"
                );

                square.setAttribute(
                    "aria-label",
                    this.getSquareLabel(
                        squareName,
                        piece
                    )
                );

                if (
                    this.selectedSquare &&
                    this.selectedSquare.row === row &&
                    this.selectedSquare.col === col
                ) {
                    square.classList.add("selected");
                }

                const isLegalTarget =
                    this.legalMoves.some(move =>
                        move.to.row === row &&
                        move.to.col === col
                    );

                if (isLegalTarget) {
                    square.classList.add("legal-target");

                    if (piece) {
                        square.classList.add("capture-target");
                    }
                }

                if (piece) {
                    const pieceElement =
                        document.createElement("span");

                    pieceElement.className =
                        `chess-piece ${piece.color}`;

                    pieceElement.textContent =
                        PIECE_SYMBOLS[piece.color]?.[piece.type] ?? "";

                    pieceElement.setAttribute(
                        "aria-hidden",
                        "true"
                    );

                    square.appendChild(pieceElement);
                }

                this.boardElement.appendChild(square);
            }
        }
    }

    // ========================================
    // Game status
    // ========================================

    renderStatus(snapshot) {
        const status = getGameStatus(
            snapshot.board,
            snapshot.turn,
            snapshot.castlingRights,
            snapshot.enPassantTarget,
            snapshot.halfmoveClock
        );

        if (this.turnElement) {
            this.turnElement.textContent =
                this.translate(
                    snapshot.turn === COLORS.WHITE
                        ? "White's turn"
                        : "Black's turn"
                );
        }

        if (this.statusElement) {
            this.statusElement.textContent =
                this.translate(status.message ?? status.type ?? "");
        }
    }

    // ========================================
    // Move history
    // ========================================

    renderHistory(snapshot) {
        if (!this.historyElement) return;

        this.historyElement.innerHTML = "";

        const history = snapshot.history ?? [];

        history.forEach((move, index) => {
            const item = document.createElement("div");

            item.className = "move-history-item";

            const number = Math.floor(index / 2) + 1;

            item.textContent =
                `${number}${index % 2 === 0 ? "." : "..."} ${move.notation ?? ""}`;

            this.historyElement.appendChild(item);
        });
    }

    // ========================================
    // Captured pieces
    // ========================================

    renderCaptured(snapshot) {
        if (!this.capturedElement) return;

        this.capturedElement.innerHTML = "";

        const captured = snapshot.captured ?? [];

        for (const piece of captured) {
            const item = document.createElement("span");

            item.className =
                `captured-piece ${piece.color}`;

            item.textContent =
                PIECE_SYMBOLS[piece.color]?.[piece.type] ?? "";

            item.title = this.translate(
                `${piece.color} ${piece.type}`
            );

            this.capturedElement.appendChild(item);
        }
    }

    // ========================================
    // Board interactions
    // ========================================

    handleBoardClick(event) {
        const square = event.target.closest(
            ".chess-square"
        );

        if (!square || !this.boardElement.contains(square)) {
            return;
        }

        const row = Number(square.dataset.row);
        const col = Number(square.dataset.col);

        if (!Number.isInteger(row) || !Number.isInteger(col)) {
            return;
        }

        this.selectSquare(row, col);
    }

    selectSquare(row, col) {
        if (!this.game) return;

        const snapshot = this.game.getSnapshot();

        const piece = snapshot.board[row][col];

        if (this.selectedSquare) {
            const selectedMove =
                this.legalMoves.find(move =>
                    move.to.row === row &&
                    move.to.col === col
                );

            if (selectedMove) {
                this.playMove(
                    this.selectedSquare,
                    selectedMove
                );

                return;
            }
        }

        if (piece && piece.color === snapshot.turn) {
            this.selectedSquare = { row, col };

            this.legalMoves = getLegalMoves(
                snapshot.board,
                row,
                col,
                snapshot.turn,
                snapshot.castlingRights,
                snapshot.enPassantTarget
            );

            this.render();

            return;
        }

        this.clearSelection();

        if (this.onSquareClick) {
            this.onSquareClick({ row, col });
        }
    }

    // ========================================
    // Execute move
    // ========================================

    async playMove(from, move) {
        if (!this.game) return;

        let promotion = "queen";

        if (move.promotion) {
            promotion = await this.choosePromotion();
        }

        const result = this.game.move(
            from,
            move.to,
            promotion
        );

        this.clearSelection();

        if (!result?.success) {
            this.render();
            return;
        }

        if (this.onMove) {
            this.onMove({
                from,
                to: move.to,
                promotion
            });
        }

        this.render();
    }

    choosePromotion() {
        if (this.onPromotion) {
            return this.onPromotion();
        }

        return Promise.resolve("queen");
    }

    // ========================================
    // Selection
    // ========================================

    clearSelection() {
        this.selectedSquare = null;

        this.legalMoves = [];

        this.render();
    }

    // ========================================
    // Language
    // ========================================

    setLanguage(language) {
        this.language =
            language === "zh" ? "zh" : "en";

        this.render();
    }

    translate(text) {
        if (this.language !== "zh") {
            return text;
        }

        const dictionary = {
            "White's turn": "白方回合",
            "Black's turn": "黑方回合",
            "Check": "将军",
            "Checkmate": "将死",
            "Stalemate": "逼和",
            "Draw": "平局",
            "White": "白方",
            "Black": "黑方",
            "king": "王",
            "queen": "后",
            "rook": "车",
            "bishop": "象",
            "knight": "马",
            "pawn": "兵"
        };

        return dictionary[text] ?? text;
    }

    // ========================================
    // Cleanup
    // ========================================

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        if (this.boardElement) {
            this.boardElement.removeEventListener(
                "click",
                this.boundClickHandler
            );
        }

        this.selectedSquare = null;
        this.legalMoves = [];
    }
}

// ============================================
// Factory
// ============================================

export function createChessUI(options = {}) {
    return new ChessUI(options);
}
