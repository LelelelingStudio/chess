/**
 * Lelele Games - LeleleSDK adapter
 *
 * Official SDK (v1.1): https://game.leleleling.site/lelele-sdk.js
 * Docs: https://game.leleleling.site/sdk-docs
 *
 * The SDK is a classic script that exposes window.LeleleSDK.
 * It has no init() method and no ES module exports. This adapter
 * loads it on demand and provides safe fallbacks for standalone
 * browser usage, where every SDK call is a no-op.
 */

const SDK_URL = "https://game.leleleling.site/lelele-sdk.js";

let loadPromise = null;

function getGlobalSDK() {
    if (typeof window === "undefined") return null;

    return window.LeleleSDK ?? null;
}

/** Load the official script once. Never throws to the caller. */
export function ensureSDK() {
    if (getGlobalSDK()) {
        return Promise.resolve(getGlobalSDK());
    }

    if (typeof document === "undefined") {
        return Promise.resolve(null);
    }

    if (loadPromise) return loadPromise;

    loadPromise = new Promise(resolve => {
        const existing = document.querySelector(
            `script[src="${SDK_URL}"]`
        );

        const script = existing ?? document.createElement("script");
        let settled = false;
        let timeoutId = null;

        const finish = sdk => {
            if (settled) return;

            settled = true;

            if (timeoutId !== null) clearTimeout(timeoutId);

            const resolved = sdk ?? getGlobalSDK() ?? null;

            if (!resolved) loadPromise = null;

            resolve(resolved);
        };

        script.addEventListener("load", () => finish(getGlobalSDK()), {
            once: true
        });

        script.addEventListener("error", () => {
            script.remove();
            finish(null);
        }, { once: true });

        if (!existing) {
            script.src = SDK_URL;
            script.async = true;
            document.head.appendChild(script);
        }

        // Avoid waiting forever when the site is offline.
        timeoutId = setTimeout(
            () => finish(getGlobalSDK()),
            4000
        );
    });

    return loadPromise;
}

export function isInPlatform() {
    return getGlobalSDK()?.isInPlatform?.() === true;
}

export async function getPlayerName() {
    const sdk = await ensureSDK();

    if (!sdk || !sdk.isInPlatform?.()) return null;

    try {
        return await sdk.getPlayerName();
    } catch {
        return null;
    }
}

export async function submitScore(score, options = {}) {
    const sdk = await ensureSDK();

    if (!sdk || !Number.isFinite(score) || score < 0) return false;

    try {
        return sdk.submitScore(score, options) === true;
    } catch {
        return false;
    }
}

export async function submitRating(rating) {
    const sdk = await ensureSDK();

    if (!sdk) return false;

    try {
        return sdk.submitRating(rating) === true;
    } catch {
        return false;
    }
}

export async function getLeaderboard() {
    const sdk = await ensureSDK();

    if (!sdk || !sdk.isInPlatform?.()) return [];

    try {
        const rows = await sdk.getLeaderboard();

        return Array.isArray(rows) ? rows : [];
    } catch {
        return [];
    }
}

export async function shareScore(score, text) {
    const sdk = await ensureSDK();

    if (!sdk || !sdk.isInPlatform?.()) return null;

    try {
        return await sdk.shareScore(score, text);
    } catch {
        return null;
    }
}

export async function nextGame(options = {}) {
    const sdk = await ensureSDK();

    if (!sdk) return false;

    try {
        return sdk.nextGame(options) === true;
    } catch {
        return false;
    }
}

export async function openDetail() {
    const sdk = await ensureSDK();

    if (!sdk) return false;

    try {
        return sdk.openDetail() === true;
    } catch {
        return false;
    }
}

export const leleleSDK = {
    ensureSDK,
    isInPlatform,
    getPlayerName,
    submitScore,
    submitRating,
    getLeaderboard,
    shareScore,
    nextGame,
    openDetail
};
