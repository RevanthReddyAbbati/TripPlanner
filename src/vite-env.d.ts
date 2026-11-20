/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional AI proxy URL baked in at build time (see proxy/README.md). */
  readonly VITE_AI_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
