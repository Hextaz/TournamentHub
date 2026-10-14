import { describe, expect, it, vi } from "vitest";
import { Issuer, TokenSet } from "openid-client";
import { authOptions } from "../[...nextauth]/route";

function createDiscordClient() {
  const provider = authOptions.providers.find((entry) => entry.id === "discord");
  if (!provider || provider.type !== "oauth") {
    throw new Error("Discord OAuth provider is missing");
  }
  const issuerUrl = provider.options?.issuer ?? provider.issuer;
  if (!issuerUrl) {
    throw new Error("Discord OAuth issuer is missing");
  }
  const issuer = new Issuer({
    issuer: issuerUrl,
    token_endpoint: "https://discord.com/api/oauth2/token",
  });
  const client = new issuer.Client({ client_id: "test-client" });
  const exchange = vi.spyOn(client, "grant").mockResolvedValue(
    new TokenSet({ access_token: "test-token", token_type: "Bearer" }),
  );
  return { client, exchange };
}

describe("SEC-09: Discord OAuth issuer validation", () => {
  const callbackUrl = "https://tournament.hextaz.dev/api/auth/callback/discord";

  it("accepts the Discord issuer and exchanges the authorization code", async () => {
    const { client, exchange } = createDiscordClient();
    const tokens = await client.oauthCallback(callbackUrl, {
      code: "test-code", state: "test-state", iss: "https://discord.com",
    }, { state: "test-state" });

    expect(tokens.access_token).toBe("test-token");
    expect(exchange).toHaveBeenCalledWith(expect.objectContaining({
      code: "test-code", redirect_uri: callbackUrl,
    }), expect.anything());
  });

  it("rejects a different issuer before exchanging the code", async () => {
    const { client, exchange } = createDiscordClient();
    await expect(client.oauthCallback(callbackUrl, {
      code: "test-code", state: "test-state", iss: "https://untrusted.example",
    }, { state: "test-state" })).rejects.toThrow("iss mismatch");
    expect(exchange).not.toHaveBeenCalled();
  });

  it("rejects a mismatched state before exchanging the code", async () => {
    const { client, exchange } = createDiscordClient();
    await expect(client.oauthCallback(callbackUrl, {
      code: "test-code", state: "wrong-state", iss: "https://discord.com",
    }, { state: "test-state" })).rejects.toThrow("state mismatch");
    expect(exchange).not.toHaveBeenCalled();
  });
});
