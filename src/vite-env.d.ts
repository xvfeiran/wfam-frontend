/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string
  readonly VITE_GATEWAY_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  $wujie?: {
    props?: {
      store?: {
        getters: Record<string, unknown>
      }
    }
  }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
