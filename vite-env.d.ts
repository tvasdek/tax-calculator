interface ImportMetaEnv {
  readonly VITE_N8N_API_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}