import test from "node:test";
import assert from "node:assert/strict";

function installWindow(sdk) {
    globalThis.window = sdk ? { LeleleSDK: sdk } : {};
}

test("SDK adapter forwards all documented calls", async () => {
    const calls = [];

    installWindow({
        isInPlatform: () => true,
        getPlayerName: async () => "Tester",
        submitScore: (score, options) => {
            calls.push(["score", score, options]);
            return true;
        },
        submitRating: rating => {
            calls.push(["rating", rating]);
            return true;
        },
        getLeaderboard: async () => [{ name: "A", score: 10 }],
        shareScore: async (score, text) => `share:${score}:${text}`,
        nextGame: options => {
            calls.push(["next", options]);
            return true;
        },
        openDetail: () => {
            calls.push(["detail"]);
            return true;
        }
    });

    const sdk = await import("../src/sdk.js?case=mock");

    assert.equal(sdk.isInPlatform(), true);
    assert.equal(await sdk.getPlayerName(), "Tester");
    assert.equal(await sdk.submitScore(100, { name: "Tester" }), true);
    assert.equal(await sdk.submitRating(4), true);
    assert.deepEqual(await sdk.getLeaderboard(), [
        { name: "A", score: 10 }
    ]);
    assert.equal(
        await sdk.shareScore(100, "done"),
        "share:100:done"
    );
    assert.equal(await sdk.nextGame({ category: "chess" }), true);
    assert.equal(await sdk.openDetail(), true);

    assert.deepEqual(calls.map(call => call[0]), [
        "score",
        "rating",
        "next",
        "detail"
    ]);
});

test("SDK adapter degrades safely and can retry loading", async () => {
    installWindow(null);

    const listeners = new Map();

    globalThis.document = {
        querySelector: () => null,
        head: {
            appendChild: script => {
                listeners.set("script", script);
            }
        },
        createElement: () => ({
            addEventListener(type, callback) {
                listeners.set(type, callback);
            },
            remove() {},
            set src(value) {
                this._src = value;
            },
            get src() {
                return this._src;
            },
            async: false
        })
    };

    const sdk = await import("../src/sdk.js?case=fallback");

    const ready = sdk.ensureSDK();

    listeners.get("load")?.();

    assert.equal(await ready, null);

    const settleNext = async promise => {
        listeners.get("load")?.();

        return promise;
    };

    assert.equal(await settleNext(sdk.submitScore(100)), false);
    assert.equal(await settleNext(sdk.submitRating(5)), false);
    assert.equal(await settleNext(sdk.nextGame()), false);
    assert.deepEqual(await settleNext(sdk.getLeaderboard()), []);
    assert.equal(await settleNext(sdk.shareScore(100)), null);
});
