<template>
  <div class="help-manual">
    <a-page-header
      :title="t('dashboard.helpManual')"
      :sub-title="t('help.lastUpdated')"
    />

    <a-row :gutter="16" class="manual-body">
      <!-- 左侧目录 -->
      <a-col :xs="0" :md="6" :lg="5">
        <a-card class="toc-card" :bordered="false">
          <a-anchor :target-offset="80" :items="tocItems" />
        </a-card>
      </a-col>

      <!-- 右侧正文 -->
      <a-col :xs="24" :md="18" :lg="19">
        <a-card class="content-card">

          <section id="overview">
            <a-typography-title :level="2">{{ t('help.sec.overview') }}</a-typography-title>
            <a-typography-paragraph>
              {{ t('help.overviewDesc') }}
            </a-typography-paragraph>
            <pre class="flow">{{ t('help.flow') }}</pre>
            <a-typography-paragraph>
              <ul>
                <li>{{ t('help.login') }}</li>
                <li>{{ t('help.browser') }}</li>
              </ul>
            </a-typography-paragraph>
          </section>

          <a-divider />

          <section id="roles">
            <a-typography-title :level="2">{{ t('help.sec.roles') }}</a-typography-title>
            <a-typography-paragraph>{{ t('help.rolesDesc') }}</a-typography-paragraph>
            <a-table
              :columns="roleColumns"
              :data-source="roles"
              :pagination="false"
              size="small"
              :bordered="true"
            />
          </section>

          <a-divider />

          <section id="dashboard">
            <a-typography-title :level="2">{{ t('help.sec.dashboard') }}</a-typography-title>
            <ul>
              <li><strong>{{ t('help.dash.statCards') }}</strong>：{{ t('help.dash.statCardsDesc') }}</li>
              <li><strong>{{ t('help.dash.trend') }}</strong>：{{ t('help.dash.trendDesc') }}</li>
              <li><strong>{{ t('help.dash.tasks') }}</strong>：{{ t('help.dash.tasksDesc') }}</li>
              <li><strong>{{ t('help.dash.shortcuts') }}</strong>：{{ t('help.dash.shortcutsDesc') }}</li>
            </ul>
          </section>

          <a-divider />

          <section id="return-order">
            <a-typography-title :level="2">{{ t('help.sec.returnOrder') }}</a-typography-title>
            <a-typography-title :level="4">{{ t('help.ro.listTitle') }}</a-typography-title>
            <a-typography-paragraph>{{ t('help.ro.listDesc') }}</a-typography-paragraph>

            <a-typography-title :level="4">{{ t('help.ro.createTitle') }}</a-typography-title>
            <a-typography-paragraph>{{ t('help.ro.createDesc') }}</a-typography-paragraph>
            <ul>
              <li>{{ t('help.ro.express') }}</li>
              <li>{{ t('help.ro.baType') }}</li>
              <li>{{ t('help.ro.buttons') }}</li>
            </ul>

            <a-typography-title :level="4">{{ t('help.ro.detailTitle') }}</a-typography-title>
            <ul>
              <li>{{ t('help.ro.finishEntry') }}</li>
              <li>{{ t('help.ro.delete') }}</li>
            </ul>
          </section>

          <a-divider />

          <section id="part">
            <a-typography-title :level="2">{{ t('help.sec.part') }}</a-typography-title>
            <a-typography-title :level="4">{{ t('help.part.createTitle') }}</a-typography-title>
            <ul>
              <li><strong>{{ t('help.part.basic') }}</strong>：{{ t('help.part.basicDesc') }}</li>
              <li><strong>{{ t('help.part.complaint') }}</strong>：{{ t('help.part.complaintDesc') }}</li>
              <li><strong>{{ t('help.part.vehicle') }}</strong>：{{ t('help.part.vehicleDesc') }}</li>
            </ul>
            <a-typography-paragraph>
              <ul>
                <li>{{ t('help.part.buttons') }}</li>
                <li>{{ t('help.part.noRule') }}</li>
                <li>{{ t('help.part.photos') }}</li>
              </ul>
            </a-typography-paragraph>

            <a-typography-title :level="4">{{ t('help.part.detailTitle') }}</a-typography-title>
            <ul>
              <li>{{ t('help.part.detailDesc') }}</li>
              <li>{{ t('help.part.qc') }}</li>
              <li>{{ t('help.part.analysisBtn') }}</li>
            </ul>
          </section>

          <a-divider />

          <section id="analysis-order">
            <a-typography-title :level="2">{{ t('help.sec.analysisOrder') }}</a-typography-title>
            <a-typography-paragraph>{{ t('help.ao.desc') }}</a-typography-paragraph>

            <a-typography-title :level="4">{{ t('help.ao.samplingTitle') }}</a-typography-title>
            <a-typography-paragraph>{{ t('help.ao.samplingDesc') }}</a-typography-paragraph>
            <ul>
              <li><strong>{{ t('help.ao.standard') }}</strong>：{{ t('help.ao.standardDesc') }}</li>
              <li><strong>{{ t('help.ao.designated') }}</strong>：{{ t('help.ao.designatedDesc') }}</li>
              <li><strong>{{ t('help.ao.noSampling') }}</strong>：{{ t('help.ao.noSamplingDesc') }}</li>
            </ul>
            <a-alert type="warning" :message="t('help.ao.samplingNote')" style="margin: 8px 0" />

            <a-typography-title :level="4">{{ t('help.ao.scrapTitle') }}</a-typography-title>
            <a-typography-paragraph>{{ t('help.ao.scrapDesc') }}</a-typography-paragraph>
          </section>

          <a-divider />

          <section id="report">
            <a-typography-title :level="2">{{ t('help.sec.report') }}</a-typography-title>
            <a-typography-paragraph>{{ t('help.report.desc') }}</a-typography-paragraph>
            <ul>
              <li>{{ t('help.report.buttons') }}</li>
            </ul>
          </section>

          <a-divider />

          <section id="approval">
            <a-typography-title :level="2">{{ t('help.sec.approval') }}</a-typography-title>
            <a-typography-paragraph>{{ t('help.approval.desc') }}</a-typography-paragraph>
            <ul>
              <li><strong>{{ t('help.approval.mine') }}</strong>：{{ t('help.approval.mineDesc') }}</li>
              <li><strong>{{ t('help.approval.todo') }}</strong>：{{ t('help.approval.todoDesc') }}</li>
            </ul>
          </section>

          <a-divider />

          <section id="others">
            <a-typography-title :level="2">{{ t('help.sec.others') }}</a-typography-title>
            <ul>
              <li><strong>{{ t('help.others.reports') }}</strong>：{{ t('help.others.reportsDesc') }}</li>
              <li><strong>{{ t('help.others.import') }}</strong>：{{ t('help.others.importDesc') }}</li>
              <li><strong>{{ t('help.others.config') }}</strong>：{{ t('help.others.configDesc') }}</li>
            </ul>
          </section>

          <a-divider />

          <section id="status">
            <a-typography-title :level="2">{{ t('help.sec.status') }}</a-typography-title>
            <a-typography-paragraph type="secondary">{{ t('help.status.note') }}</a-typography-paragraph>

            <a-typography-title :level="4">{{ t('help.status.roTitle') }}</a-typography-title>
            <a-typography-paragraph><code>draft → submitted → registered → scrapped</code></a-typography-paragraph>

            <a-typography-title :level="4">{{ t('help.status.partTitle') }}</a-typography-title>
            <a-table
              :columns="statusColumns"
              :data-source="partStatus"
              :pagination="false"
              size="small"
              :bordered="true"
            />

            <a-typography-title :level="4" style="margin-top:16px">{{ t('help.status.aoTitle') }}</a-typography-title>
            <a-table
              :columns="statusColumns"
              :data-source="aoStatus"
              :pagination="false"
              size="small"
              :bordered="true"
            />

            <a-typography-title :level="4" style="margin-top:16px">{{ t('help.status.reportTitle') }}</a-typography-title>
            <a-typography-paragraph>
              <code>draft → submitted → approved / rejected / withdrawn</code>
            </a-typography-paragraph>
          </section>

          <a-divider />

          <section id="faq">
            <a-typography-title :level="2">{{ t('help.sec.faq') }}</a-typography-title>
            <a-collapse :bordered="false">
              <a-collapse-panel
                v-for="(item, idx) in faqs"
                :key="idx"
                :header="item.q"
              >
                <p>{{ item.a }}</p>
              </a-collapse-panel>
            </a-collapse>
          </section>

          <a-divider />

          <section id="links">
            <a-typography-title :level="2">{{ t('help.sec.links') }}</a-typography-title>
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
          </section>

        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'

