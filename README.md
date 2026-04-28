<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/174e4b96-0e95-4a4e-830b-d3daeedde682

## GitHub Pages

After enabling GitHub Pages in your repo settings, the site will be available at:

- https://yutongoh.github.io/Draw/

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## JiMeng (即梦) 智能美化（Cloudflare Worker 代理）

GitHub Pages 是纯静态站点，**不能安全地在前端直连 API Key**。因此“智能美化”通过一个代理服务调用即梦图生图接口，并一次返回 **3 张**（重绘程度：低/中/高）。

### 部署代理（Cloudflare Worker）

在仓库根目录执行：

```bash
cd workers/jimeng-proxy
npm install
wrangler secret put JIMENG_API_KEY
wrangler deploy
```

### 配置前端使用代理

在仓库根目录创建 `.env.local`：

```bash
VITE_JIMENG_PROXY_URL="https://<your-worker>.workers.dev"
```

然后 `npm run dev` 或重新构建发布即可。

### GitHub Pages（Actions 构建）需要设置 Secret

因为 Pages 是在 GitHub Actions 里构建的，请在仓库设置里新增一个 Secret：

- `JIMENG_PROXY_URL`: 你的 Worker 地址（例如 `https://<your-worker>.workers.dev`）

### Demo 最简方案（不推荐）：直接在前端使用 Key

如果你只是做 demo，不想部署 Worker，可以在 GitHub Secrets 里新增：

- `JIMENG_API_KEY`: 你的即梦 Key

工作流会把它注入为 `VITE_JIMENG_API_KEY`，前端将直接调用即梦接口并返回 3 张效果图。

重要：**这会把 Key 打进前端 JS 里，任何人都能拿到。仅限 demo。**

## Enable Pages (one-time)

1. Go to your repo **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Push to `main` (or re-run the workflow) and wait for the **Deploy to GitHub Pages** action to finish
