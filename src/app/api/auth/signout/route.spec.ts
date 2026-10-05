import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { destroySession } from "@/lib/auth/session";

vi.mock("@/lib/auth/session", () => ({
  destroySession: vi.fn(),
}));

describe("POST /api/auth/signout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve destruir a sessão e retornar 200", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ ok: true });
    expect(destroySession).toHaveBeenCalledTimes(1);
  });
});