const { t } = useI18n()

const tocItems = [
  { id: 'overview', key: 'overview' },
  { id: 'roles', key: 'roles' },
  { id: 'dashboard', key: 'dashboard' },
  { id: 'return-order', key: 'returnOrder' },
  { id: 'part', key: 'part' },
  { id: 'analysis-order', key: 'analysisOrder' },
  { id: 'report', key: 'report' },
  { id: 'approval', key: 'approval' },
  { id: 'others', key: 'others' },
  { id: 'status', key: 'status' },
  { id: 'faq', key: 'faq' },
  { id: 'links', key: 'links' },
].map((it) => ({ key: it.id, href: `#${it.id}`, title: t(`help.sec.${it.key}`) }))

const roleColumns = [
  { title: t('help.col.role'), dataIndex: 'name', key: 'name' },
  { title: t('help.col.permission'), dataIndex: 'perm', key: 'perm' },
]

const roles = [
  { key: '1', name: t('help.role.cq'), perm: t('help.role.cqPerm') },
  { key: '2', name: t('help.role.analyst'), perm: t('help.role.analystPerm') },
  { key: '3', name: t('help.role.leader'), perm: t('help.role.leaderPerm') },
  { key: '4', name: t('help.role.manager'), perm: t('help.role.managerPerm') },
  { key: '5', name: t('help.role.visitor'), perm: t('help.role.visitorPerm') },
  { key: '6', name: t('help.role.admin'), perm: t('help.role.adminPerm') },
]

