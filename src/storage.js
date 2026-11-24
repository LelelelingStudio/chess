
/**
 * Lelele Games - Local Storage
 *
 * Stores game settings, statistics and match records.
 * Uses browser localStorage.
 */

const STORAGE_PREFIX = "lelele-chess:";

const STORAGE_KEYS = {
    SETTINGS: "settings",
    STATISTICS: "statistics",
    MATCHES: "matches",
    SAVED_GAME: "saved-game"
};

const MAX_MATCH_RECORDS = 50;

// ============================================
// Default Data
// ============================================

export const DEFAULT_SETTINGS = {
    language: "en",
    sound: true,
    soundEffects: true,
    music: false,
    animations: true,
    showCoordinates: true,
    boardTheme: "classic",
    pieceTheme: "classic",
    autoQueenPromotion: true,
    difficulty: "medium",
    playerColor: "white"
};

export const DEFAULT_STATISTICS = {
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    gamesDrawn: 0,
    totalMoves: 0,
    bestWinStreak: 0,
    currentWinStreak: 0,
    lastPlayed: null
};

export const SCHEMA_VERSION = 2;

const APPLICATION_NAME = "Lelele Games Chess";
const LEGACY_APPLICATION_NAMES = new Set(["Lelele Chess"]);
const LEGACY_LANGUAGE_KEY = "lelele-chess-language";

const SETTINGS_FIELDS = new Set(Object.keys(DEFAULT_SETTINGS));
const STATISTIC_FIELDS = Object.keys(DEFAULT_STATISTICS).filter(
    key => key !== "lastPlayed"
);

// ============================================
// Storage Manager
// ============================================

export class ChessStorage {
    constructor(options = {}) {
        this.prefix =
            options.prefix ?? STORAGE_PREFIX;

        this.storage = null;
        this.lastError = null;

        this.available = false;

        this.initialize();
    }

    // ========================================
    // Initialization
    // ========================================

    initialize() {
        try {
            if (typeof localStorage === "undefined") {
                return false;
            }

            const testKey =
                `${this.prefix}storage-test`;

            localStorage.setItem(testKey, "test");

            localStorage.removeItem(testKey);

            this.storage = localStorage;

            this.available = true;

            return true;
        } catch {
            this.storage = null;

            this.available = false;

            return false;
        }
    }

    isAvailable() {
        return this.available;
    }

    // ========================================
    // Basic operations
    // ========================================

    getKey(key) {
        return `${this.prefix}${key}`;
    }

    set(key, value) {
        if (!this.available || !this.storage) {
            return false;
        }

        try {
            this.storage.setItem(
                this.getKey(key),
                JSON.stringify(value)
            );

            return true;
        } catch (error) {
            this.lastError = error;

            if (error?.name === "QuotaExceededError") {
                console.warn(
                    "Storage quota exceeded; data was not saved."
                );
            } else {
                console.warn("Storage save error:", error);
            }

            return false;
        }
    }

    get(key, fallback = null) {
        if (!this.available || !this.storage) {
            return fallback;
        }

        try {
            const value = this.storage.getItem(
                this.getKey(key)
            );

            if (value === null) {
                return fallback;
            }

            return JSON.parse(value);
        } catch (error) {
            console.error(
                "Storage read error:",
                error
            );

            return fallback;
        }
    }

    remove(key) {
        if (!this.available || !this.storage) {
            return false;
        }

        try {
            this.storage.removeItem(
                this.getKey(key)
            );

            return true;
        } catch {
            return false;
        }
    }

    sanitizeSettings(input = {}) {
        const output = { ...DEFAULT_SETTINGS };

        if (!input || typeof input !== "object" || Array.isArray(input)) {
            return output;
        }

        for (const [key, value] of Object.entries(input)) {
            if (!SETTINGS_FIELDS.has(key)) continue;

            if (typeof DEFAULT_SETTINGS[key] === "boolean") {
                output[key] = Boolean(value);
            } else if (typeof value === "string") {
                output[key] = value;
            }
        }

        if (!["easy", "medium", "hard"].includes(output.difficulty)) {
            output.difficulty = DEFAULT_SETTINGS.difficulty;
        }

        if (!["en", "zh"].includes(output.language)) {
            output.language = DEFAULT_SETTINGS.language;
        }

        if (![ "white", "black" ].includes(output.playerColor)) {
            output.playerColor = DEFAULT_SETTINGS.playerColor;
        }

        return output;
    }

