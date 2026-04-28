/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JIMENG_PROXY_URL?: string;
  readonly VITE_AI_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

