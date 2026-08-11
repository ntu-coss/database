/**
 * @type {import('next').NextConfig}
 */
// GitHub Actions 會以 repo 名帶入 BASE_PATH（見 .github/workflows/deploy.yml）。
const basePath = process.env.BASE_PATH || '/database';

// 後端 API（社科院學生會官網的 Cloudflare Worker）。可用 env 覆寫指向 staging。
const apiBase = process.env.API_BASE || 'https://ntu-coss-api.ntusssa2.workers.dev';

// GA4 另開一組，未設定就不掛追蹤（不可沿用經濟資料庫那組）。
const gaId = process.env.NEXT_PUBLIC_GA_ID || '';

const nextConfig = {
    output: 'export',
    basePath: basePath,
    assetPrefix: "",
    env: {
        NEXT_PUBLIC_BASE_PATH: basePath,
        NEXT_PUBLIC_API_BASE: apiBase,
        NEXT_PUBLIC_GA_ID: gaId,
    },
}

module.exports = nextConfig
