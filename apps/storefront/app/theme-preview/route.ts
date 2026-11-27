import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { isStoreTheme, THEME_PREVIEW_COOKIE } from "@/lib/theme";

/**
 * Preview a shop design without changing it for anyone else:
 * /theme-preview?theme=minimal shows this browser the minimal design,
 * /theme-preview?exit=1 goes back to the live one.
 */
export async function GET(request: NextRequest) {
  const theme = request.nextUrl.searchParams.get("theme");
  const jar = await cookies();
  const draft = await draftMode();
  if (isStoreTheme(theme) && !request.nextUrl.searchParams.has("exit")) {
    draft.enable();
    jar.set(THEME_PREVIEW_COOKIE, theme, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 4,
    });
  } else {
    draft.disable();
    jar.delete(THEME_PREVIEW_COOKIE);
  }
  const next = request.nextUrl.searchParams.get("next");
  redirect(next?.startsWith("/") && !next.startsWith("//") ? next : "/");
}
