/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string
  readonly VITE_GATEWAY_URL: string
  readonly VITE_AEP_LOGIN_URL: string
  readonly VITE_IQIS_URL?: string
  readonly VITE_SAP_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface WujieProps {
  userProfile?: {
    accessToken: string
    [key: string]: unknown
  }
  locale?: string
  token?: string
  [key: string]: unknown
}

interface WujieBus {
  $on: (event: string, callback: (...args: any[]) => void) => void
  $off: (event: string, callback: (...args: any[]) => void) => void
  $emit: (event: string, ...args: any[]) => void
}

interface Window {
  __POWERED_BY_WUJIE__?: boolean
  __WUJIE_MOUNT?: () => void
  __WUJIE_UNMOUNT?: () => void
  __WUJIE?: { mount: () => void }
  $wujie?: { props?: WujieProps; bus?: WujieBus }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