    sanitizeStatistics(input = {}) {
        const output = { ...DEFAULT_STATISTICS };

        if (!input || typeof input !== "object" || Array.isArray(input)) {
            return output;
        }

        for (const key of STATISTIC_FIELDS) {
            const value = Number(input[key]);

            if (Number.isFinite(value) && value >= 0) {
                output[key] = Math.floor(value);
            }
        }

        if (typeof input.lastPlayed === "string") {
            output.lastPlayed = input.lastPlayed;
        }

        return output;
    }

    // ========================================
    // Settings
    // ========================================

    getSettings() {
        const saved = this.get(
            STORAGE_KEYS.SETTINGS,
            {}
        );

        const settings = this.sanitizeSettings(saved);

        if (
            saved &&
            typeof saved === "object" &&
            !("language" in saved)
        ) {
            try {
                const legacy = this.storage?.getItem(
                    LEGACY_LANGUAGE_KEY
                );

                if (legacy === "en" || legacy === "zh") {
                    settings.language = legacy;
                    this.storage.removeItem(LEGACY_LANGUAGE_KEY);
                }
            } catch {
                // Ignore legacy migration failures.
            }
        }

        return settings;
    }

    saveSettings(settings) {
        if (
            !settings ||
            typeof settings !== "object" ||
            Array.isArray(settings)
        ) {
            return false;
        }

        const current = this.getSettings();
        const updates = {};

        for (const key of Object.keys(settings)) {
            if (SETTINGS_FIELDS.has(key)) updates[key] = settings[key];
        }

        return this.set(
            STORAGE_KEYS.SETTINGS,
            this.sanitizeSettings({ ...current, ...updates })
        );
    }

    updateSetting(key, value) {
        if (!SETTINGS_FIELDS.has(key)) return false;

        const settings = this.getSettings();

        settings[key] = value;

        return this.saveSettings(settings);
    }

    resetSettings() {
        return this.set(
            STORAGE_KEYS.SETTINGS,
            DEFAULT_SETTINGS
        );
    }

    // ========================================
    // Statistics
    // ========================================

    getStatistics() {
        return this.sanitizeStatistics(
            this.get(STORAGE_KEYS.STATISTICS, {})
        );
    }

    saveStatistics(statistics) {
        if (
            !statistics ||
            typeof statistics !== "object" ||
            Array.isArray(statistics)
        ) {
            return false;
        }

        return this.set(
            STORAGE_KEYS.STATISTICS,
            this.sanitizeStatistics(statistics)
        );
    }

    updateStatistics(result, totalMoves = 0) {
        const stats = this.getStatistics();

        stats.gamesPlayed += 1;

        stats.totalMoves += Math.max(
            0,
            Number(totalMoves) || 0
        );

        stats.lastPlayed = new Date().toISOString();

        switch (result) {
            case "win":
                stats.gamesWon += 1;

                stats.currentWinStreak += 1;

                stats.bestWinStreak = Math.max(
                    stats.bestWinStreak,
                    stats.currentWinStreak
                );

                break;

            case "loss":
                stats.gamesLost += 1;

                stats.currentWinStreak = 0;

                break;

            case "draw":
                stats.gamesDrawn += 1;

                stats.currentWinStreak = 0;

                break;

            default:
                return false;
        }

        return this.saveStatistics(stats);
    }

    resetStatistics() {
        return this.set(
            STORAGE_KEYS.STATISTICS,
            DEFAULT_STATISTICS
        );
    }

    // ========================================
    // Match records
    // ========================================

    getMatches() {
        const matches = this.get(
            STORAGE_KEYS.MATCHES,
            []
        );

        return Array.isArray(matches)
            ? matches
            : [];
    }

    saveMatch(match) {
        if (
            !match ||
            typeof match !== "object" ||
            Array.isArray(match)
        ) {
            return false;
        }

        const matches = this.getMatches();

        const record = {
            id: this.createId(),
            date: new Date().toISOString(),
            ...match
        };

        matches.unshift(record);

        if (matches.length > MAX_MATCH_RECORDS) {
            matches.length = MAX_MATCH_RECORDS;
        }

        return this.set(
            STORAGE_KEYS.MATCHES,
            matches
        );
    }

