import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const body = await req.json().catch(() => ({}));
  const reminders = Array.isArray(body.reminders) ? body.reminders : [];
  const rows = reminders
    .map(normalizeReminder)
    .filter(Boolean);

  if (!rows.length) {
    return json({ synced: 0 });
  }

  const { error } = await supabase
    .from("trade_reminders")
    .upsert(rows, { onConflict: "client_id" });

  if (error) return json({ error: error.message }, 500);
  return json({ synced: rows.length });
});

function normalizeReminder(input: Record<string, unknown>) {
  const recipientEmail = String(input.recipient_email || "").trim();
  const clientId = String(input.client_id || "").trim();
  const reminderAt = new Date(String(input.reminder_at || ""));
  if (!recipientEmail || !clientId || Number.isNaN(reminderAt.getTime())) return null;
  return {
    client_id: clientId,
    recipient_email: recipientEmail,
    order_no: String(input.order_no || ""),
    customer: String(input.customer || ""),
    product: String(input.product || ""),
    stage: String(input.stage || "跟进"),
    reminder_at: reminderAt.toISOString(),
    note: String(input.note || ""),
    sent_at: null,
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
