import { readonly, ref } from 'vue'

const DEV_MODE_KEY = 'wfam_dev_mode'

const initDevMode = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search)
  const fromUrl = urlParams.get('dev') === '1'
  const fromStorage = sessionStorage.getItem(DEV_MODE_KEY) === '1'
  if (fromUrl) {
    sessionStorage.setItem(DEV_MODE_KEY, '1')
  }
  const result = fromUrl || fromStorage
  // [WFAM-PERM Boundary A] dev 模式判定来源
  console.log(
    `[WFAM-PERM A] isDevMode=${result} | fromUrl(?dev=1)=${fromUrl} | fromStorage=${fromStorage} | wujie=${!!window.__POWERED_BY_WUJIE__} | href=${window.location.href}`,
  )
  return result
}

const isDevMode = ref(initDevMode())

export function useDevMode() {
  return { isDevMode: readonly(isDevMode) }
}
