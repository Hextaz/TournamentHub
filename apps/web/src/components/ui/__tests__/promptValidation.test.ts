import { describe, it, expect } from "vitest";
import { validatePromptValue } from "../promptValidation";

describe("validatePromptValue", () => {
  it("refuse une saisie vide ou composée d'espaces", () => {
    expect(validatePromptValue("", { inputType: "text" })).toBe(false);
    expect(validatePromptValue("   ", { inputType: "text" })).toBe(false);
  });

  it("accepte un texte non vide", () => {
    expect(validatePromptValue("CLOTURER", { inputType: "text" })).toBe(true);
  });

  it("refuse une valeur non numérique pour un champ nombre", () => {
    expect(validatePromptValue("abc", { inputType: "number" })).toBe(false);
  });

  it("refuse les décimales pour un champ nombre", () => {
    expect(validatePromptValue("8.5", { inputType: "number", min: 1, max: 128 })).toBe(false);
  });

  it("applique les bornes min et max incluses", () => {
    const bounds = { inputType: "number", min: 1, max: 128 } as const;
    expect(validatePromptValue("0", bounds)).toBe(false);
    expect(validatePromptValue("1", bounds)).toBe(true);
    expect(validatePromptValue("128", bounds)).toBe(true);
    expect(validatePromptValue("129", bounds)).toBe(false);
  });

  it("accepte un entier sans bornes", () => {
    expect(validatePromptValue("-3", { inputType: "number" })).toBe(true);
  });
});
