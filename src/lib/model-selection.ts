"use client";

export type ModelProvider = "openai" | "anthropic" | "google";

export interface ModelSelection {
  provider: ModelProvider;
  model: string;
}

export const MODEL_OPTIONS: Record<ModelProvider, string[]> = {
  openai: ["gpt-4o", "gpt-4.1", "gpt-4.1-mini"],
  anthropic: ["claude-3-7-sonnet-latest", "claude-3-5-sonnet-latest"],
  google: ["gemini-2.0-flash", "gemini-1.5-pro"],
};

export const MODEL_SELECTION_STORAGE_KEY = "sre.model-selection.v1";

export function getDefaultModelSelection(): ModelSelection {
  return {
    provider: "openai",
    model: MODEL_OPTIONS.openai[0],
  };
}

export function getProviderModels(provider: ModelProvider): string[] {
  return MODEL_OPTIONS[provider] || [];
}

export function readModelSelection(): ModelSelection {
  if (typeof window === "undefined") {
    return getDefaultModelSelection();
  }

  const raw = window.localStorage.getItem(MODEL_SELECTION_STORAGE_KEY);
  if (!raw) {
    return getDefaultModelSelection();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ModelSelection>;
    if (!parsed.provider || !parsed.model) {
      return getDefaultModelSelection();
    }

    const provider = parsed.provider as ModelProvider;
    const models = getProviderModels(provider);
    if (!models.includes(parsed.model)) {
      return { provider, model: models[0] || getDefaultModelSelection().model };
    }

    return {
      provider,
      model: parsed.model,
    };
  } catch {
    return getDefaultModelSelection();
  }
}

export function writeModelSelection(selection: ModelSelection): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    MODEL_SELECTION_STORAGE_KEY,
    JSON.stringify(selection),
  );
}

export function buildModelAdditionalContext(selection: ModelSelection) {
  return {
    modelProvider: selection.provider,
    model: selection.model,
    modelSelection: selection,
  };
}
