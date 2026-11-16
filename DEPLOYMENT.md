# 部署与本地运行

## 本机运行

安装前后端依赖并配置 `backend/.env` 后，在项目根目录执行：

```powershell
npm --prefix frontend run build
npm --prefix backend start
```

访问 `http://localhost:5000/ai-virtual/#/login`。前端默认使用同源 `/api`，
后端同时提供页面和接口。前端开发服务器也会把 `/api`、`/uploads` 代理到本机 5000 端口。

演示数据库仅在未配置 `MONGO_URI` 且启用 `DEMO_EMBEDDED_DB=true` 时使用，
数据目录为 `backend/.demo-data`。后端密钥只放在本机或托管平台的环境变量中。

## GitHub Pages

页面入口为 `https://gaogirl.github.io/ai-virtual/#/login`。
页面路由使用 `#`，避免刷新子页面时请求 GitHub Pages 上不存在的目录。
旧的根目录地址 `/student/courses` 应改为 `/ai-virtual/#/student/courses`。

GitHub Pages 只托管前端。发布前必须先运行一个外部可访问的 HTTPS 后端，
确认 `/api/health` 正常，再设置仓库 Actions 变量 `VITE_API_URL`。
该变量可填写后端域名或包含 `/api` 的完整接口前缀；普通请求和 AI 请求会共用这个地址。
变量只包含公开地址，不能放入 API 密钥。

工作流在变量缺失时跳过发布，不是 HTTPS 地址时停止构建，避免继续发布失效的默认后端地址。
设置变量后推送 `master`，或手动运行 Deploy to GitHub Pages 工作流，
等待 Actions 和 GitHub Pages 发布完成，并实际验证登录、班级加载及刷新。

如果使用本机加隧道提供后端，电脑、数据库、服务和隧道都必须持续运行。
免费临时隧道可能到期或更换域名；地址变化后需要更新 `VITE_API_URL` 并重新发布前端。
长期使用应配置固定域名隧道或部署到持久云服务。

## 验证范围

执行 `npm --prefix frontend run lint`、`npm --prefix frontend run build`
和 `node --check backend/server.js`，再验证学生、教师页面以及登录失败提示。
AI 流式输出需要另行验证真实上游服务；浏览器模拟流不能替代真实 AI 验收。
