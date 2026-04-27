"use client";

import { useState } from "react";

type Props = {
  profileUrl: string;
};

export function ShareProfileButton({ profileUrl }: Props) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  async function onShare() {
    const targetUrl = profileUrl.startsWith("/")
      ? `${window.location.origin}${profileUrl}`
      : profileUrl;
    try {
      await navigator.clipboard.writeText(targetUrl);
      setState("copied");
      window.setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("error");
      window.setTimeout(() => setState("idle"), 2200);
    }
  }

  return (
    <button type="button" className="btnPrimary" onClick={onShare}>
      {state === "copied" ? "Link copied" : state === "error" ? "Copy failed" : "Share profile"}
    </button>
  );
}
