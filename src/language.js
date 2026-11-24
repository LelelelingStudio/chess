
/**
 * Lelele Games - Language System
 *
 * Default language: English
 * Supported languages: English, Simplified Chinese
 */

export const SUPPORTED_LANGUAGES = {
    EN: "en",
    ZH: "zh"
};

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES.EN;

const STORAGE_KEY = "lelele-chess-language";

// ============================================
// Translation Dictionary
// ============================================

export const TRANSLATIONS = {
    en: {
        // General
        gameTitle: "Chess",
        play: "Play",
        back: "Back",
        cancel: "Cancel",
        confirm: "Confirm",
        close: "Close",
        save: "Save",
        loading: "Loading...",
        settings: "Settings",

        // Main menu
        mainMenu: "Main Menu",
        localGame: "Local Game",
        playWithFriend: "Play with Friend",
        playWithAI: "Play vs AI",
        onlineGame: "Online Game",
        howToPlay: "How to Play",

        // Game modes
        localTwoPlayer: "Two Players",
        computerOpponent: "Computer Opponent",
        onlineMultiplayer: "Online Multiplayer",

        // Difficulty
        difficulty: "Difficulty",
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",

        // Chess colors
        white: "White",
        black: "Black",
        whitePlayer: "White Player",
        blackPlayer: "Black Player",

        // Chess status
        whiteTurn: "White's Turn",
        blackTurn: "Black's Turn",
        check: "Check!",
        checkmate: "Checkmate!",
        stalemate: "Stalemate",
        draw: "Draw",
        gameOver: "Game Over",
        whiteWins: "White Wins!",
        blackWins: "Black Wins!",
        drawGame: "The game is a draw.",

        // Controls
        undo: "Undo",
        redo: "Redo",
        restart: "Restart",
        resign: "Resign",
        offerDraw: "Offer Draw",
        moveHistory: "Move History",
        capturedPieces: "Captured Pieces",

        // Promotion
        promotionTitle: "Promote Your Pawn",
        promoteQueen: "Queen",
        promoteRook: "Rook",
        promoteBishop: "Bishop",
        promoteKnight: "Knight",

        // Online game
        createRoom: "Create Room",
        joinRoom: "Join Room",
        roomCode: "Room Code",
        enterRoomCode: "Enter 4-digit room code",
        waitingForOpponent: "Waiting for opponent...",
        opponentJoined: "Opponent joined!",
        opponentDisconnected: "Opponent disconnected",
        reconnecting: "Reconnecting...",
        connected: "Connected",
        disconnected: "Disconnected",
        copyRoomCode: "Copy Room Code",
        roomCreated: "Room created successfully!",

        // Requests
        undoRequest: "Your opponent requests an undo.",
        drawRequest: "Your opponent offers a draw.",
        accept: "Accept",
        decline: "Decline",

        // Settings
        language: "Language",
        sound: "Sound",
        soundEffects: "Sound Effects",
        music: "Music",
        animations: "Animations",
        showCoordinates: "Show Coordinates",

        // Notifications
        movePlayed: "Move played",
        invalidMove: "Invalid move",
        selectPiece: "Select a piece",
        yourTurn: "Your turn",
        opponentTurn: "Opponent's turn",
        copied: "Copied!",
        somethingWentWrong: "Something went wrong.",

        // Help
        objectiveTitle: "Objective",
        objectiveDescription:
            "The goal of chess is to checkmate your opponent's king.",
        movementTitle: "Piece Movement",
        movementDescription:
            "Each chess piece has its own movement rules.",
        castlingTitle: "Castling",
        enPassantTitle: "En Passant",
        promotionHelpTitle: "Pawn Promotion",

        // Footer
        madeBy: "Made by Lelele Games",
        version: "Version"
    },

    zh: {
        // General
        gameTitle: "国际象棋",
        play: "开始游戏",
        back: "返回",
        cancel: "取消",
        confirm: "确认",
        close: "关闭",
        save: "保存",
        loading: "加载中...",
        settings: "设置",

        // Main menu
        mainMenu: "主菜单",
        localGame: "本地游戏",
        playWithFriend: "与朋友对战",
        playWithAI: "与电脑对战",
        onlineGame: "在线游戏",
        howToPlay: "游戏规则",

        // Game modes
        localTwoPlayer: "双人对战",
        computerOpponent: "人机对战",
        onlineMultiplayer: "在线多人对战",

        // Difficulty
        difficulty: "难度",
        easy: "简单",
        medium: "中等",
        hard: "困难",

        // Chess colors
        white: "白方",
        black: "黑方",
        whitePlayer: "白方玩家",
        blackPlayer: "黑方玩家",

        // Chess status
        whiteTurn: "白方回合",
        blackTurn: "黑方回合",
        check: "将军！",
        checkmate: "将死！",
        stalemate: "逼和",
        draw: "平局",
        gameOver: "游戏结束",
        whiteWins: "白方获胜！",
        blackWins: "黑方获胜！",
        drawGame: "本局以平局结束。",

        // Controls
        undo: "悔棋",
        redo: "重做",
        restart: "重新开始",
        resign: "认输",
        offerDraw: "提出和棋",
        moveHistory: "棋谱记录",
        capturedPieces: "被吃掉的棋子",

        // Promotion
        promotionTitle: "选择兵的升变",
        promoteQueen: "升变为后",
        promoteRook: "升变为车",
        promoteBishop: "升变为象",
        promoteKnight: "升变为马",

        // Online game
        createRoom: "创建房间",
        joinRoom: "加入房间",
        roomCode: "房间号码",
        enterRoomCode: "输入4位房间号码",
        waitingForOpponent: "等待对手加入...",
        opponentJoined: "对手已加入！",
        opponentDisconnected: "对手已断开连接",
        reconnecting: "正在重新连接...",
        connected: "已连接",
        disconnected: "已断开连接",
        copyRoomCode: "复制房间号码",
        roomCreated: "房间创建成功！",

        // Requests
        undoRequest: "对手请求悔棋。",
        drawRequest: "对手提出和棋。",
        accept: "接受",
        decline: "拒绝",

        // Settings
        language: "语言",
        sound: "声音",
        soundEffects: "音效",
        music: "背景音乐",
        animations: "动画效果",
        showCoordinates: "显示棋盘坐标",

        // Notifications
        movePlayed: "已走棋",
        invalidMove: "无效走法",
        selectPiece: "请选择一个棋子",
        yourTurn: "你的回合",
        opponentTurn: "对手的回合",
        copied: "已复制！",
        somethingWentWrong: "发生了一些问题。",

        // Help
        objectiveTitle: "游戏目标",
        objectiveDescription:
            "国际象棋的目标是将死对方的国王。",
        movementTitle: "棋子走法",
        movementDescription:
            "每种棋子都有自己的移动规则。",
        castlingTitle: "王车易位",
        enPassantTitle: "吃过路兵",
        promotionHelpTitle: "兵的升变",

        // Footer
        madeBy: "了了了游制作",
        version: "版本"
    }
};

