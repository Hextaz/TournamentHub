import { describe, it, expect } from "vitest";
import { getErrorMessage, readApiError } from "../errors";

describe("getErrorMessage", () => {
  it("retourne le message d'une Error", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("retourne une chaîne telle quelle", () => {
    expect(getErrorMessage("échec")).toBe("échec");
  });

  it("retourne null pour une Error sans message ou une valeur inexploitable", () => {
    expect(getErrorMessage(new Error(""))).toBeNull();
    expect(getErrorMessage(undefined)).toBeNull();
    expect(getErrorMessage({ foo: 1 })).toBeNull();
  });
});

describe("readApiError", () => {
  it("extrait le champ error d'un corps JSON", async () => {
    const res = new Response(JSON.stringify({ error: "Accès refusé" }), { status: 403 });
    expect(await readApiError(res)).toBe("Accès refusé");
  });

  it("retourne le texte brut d'un corps non JSON", async () => {
    expect(await readApiError(new Response("Bad Gateway", { status: 502 }))).toBe("Bad Gateway");
  });

  it("retourne null pour un corps vide ou sans champ error exploitable", async () => {
    expect(await readApiError(new Response("", { status: 500 }))).toBeNull();
    expect(await readApiError(new Response(JSON.stringify({ success: false }), { status: 500 }))).toBeNull();
  });
});
