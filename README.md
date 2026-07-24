# 论文格式审查系统

一个面向 `.docx` 论文的格式审查与辅助规范化系统。项目提供 Vue 前端、Vercel API、Supabase 数据库与存储配置，以及可独立运行的 Python 格式检测工具。

## 功能

- 检测页边距、纸张大小、页眉页脚、页码和分节。
- 检测标题层级、编号与字体格式。
- 检测正文的字体、字号、行距、首行缩进、对齐方式和段前段后间距。
- 检测图表题注、目录与参考文献编号、格式和完整性。
- 生成检测记录、历史记录和 CSV 报告；支持管理员管理用户和格式模板。
- 对可安全确认的问题执行 DOCX 自动格式化。

## 项目结构

```text
frontend/                 Vue 3 + Vite 前端与 Vercel API 实现
api/                      根目录 Vercel API 入口
supabase/                 Supabase 数据库、存储和 Edge Function 脚本
sql/mysql/                MySQL 初始化与演示数据（可选）
word_format_checker.py    本地 DOCX 格式检测器
word_auto_formatter.py    本地 DOCX 自动格式化器
tests/                    检测器的样本与准确率测试
```

## 本地运行

### 前端

需要 Node.js 18 或更高版本。

```powershell
cd frontend
npm install
npm run dev
```

也可以在项目根目录运行 `start_all.ps1`（或双击 `start_all.bat`）启动前端。

### Python 检测器

需要 Python 3.10 或更高版本，以及 `python-docx`：

```powershell
python -m pip install python-docx
python word_format_checker.py tests/samples/correct.docx
python tests/test_accuracy.py
```

自动格式化会在指定输出目录创建新文件，不会修改原始文档：

```python
from word_auto_formatter import auto_format_docx

result = auto_format_docx("input.docx", "outputs")
print(result["output_path"])
```

## Supabase 配置

在 Supabase 项目中依次执行：

1. `supabase/schema.sql`
2. `supabase/storage_setup.sql`
3. `supabase/seed.sql`（可选的初始数据）

部署 Edge Function `supabase/functions/detect-format`，并为 Vercel API 配置以下环境变量：

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=files
```

前端如需直接访问 Supabase，可额外配置 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`。不要将服务角色密钥提交到仓库或暴露给浏览器。

## 部署

项目根目录的 `vercel.json` 将 `/api/*` 请求重写至 Vercel API。将仓库根目录作为 Vercel 项目根目录部署，并按上述说明配置环境变量。

## 许可证

本项目采用 [MIT License](LICENSE)。
