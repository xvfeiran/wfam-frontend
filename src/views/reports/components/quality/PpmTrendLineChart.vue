<script setup lang="ts">
import { Col, Row } from 'ant-design-vue'
import PpmTrendSingleChart from './PpmTrendSingleChart.vue'

defineProps<{
  buList: string[]
}>()
</script>

<template>
  <div class="ppm-trend-container">
    <Row :gutter="[0, 16]">
      <Col v-for="bu in buList" :key="bu" :span="24">
        <PpmTrendSingleChart :bu="bu" />
      </Col>
    </Row>
  </div>
</template>

<style scoped lang="less">
.ppm-trend-container {
  width: 100%;
}
</style>
