interface ImportMetaEnv {
  readonly VITE_N8N_WEBHOOK_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}