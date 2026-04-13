<template>
  <div class="help-manual">
    <a-page-header :title="t('dashboard.helpManual')" />

    <a-card>
      <a-alert
        type="info"
        show-icon
        :message="t('dashboard.helpHint')"
        style="margin-bottom: 16px"
      />

      <a-list :data-source="helpLinks" bordered>
        <template #renderItem="{ item }">
          <a-list-item>
            <a-space>
              <a-typography-text strong>{{ item.name }}</a-typography-text>
              <a-button type="link" @click="openLink(item.url)">
                {{ item.url }}
              </a-button>
            </a-space>
          </a-list-item>
        </template>
      </a-list>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'

const { t } = useI18n()

const helpLinks = [
  {
    name: t('dashboard.scrapWorkon'),
    url: 'https://rb-wam-ap.bosch.com/workon01ap/secure/CreateIssue.jspa?pid=10360&issuetype=162',
  },
  {
    name: t('dashboard.lessonsLearned'),
    url: 'https://cng-edlls.apac.bosch.com:10443/www/index.html#/',
  },
]

function openLink(url: string) {
  if (!url) {
    message.warning(t('dashboard.linkNotConfigured', { name: t('dashboard.helpManual') }))
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped lang="less">
.help-manual {
  padding: 24px;
}
</style>
