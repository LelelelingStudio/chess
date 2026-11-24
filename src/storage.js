
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
    autoQueenPromotion: true
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

// ============================================
// Storage Manager
// ============================================

export class ChessStorage {
    constructor(options = {}) {
        this.prefix =
            options.prefix ?? STORAGE_PREFIX;

        this.storage = null;

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
            console.error(
                "Storage save error:",
                error
            );

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

    // ========================================
    // Settings
    // ========================================

    getSettings() {
        const saved = this.get(
            STORAGE_KEYS.SETTINGS,
            {}
        );

        return {
            ...DEFAULT_SETTINGS,
            ...(
                saved &&
                typeof saved === "object" &&
                !Array.isArray(saved)
                    ? saved
                    : {}
            )
        };
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

        const updated = {
            ...current,
            ...settings
        };

        return this.set(
            STORAGE_KEYS.SETTINGS,
            updated
        );
    }

    updateSetting(key, value) {
        const settings = this.getSettings();

        settings[key] = value;

        return this.set(
            STORAGE_KEYS.SETTINGS,
            settings
        );
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
        const saved = this.get(
            STORAGE_KEYS.STATISTICS,
            {}
        );

        return {
            ...DEFAULT_STATISTICS,
            ...(
                saved &&
                typeof saved === "object" &&
                !Array.isArray(saved)
                    ? saved
                    : {}
            )
        };
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
            {
                ...DEFAULT_STATISTICS,
                ...statistics
            }
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
            application: "Lelele Chess",
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

        if (data.application !== "Lelele Chess") {
            return false;
        }

        if (
            data.settings &&
            typeof data.settings === "object" &&
            !Array.isArray(data.settings)
        ) {
            this.saveSettings(data.settings);
        }

        if (
            data.statistics &&
            typeof data.statistics === "object" &&
            !Array.isArray(data.statistics)
        ) {
            this.saveStatistics(data.statistics);
        }

        if (Array.isArray(data.matches)) {
            this.set(
                STORAGE_KEYS.MATCHES,
                data.matches.slice(0, MAX_MATCH_RECORDS)
            );
        }

        if (
            data.savedGame &&
            typeof data.savedGame === "object"
        ) {
            this.saveGame(data.savedGame);
        }

        return true;
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

        return (
            Date.now().toString(36) +
            Math.random().toString(36).slice(2)
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
