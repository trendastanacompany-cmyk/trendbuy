import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ error: "Telegram not configured" }, { status: 500 });
  }

  let name = "";
  let phone = "";

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await req.json();
    name = String(body.name || "").trim();
    phone = String(body.phone || "").trim();
  } else {
    const form = await req.formData();
    name = String(form.get("name") || "").trim();
    phone = String(form.get("phone") || "").trim();
  }

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  const text = `📞 *Новая заявка с сайта*\n\n👤 Имя: ${name}\n📱 Телефон: ${phone}`;

  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });

  if (!tgRes.ok) {
    console.error("Telegram error:", await tgRes.text());
    return NextResponse.json({ error: "Failed to send message" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
