import '@/utils/dayjs' // 全局注册 dayjs 时区（上海），必须先于业务代码执行
import { createApp, type App as VueApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { setupDevUserPersistence } from './stores/devUser'
import 'ant-design-vue/dist/reset.css'
import './styles/global.less'
import './plugins/echarts'

function mountApp(): VueApp {
  const pinia = createPinia()
  const app = createApp(App)
  app.use(pinia)
  app.use(router)
  app.use(Antd)
  app.use(i18n)

  // 设置开发用户持久化（仅在 dev 模式下生效）
  setupDevUserPersistence()

  app.mount('#app')
  return app
}

let app: VueApp | null = null

if (window.__POWERED_BY_WUJIE__) {
  // 子应用模式：挂载/卸载由无界框架驱动
  window.__WUJIE_MOUNT = () => {
    app = mountApp()
  }
  window.__WUJIE_UNMOUNT = () => {
    app?.unmount()
    app = null
  }
  window.__WUJIE?.mount()
} else {
  // 独立运行模式（调试或本地开发）
  mountApp()
}
