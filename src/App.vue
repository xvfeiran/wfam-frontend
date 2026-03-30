<template>
  <a-config-provider :locale="antdLocale">
    <router-view />
  </a-config-provider>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import enUS from 'ant-design-vue/es/locale/en_US'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'
import { useUserInfoStore } from '@/stores/userInfo'

const { locale } = useI18n()
const userInfoStore = useUserInfoStore()

// 将父应用的 locale（'zh'|'en'）映射为子应用的 locale（'zh-CN'|'en-US'）
const applyLocale = (parentLocale: string) => {
  locale.value = parentLocale === 'zh' ? 'zh-CN' : 'en-US'
}

onMounted(() => {
  if (window.__POWERED_BY_WUJIE__) {
    const props = window.$wujie?.props
    if (props) {
      // 保存父应用传入的 token
      if (props.userProfile?.accessToken) {
        userInfoStore.setToken(props.userProfile.accessToken)
      }
      // 初始语言同步（挂载时读取 props.locale）
      if (props.locale) {
        applyLocale(props.locale)
      }
    }
    // 监听父应用运行时动态切换语言的 bus 事件
    window.$wujie?.bus?.$on('locale', applyLocale)
  }
})

onUnmounted(() => {
  // 子应用卸载时注销监听，防止内存泄漏
  window.$wujie?.bus?.$off('locale', applyLocale)
})

const antdLocaleMap = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

const dayjsLocaleMap = {
  'zh-CN': 'zh-cn',
  'en-US': 'en',
}

const antdLocale = computed(() => antdLocaleMap[locale.value as keyof typeof antdLocaleMap] || zhCN)

// Update dayjs locale when i18n locale changes
watch(locale, (newLocale) => {
  const dayjsLocale = dayjsLocaleMap[newLocale as keyof typeof dayjsLocaleMap]
  if (dayjsLocale) {
    dayjs.locale(dayjsLocale)
  }
}, { immediate: true })
</script>

<style>
#app {
  height: 100%;
}
</style>
