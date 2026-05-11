<template>
  <a-card :title="t('partDetail.complaintInfo')" class="info-card">
    <a-form
      :model="form"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
    >
      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item
            :label="t('returnPart.repairStation')"
            name="repairStation"
          >
            <a-input
              v-model:value="form.repairStation"
              :placeholder="t('returnPart.repairStation')"
              allow-clear
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item
            :label="t('returnPart.complaintLocation')"
            name="complaintLocation"
          >
            <a-input
              v-model:value="form.complaintLocation"
              :placeholder="t('returnPart.complaintLocation')"
              allow-clear
            />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('returnPart.vehicleProductionDate')">
            <a-date-picker v-model:value="form.vehicleProductionDate" style="width: 100%" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('returnPart.vehiclePurchaseDate')">
            <a-date-picker v-model:value="form.vehiclePurchaseDate" style="width: 100%" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('returnPart.vehicleFailureDate')">
            <a-date-picker v-model:value="form.vehicleFailureDate" style="width: 100%" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :label="t('returnPart.vehicleVIN')">
            <a-input v-model:value="form.vehicleVIN" :placeholder="t('returnPart.vinPlaceholder')" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item :label="t('returnPart.vehicleMileage')">
            <a-input-number v-model:value="form.vehicleMileage" :min="0" style="width: 100%" suffix="km" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="24">
        <a-col :span="24">
          <a-form-item :label="t('returnPart.customerDescription')" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
            <a-textarea
              v-model:value="form.customerDescription"
              :placeholder="t('returnPart.customerDescPlaceholder')"
              :rows="3"
              show-count
              :maxlength="500"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="24">
        <a-col :span="24">
          <a-form-item :label="t('returnPart.otherDescription')" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
            <a-textarea
              v-model:value="form.otherDescription"
              :placeholder="t('returnPart.otherDescPlaceholder')"
              :rows="3"
              show-count
              :maxlength="500"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Dayjs } from 'dayjs'

interface Form {
  repairStation: string
  complaintLocation: string
  vehicleProductionDate: Dayjs | null
  vehiclePurchaseDate: Dayjs | null
  vehicleFailureDate: Dayjs | null
  vehicleVIN: string
  vehicleMileage?: number
  customerDescription: string
  otherDescription: string
}

interface Props {
  form: Form
}

defineProps<Props>()

const { t } = useI18n()
</script>

<style lang="less" scoped>
.info-card {
  margin-bottom: 16px;
}
</style>
