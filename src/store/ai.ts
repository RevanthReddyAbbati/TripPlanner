// AI connection settings. Kept in its own storage key so trip backups never include the API key.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AIMode = 'off' | 'key' | 'proxy';

export const DEFAULT_MODEL = 'gemini-3.6-flash';

/** Known model IDs from Google's docs (Nov 2026). "Load my models" in Settings fetches the live list. */
export const SUGGESTED_MODELS = [
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', note: 'Fast and capable. Recommended.' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', note: 'Newest Flash model.' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite', note: 'Cheapest and fastest.' },
  { id: 'gemini-4-argon', label: 'Gemini 4 Argon', note: 'Most capable, slower and pricier.' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', note: 'Older, widely available.' },
];

interface AIState {
  mode: AIMode;
  /** Personal Gemini API key, used only in "key" mode. Stays in this browser. */
  apiKey: string;
  /** Base URL of a proxy that adds the key server-side, used in "proxy" mode. */
  proxyUrl: string;
  model: string;
  /** Models returned by the account's live model list, if loaded. */
  availableModels: string[];
  set: (p: Partial<Omit<AIState, 'set' | 'clearKey'>>) => void;
  clearKey: () => void;
}

/** Proxy URL baked in at build time (VITE_AI_PROXY_URL), so a deployed site can offer AI to everyone. */
const BUILD_PROXY = (import.meta.env.VITE_AI_PROXY_URL as string | undefined)?.trim() ?? '';

export const useAI = create<AIState>()(
  persist(
    (set) => ({
      mode: BUILD_PROXY ? 'proxy' : 'off',
      apiKey: '',
      proxyUrl: BUILD_PROXY,
      model: DEFAULT_MODEL,
      availableModels: [],
      set: (p) => set(p),
      clearKey: () => set({ apiKey: '', mode: BUILD_PROXY ? 'proxy' : 'off' }),
    }),
    { name: 'itinera-ai', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

export function aiReady(s: Pick<AIState, 'mode' | 'apiKey' | 'proxyUrl'> = useAI.getState()): boolean {
  if (s.mode === 'key') return s.apiKey.trim().length > 20;
  if (s.mode === 'proxy') return /^https:\/\//.test(s.proxyUrl.trim());
  return false;
}

export function useAIReady(): boolean {
  const mode = useAI((s) => s.mode);
  const apiKey = useAI((s) => s.apiKey);
  const proxyUrl = useAI((s) => s.proxyUrl);
  return aiReady({ mode, apiKey, proxyUrl });
}
