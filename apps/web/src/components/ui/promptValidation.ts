export interface PromptValidationRules {
  inputType: "text" | "number";
  min?: number;
  max?: number;
}

/** Une saisie de PromptModal est soumissible si elle est non vide et, pour un nombre, entière et dans les bornes incluses. */
export function validatePromptValue(value: string, { inputType, min, max }: PromptValidationRules): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (inputType === "text") return true;

  if (!/^-?\d+$/.test(trimmed)) return false;
  const numVal = Number(trimmed);
  if (min !== undefined && numVal < min) return false;
  if (max !== undefined && numVal > max) return false;
  return true;
}
