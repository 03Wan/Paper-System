# PaperHelper 部署说明

## Vercel 项目

- 项目名：`paperhelper`
- Git 仓库：`03Wan/Paper-System`
- 生产分支：`main`
- Root Directory：`frontend`
- Framework：Vite
- Build Command：`npm run build`
- Output Directory：`dist`

生产和预览环境均需配置以下服务端变量：

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=files
AUTH_TOKEN_SECRET=
```

`AUTH_TOKEN_SECRET` 必须是至少 32 字节的随机值。不要配置 `VITE_SUPABASE_ANON_KEY`、
`VITE_API_BASE_URL`，也不要把任何密钥提交到仓库。

## Supabase

项目使用 `apgnzbpmnoithipeunks`。按迁移顺序应用 `supabase/migrations/`，并以
`verify_jwt=true` 部署 `supabase/functions/detect-format`。浏览器不直接访问 Supabase；
数据库与私有 Storage 只允许 Vercel API 使用 Service Role 访问。

## 自定义域名

在 Vercel 项目中添加 `paperhelper.myboverse.com`，然后在 Cloudflare 添加 Vercel
页面给出的 CNAME：

```text
Type: CNAME
Name: paperhelper
Target: <Vercel 项目 Domains 页面显示的值>
Proxy status: DNS only
```

DNS 生效并由 Vercel 签发证书后，再进行登录、上传、检测、报告下载和管理员功能验收。
