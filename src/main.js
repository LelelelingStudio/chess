/**
 * Lelele Games - Chess
 * Main application entry point
 *
 * Copyright © 2026 Lelele Games.
 */

const APP_VERSION = "1.0.0";

const translations = {
    en: {
        title: "Lelele Chess",
        subtitle: "A classic game, reimagined.",
        local: "Local Multiplayer",
        ai: "Play vs Computer",
        online: "Online Multiplayer",
        settings: "Settings",
        back: "Back to Menu",
        undo: "Undo",
        draw: "Offer Draw",
        resign: "Resign",
        whiteTurn: "White to move",
        blackTurn: "Black to move",
        developing: "This game mode is currently under development.",
        settingsMessage: "Settings will be available in a future update.",
        confirmResign: "Are you sure you want to resign?",
        confirmDraw: "Offer a draw to your opponent?",
        comingSoon: "Coming Soon"
    },

    zh: {
        title: "了了了国际象棋",
        subtitle: "经典棋局，全新体验。",
        local: "本地双人",
        ai: "人机对战",
        online: "在线对战",
        settings: "设置",
        back: "返回主菜单",
        undo: "悔棋",
        draw: "请求和棋",
        resign: "认输",
        whiteTurn: "白方回合",
        blackTurn: "黑方回合",
        developing: "该游戏模式正在开发中。",
        settingsMessage: "设置功能将在后续版本中开放。",
        confirmResign: "确定要认输吗？",
        confirmDraw: "确定向对手请求和棋吗？",
        comingSoon: "即将推出"
    }
};

class ChessApp {
    constructor() {
        this.language = "en";
        this.currentMode = null;
        this.gameStarted = false;

        this.elements = {
            title: document.querySelector(".app-title"),
            subtitle: document.querySelector(".app-subtitle"),

            languageToggle: document.querySelector(
                "#language-toggle"
            ),

            settingsButton: document.querySelector(
                "#settings-button"
            ),

            welcomePanel: document.querySelector(
                "#welcome-panel"
            ),

            gameScreen: document.querySelector(
                "#game-screen"
            ),

            chessboard: document.querySelector(
                "#chessboard"
            ),

            status: document.querySelector(
                "#game-status"
            ),

            backButton: document.querySelector(
                "#back-button"
            ),

            undoButton: document.querySelector(
                "#undo-button"
            ),

            drawButton: document.querySelector(
                "#draw-button"
            ),

            resignButton: document.querySelector(
                "#resign-button"
            )
        };

        this.init();
    }

    /**
     * Initialize the application.
     */
    init() {
        this.bindEvents();
        this.updateLanguage();
        this.showWelcomeScreen();

        console.info(
            `Lelele Chess v${APP_VERSION} initialized.`
        );
    }

    /**
     * Bind interface events.
     */
    bindEvents() {
        const {
            languageToggle,
            settingsButton,
            backButton,
            undoButton,
            drawButton,
            resignButton
        } = this.elements;

        languageToggle?.addEventListener(
            "click",
            () => this.toggleLanguage()
        );

        settingsButton?.addEventListener(
            "click",
            () => this.openSettings()
        );

        backButton?.addEventListener(
            "click",
            () => this.showWelcomeScreen()
        );

        undoButton?.addEventListener(
            "click",
            () => this.handleUndo()
        );

        drawButton?.addEventListener(
            "click",
            () => this.handleDraw()
        );

        resignButton?.addEventListener(
            "click",
            () => this.handleResign()
        );

        // Game mode buttons
        document.querySelectorAll("[data-mode]").forEach(
            button => {
                button.addEventListener("click", () => {
                    const mode = button.dataset.mode;
                    this.startGame(mode);
                });
            }
        );
    }

    /**
     * Change the interface language.
     */
    toggleLanguage() {
        this.language =
            this.language === "en" ? "zh" : "en";

        this.updateLanguage();
    }

    /**
     * Get a translated string.
     */
    t(key) {
        return translations[this.language][key]
            ?? translations.en[key]
            ?? key;
    }

    /**
     * Update visible interface text.
     */
    updateLanguage() {
        const { title, subtitle, languageToggle } =
            this.elements;

        if (title) {
            title.textContent = this.t("title");
        }

        if (subtitle) {
            subtitle.textContent = this.t("subtitle");
        }

        if (languageToggle) {
            languageToggle.textContent =
                this.language === "en" ? "中文" : "English";
        }

        this.updateButtonLabels();
        this.updateGameStatus();
    }

    /**
     * Update button labels.
     */
    updateButtonLabels() {
        const labels = {
            "#settings-button": "settings",
            "#back-button": "back",
            "#undo-button": "undo",
            "#draw-button": "draw",
            "#resign-button": "resign"
        };

        Object.entries(labels).forEach(
            ([selector, key]) => {
                const element = document.querySelector(selector);

                if (element) {
                    element.textContent = this.t(key);
                }
            }
        );

        const modeLabels = {
            local: "local",
            ai: "ai",
            online: "online"
        };

        Object.entries(modeLabels).forEach(
            ([mode, key]) => {
                const button = document.querySelector(
                    `[data-mode="${mode}"]`
                );

                if (button) {
                    button.textContent = this.t(key);
                }
            }
        );
    }

    /**
     * Show the welcome screen.
     */
    showWelcomeScreen() {
        this.gameStarted = false;
        this.currentMode = null;

        const { welcomePanel, gameScreen } = this.elements;

        if (welcomePanel) {
            welcomePanel.hidden = false;
        }

        if (gameScreen) {
            gameScreen.hidden = true;
        }
    }

    /**
     * Start a selected game mode.
     */
    startGame(mode) {
        const supportedModes = [
            "local",
            "ai",
            "online"
        ];

        if (!supportedModes.includes(mode)) {
            console.warn("Unknown game mode:", mode);
            return;
        }

        this.currentMode = mode;

        // Game modes will be connected to the game engine
        // in a future development stage.
        this.showComingSoon();
    }

    /**
     * Display a temporary development message.
     */
    showComingSoon() {
        const message = this.t("developing");

        const { status } = this.elements;

        if (status) {
            status.textContent = message;
        } else {
            window.alert(message);
        }
    }

    /**
     * Open the settings interface.
     */
    openSettings() {
        window.alert(this.t("settingsMessage"));
    }

    /**
     * Handle undo request.
     */
    handleUndo() {
        // Will be connected to the chess engine later.
        console.info("Undo requested.");
    }

    /**
     * Handle draw request.
     */
    handleDraw() {
        const confirmed = window.confirm(
            this.t("confirmDraw")
        );

        if (confirmed) {
            console.info("Draw requested.");
        }
    }

    /**
     * Handle resignation.
     */
    handleResign() {
        const confirmed = window.confirm(
            this.t("confirmResign")
        );

        if (confirmed) {
            console.info("Resignation requested.");
            this.showWelcomeScreen();
        }
    }

    /**
     * Update the current game status.
     */
    updateGameStatus() {
        const { status } = this.elements;

        if (!status || !this.gameStarted) {
            return;
        }

        status.textContent = this.t("whiteTurn");
    }
}

/**
 * Start the application after the page is ready.
 */
function startApplication() {
    window.leleleChess = new ChessApp();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        startApplication
    );
} else {
    startApplication();
}