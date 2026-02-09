<template>
  <a-config-provider :locale="antdLocale">
    <router-view />
  </a-config-provider>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n, type I18n } from 'vue-i18n'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import enUS from 'ant-design-vue/es/locale/en_US'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'

const { locale } = useI18n()

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
