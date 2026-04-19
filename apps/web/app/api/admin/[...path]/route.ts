import { NextRequest, NextResponse } from "next/server";

const API_BASE = (
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000"
).replace(/\/+$/, "");

const ADMIN_KEY = process.env.ADMIN_API_KEY || "";

type Params = { path: string[] };

async function proxy(req: NextRequest, params: Params): Promise<NextResponse> {
  if (!ADMIN_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const target = `${API_BASE}/api/${params.path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  headers.set("x-admin-key", ADMIN_KEY);

  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: body ? Buffer.from(body) : undefined,
  });

  const responseBody = await upstream.arrayBuffer();
  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/json",
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  return proxy(req, await params);
}
export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  return proxy(req, await params);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<Params> }) {
  return proxy(req, await params);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<Params> }) {
  return proxy(req, await params);
}
