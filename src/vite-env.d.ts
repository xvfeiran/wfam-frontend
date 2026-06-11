/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string
  readonly VITE_GATEWAY_URL: string
  readonly VITE_AEP_LOGIN_URL: string
  readonly VITE_IQIS_URL?: string
  readonly VITE_SAP_URL?: string
  readonly VITE_REPORT_API_URL?: string
  readonly VITE_AEP_APP_NAME: string
  readonly VITE_AEP_APP_ID: string
  readonly VITE_AEP_TAB_PATH: string
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
  jump?: (aepPath: string, config: {
    appName: string
    path: string
    appId: number
  }, params?: Record<string, string>) => void
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
