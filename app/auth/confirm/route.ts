import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  const origin = url.origin;

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=link_invalido`);
  }

  return NextResponse.redirect(
    `${origin}/criar-senha?token_hash=${tokenHash}&type=${type}`
  );
}