import { readonly, ref } from 'vue'

const DEV_MODE_KEY = 'wfam_dev_mode'

const initDevMode = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('dev') === '1') {
    sessionStorage.setItem(DEV_MODE_KEY, '1')
    return true
  }
  return sessionStorage.getItem(DEV_MODE_KEY) === '1'
}

const isDevMode = ref(initDevMode())

export function useDevMode() {
  return { isDevMode: readonly(isDevMode) }
}
