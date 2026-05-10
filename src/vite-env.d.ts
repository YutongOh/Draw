/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JIMENG_PROXY_URL?: string;
  readonly VITE_AI_PROXY_URL?: string;
  readonly VITE_JIMENG_API_KEY?: string;
  readonly VITE_VOLC_ACCESS_KEY_ID?: string;
  readonly VITE_VOLC_SECRET_ACCESS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

