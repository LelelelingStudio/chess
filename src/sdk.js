import { platformSDK } from "./sdk.js";

// 初始化 SDK
await platformSDK.init();

// 获取玩家昵称
const name = await platformSDK.getPlayerName();

// 提交成绩
platformSDK.submitScore(1200, {
    name: name ?? undefined
});

// 获取排行榜
const leaderboard = await platformSDK.getLeaderboard();

// 分享成绩
const shareUrl = await platformSDK.shareScore(1200);