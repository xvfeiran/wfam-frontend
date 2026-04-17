<template>
  <a-dropdown>
    <a-button type="text" class="lang-btn">
      <GlobalOutlined />
      {{ currentLangLabel }}
      <DownOutlined />
    </a-button>
    <template #overlay>
      <a-menu @click="handleChange">
        <a-menu-item key="zh-CN">
          <span :class="{ active: locale === 'zh-CN' }">简体中文</span>
        </a-menu-item>
        <a-menu-item key="en-US">
          <span :class="{ active: locale === 'en-US' }">English</span>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { GlobalOutlined, DownOutlined } from '@ant-design/icons-vue'

const { locale } = useI18n()

const currentLangLabel = computed(() => {
  return locale.value === 'zh-CN' ? '中文' : 'EN'
})

const handleChange = ({ key }: { key: string }) => {
  locale.value = key
  localStorage.setItem('locale', key)
}
</script>

<style lang="less" scoped>
.lang-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;

  &:hover {
    color: #1677ff;
    background: rgba(22, 119, 255, 0.05);
  }
}

.active {
  color: #1677ff;
  font-weight: 500;
}
</style>