const statusColumns = [
  { title: t('help.col.status'), dataIndex: 'value', key: 'value' },
  { title: t('help.col.label'), dataIndex: 'label', key: 'label' },
]

const partStatus = [
  { key: '1', value: 'draft', label: t('help.label.draft') },
  { key: '2', value: 'submitted', label: t('help.label.submitted') },
  { key: '3', value: 'in_initial_analysis', label: t('help.label.inInitialAnalysis') },
  { key: '4', value: 'initial_analysis_completed', label: t('help.label.initialAnalysisCompleted') },
  { key: '5', value: 'pending_approval', label: t('help.label.pendingApproval') },
  { key: '6', value: 'analysis_completed', label: t('help.label.analysisCompleted') },
  { key: '7', value: 'analysis_skipped', label: t('help.label.analysisSkipped') },
  { key: '8', value: 'scrap_in_progress', label: t('help.label.scrapInProgress') },
  { key: '9', value: 'scrapped', label: t('help.label.scrapped') },
]

const aoStatus = [
  { key: '1', value: 'pending_sampling', label: t('help.label.pendingSampling') },
  { key: '2', value: 'in_detailed_analysis', label: t('help.label.inDetailedAnalysis') },
  { key: '3', value: 'analysis_completed', label: t('help.label.aoCompleted') },
  { key: '4', value: 'analysis_skipped', label: t('help.label.analysisSkipped') },
  { key: '5', value: 'workon_scrap_in_progress', label: t('help.label.workonScrapInProgress') },
  { key: '6', value: 'workon_scrapped', label: t('help.label.scrapped') },
  { key: '7', value: 'scrap_in_progress', label: t('help.label.scrapInProgress') },
  { key: '8', value: 'scrapped', label: t('help.label.scrapped') },
]

const faqs = [
  { q: t('help.faq.q1'), a: t('help.faq.a1') },
  { q: t('help.faq.q2'), a: t('help.faq.a2') },
  { q: t('help.faq.q3'), a: t('help.faq.a3') },
  { q: t('help.faq.q4'), a: t('help.faq.a4') },
  { q: t('help.faq.q5'), a: t('help.faq.a5') },
]

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
  padding: 0 0 24px;
}

.manual-body {
  margin: 0 !important;
  padding: 0 16px;
}

.toc-card {
  position: sticky;
  top: 16px;
}

.content-card {
  max-width: 960px;
}

pre.flow {
  background: #f5f5f5;
  padding: 12px 16px;
  border-radius: 6px;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 13px;
  white-space: pre-wrap;
  margin: 8px 0 16px;
}

code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 13px;
}

:deep(.ant-typography h2.ant-typography) {
  margin-top: 8px;
}
</style>
