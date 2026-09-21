import { NextResponse } from "next/server";
import { isRemoteDatabase } from "@/db/client";

type AppError = Error & { status?: number };

function readStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const status = (error as AppError).status;
  return typeof status === "number" ? status : null;
}

export function jsonError(error: unknown) {
  const status = readStatus(error);
  if (status && error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status });
  }
  console.error(error);
  const message = error instanceof Error ? error.message : "Something went wrong.";
  const hint =
    process.env.VERCEL && !isRemoteDatabase()
      ? " For persistent storage on Vercel, add TURSO_DATABASE_URL (see README)."
      : "";
  return NextResponse.json({ error: message + hint }, { status: 500 });
}
