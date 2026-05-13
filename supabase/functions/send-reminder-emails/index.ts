import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://lmuxnfneqmzcwoblmjzf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_dP0ZDU3sEN5oVpoDPtA_-A_Pz4oMxtX";

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("REMINDER_FROM_EMAIL") || "跟单提醒 <onboarding@resend.dev>";

  if (!resendApiKey) {
    return json({ error: "Missing RESEND_API_KEY" }, 500);
  }

  const { data: reminders, error } = await supabase
    .from("trade_reminders")
    .select("*")
    .lte("reminder_at", new Date().toISOString())
    .is("sent_at", null)
    .limit(50);

  if (error) return json({ error: error.message }, 500);

  let sent = 0;

  for (const reminder of reminders ?? []) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: reminder.recipient_email,
        subject: `跟单提醒：${reminder.order_no || reminder.stage}`,
        html: renderEmail(reminder),
      }),
    });

    if (!response.ok) continue;
    await supabase
      .from("trade_reminders")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", reminder.id);
    sent += 1;
  }

  return json({ sent });
});

function renderEmail(reminder: Record<string, string>) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1c2522">
      <h2>跟单提醒</h2>
      <p><strong>订单：</strong>${escapeHtml(reminder.order_no || "")}</p>
      <p><strong>客户：</strong>${escapeHtml(reminder.customer || "")}</p>
      <p><strong>产品：</strong>${escapeHtml(reminder.product || "")}</p>
      <p><strong>阶段：</strong>${escapeHtml(reminder.stage || "")}</p>
      <p><strong>事项：</strong>${escapeHtml(reminder.note || "需要跟进")}</p>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
