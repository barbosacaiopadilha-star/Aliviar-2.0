type LimiarFilmErrorPayload = {
  src: string;
  reason: "asset_missing" | "playback_failed" | "load_failed";
};

export function logLimiarFilmError(payload: LimiarFilmErrorPayload): void {
  if (process.env.NODE_ENV === "production") {
    console.error("[limiar:film]", payload.reason, { src: payload.src });
    return;
  }

  console.warn("[limiar:film]", payload);
}
