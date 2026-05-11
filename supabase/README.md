# 邮箱提醒后端

当前网页本身是静态站点。网页关闭后仍要发提醒，需要部署 Supabase Edge Functions，并用 Resend 发邮件。

## 需要准备

- Supabase 项目
- Resend API Key
- 一个发件邮箱，测试时可先用 `Trade Tracker <onboarding@resend.dev>`

## 部署步骤

1. 在 Supabase SQL Editor 执行 `migrations/001_reminder_email_schema.sql`。
2. 部署两个 Edge Functions：

```bash
npx supabase functions deploy sync-reminders --project-ref YOUR_PROJECT_REF
npx supabase functions deploy send-reminder-emails --project-ref YOUR_PROJECT_REF
```

3. 设置函数密钥：

```bash
npx supabase secrets set RESEND_API_KEY=YOUR_RESEND_KEY --project-ref YOUR_PROJECT_REF
npx supabase secrets set REMINDER_FROM_EMAIL="Trade Tracker <onboarding@resend.dev>" --project-ref YOUR_PROJECT_REF
```

4. 在 SQL Editor 里按迁移文件底部注释创建 cron job，让 Supabase 每分钟调用 `send-reminder-emails`。
5. 回到网页，在“邮箱提醒”里填写：
   - 接收邮箱
   - `https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-reminders`
   - Supabase anon key

点击“同步邮箱提醒”后，网页关闭也能由 Supabase 定时发邮件。
