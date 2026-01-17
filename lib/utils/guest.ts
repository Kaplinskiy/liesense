import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export function getOrCreateGuestId(candidate?: string) {
  const store = cookies();
  const existing = store.get("guest_id");
  if (existing?.value) return existing.value;
  const newId = candidate ?? randomUUID();
  store.set("guest_id", newId, { httpOnly: false, sameSite: "lax", path: "/" });
  return newId;
}