// ============================================
// Language Manager
// ============================================

export class LanguageManager {
    constructor(options = {}) {
        this.defaultLanguage =
            options.defaultLanguage ?? DEFAULT_LANGUAGE;

        this.storage =
            options.storage ?? null;

        this.currentLanguage = this.loadSavedLanguage();

        this.listeners = new Set();
    }

    // ========================================
    // Language selection
    // ========================================

    loadSavedLanguage() {
        try {
            const saved = this.storage
                ? this.storage.getItem(STORAGE_KEY)
                : (
                    typeof localStorage !== "undefined"
                        ? localStorage.getItem(STORAGE_KEY)
                        : null
                );

            if (saved && TRANSLATIONS[saved]) {
                return saved;
            }
        } catch {
            // Storage may be unavailable.
        }

        return this.defaultLanguage;
    }

    setLanguage(language) {
        if (!TRANSLATIONS[language]) {
            console.warn(
                `Unsupported language: ${language}`
            );

            return false;
        }

        this.currentLanguage = language;

        this.saveLanguage(language);

        this.emit();

        return true;
    }

    getLanguage() {
        return this.currentLanguage;
    }

    toggleLanguage() {
        const nextLanguage =
            this.currentLanguage === "en"
                ? "zh"
                : "en";

        return this.setLanguage(nextLanguage);
    }

    // ========================================
    // Translation
    // ========================================

    t(key, replacements = {}) {
        const dictionary =
            TRANSLATIONS[this.currentLanguage] ??
            TRANSLATIONS.en;

        let value =
            dictionary[key] ??
            TRANSLATIONS.en[key] ??
            key;

        if (typeof value !== "string") {
            return String(value);
        }

        for (const [name, replacement] of Object.entries(replacements)) {
            value = value.replaceAll(
                `{${name}}`,
                String(replacement)
            );
        }

        return value;
    }

    getDictionary() {
        return TRANSLATIONS[this.currentLanguage];
    }

    getAvailableLanguages() {
        return [
            {
                code: "en",
                name: "English",
                nativeName: "English"
            },
            {
                code: "zh",
                name: "Chinese",
                nativeName: "简体中文"
            }
        ];
    }

    // ========================================
    // Storage
    // ========================================

    saveLanguage(language) {
        try {
            if (this.storage) {
                this.storage.setItem(
                    STORAGE_KEY,
                    language
                );

                return;
            }

            if (typeof localStorage !== "undefined") {
                localStorage.setItem(
                    STORAGE_KEY,
                    language
                );
            }
        } catch {
            // Continue without persistence.
        }
    }

    // ========================================
    // Events
    // ========================================

    subscribe(callback) {
        if (typeof callback !== "function") {
            return () => {};
        }

        this.listeners.add(callback);

        return () => {
            this.listeners.delete(callback);
        };
    }

    emit() {
        for (const callback of this.listeners) {
            try {
                callback(this.currentLanguage);
            } catch (error) {
                console.error(
                    "Language listener error:",
                    error
                );
            }
        }
    }

    // ========================================
    // Cleanup
    // ========================================

    destroy() {
        this.listeners.clear();
    }
}

// ============================================
// Default instance
// ============================================

export const languageManager = new LanguageManager();

// ============================================
// Short translation helper
// ============================================

export function t(key, replacements = {}) {
    return languageManager.t(key, replacements);
}

// ============================================
// Factory
// ============================================

export function createLanguageManager(options = {}) {
    return new LanguageManager(options);
}