    getMatch(id) {
        if (!id) return null;

        return this.getMatches().find(
            match => match.id === id
        ) ?? null;
    }

    deleteMatch(id) {
        if (!id) return false;

        const matches = this.getMatches();

        const updated = matches.filter(
            match => match.id !== id
        );

        if (updated.length === matches.length) {
            return false;
        }

        return this.set(
            STORAGE_KEYS.MATCHES,
            updated
        );
    }

    clearMatches() {
        return this.set(
            STORAGE_KEYS.MATCHES,
            []
        );
    }

    // ========================================
    // Saved game
    // ========================================

    saveGame(gameData) {
        if (
            !gameData ||
            typeof gameData !== "object" ||
            Array.isArray(gameData)
        ) {
            return false;
        }

        return this.set(
            STORAGE_KEYS.SAVED_GAME,
            {
                ...gameData,
                savedAt: new Date().toISOString()
            }
        );
    }

    loadGame() {
        return this.get(
            STORAGE_KEYS.SAVED_GAME,
            null
        );
    }

    hasSavedGame() {
        return this.loadGame() !== null;
    }

    deleteSavedGame() {
        return this.remove(
            STORAGE_KEYS.SAVED_GAME
        );
    }

    // ========================================
    // Data export
    // ========================================

    exportData() {
        return {
            application: APPLICATION_NAME,
            schemaVersion: SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            settings: this.getSettings(),
            statistics: this.getStatistics(),
            matches: this.getMatches(),
            savedGame: this.loadGame()
        };
    }

    // ========================================
    // Data import
    // ========================================

    importData(data) {
        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {
            return false;
        }

        const application =
            data.application ?? data.appName;

        if (
            application !== APPLICATION_NAME &&
            !LEGACY_APPLICATION_NAMES.has(application)
        ) {
            return false;
        }

        const schemaVersion = Number(
            data.schemaVersion ?? 1
        );

        if (!Number.isFinite(schemaVersion) || schemaVersion > SCHEMA_VERSION) {
            return false;
        }

        let imported = true;

        if (
            data.settings &&
            typeof data.settings === "object" &&
            !Array.isArray(data.settings)
        ) {
            imported =
                this.saveSettings(data.settings) && imported;
        }

        if (
            data.statistics &&
            typeof data.statistics === "object" &&
            !Array.isArray(data.statistics)
        ) {
            imported =
                this.saveStatistics(data.statistics) && imported;
        }

        if (Array.isArray(data.matches)) {
            imported =
                this.set(
                    STORAGE_KEYS.MATCHES,
                    data.matches.slice(0, MAX_MATCH_RECORDS)
                ) && imported;
        }

        if (
            data.savedGame &&
            typeof data.savedGame === "object"
        ) {
            imported = this.saveGame(data.savedGame) && imported;
        }

        return imported;
    }

    // ========================================
    // Clear data
    // ========================================


    clearAll() {
        if (!this.available || !this.storage) {
            return false;
        }

        try {
            for (
                let index = this.storage.length - 1;
                index >= 0;
                index--
            ) {
                const key = this.storage.key(index);

                if (
                    key &&
                    key.startsWith(this.prefix)
                ) {
                    this.storage.removeItem(key);
                }
            }

            try {
                this.storage.removeItem(LEGACY_LANGUAGE_KEY);
            } catch {
                // Already removed or inaccessible.
            }

            return true;
        } catch (error) {
            console.error(
                "Storage cleanup error:",
                error
            );

            return false;
        }
    }

    // ========================================
    // Utilities
    // ========================================

    createId() {
        if (
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ) {
            return crypto.randomUUID();
        }

        if (
            typeof crypto !== "undefined" &&
            typeof crypto.getRandomValues === "function"
        ) {
            const bytes = new Uint8Array(8);

            crypto.getRandomValues(bytes);

            return (
                Date.now().toString(36) +
                "-" +
                Array.from(bytes, byte =>
                    byte.toString(16).padStart(2, "0")
                ).join("")
            );
        }

        this._idCounter = (this._idCounter ?? 0) + 1;

        return (
            Date.now().toString(36) +
            "-" +
            this._idCounter.toString(36)
        );
    }
}

// ============================================
// Default instance
// ============================================

export const storage = new ChessStorage();

// ============================================
// Factory
// ============================================

export function createChessStorage(options = {}) {
    return new ChessStorage(options);
}
