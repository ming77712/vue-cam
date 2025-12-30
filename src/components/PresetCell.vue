<template>
  <div class="flex flex-wrap items-center gap-2">
    <div v-for="preset in presets" :key="preset.id" class="flex items-center gap-1">
      <el-checkbox
        :model-value="preset.checked"
        :disabled="!isAuthenticated"
        @update:model-value="(val: boolean) => handlePresetChange(preset.id, val)"
      />
      <span
        class="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
        @click="$emit('viewPreset', preset)"
      >
        {{ preset.name }}
      </span>
    </div>
    <!-- 管理者可以新增/編輯預置點 -->
    <div v-if="isAdmin" class="flex items-center gap-1">
      <el-button
        size="small"
        type="success"
        link
        @click="$emit('addPreset')"
      >
        新增
      </el-button>
      <el-button
        size="small"
        type="primary"
        link
        @click="$emit('editPresets')"
      >
        編輯
      </el-button>
    </div>
    <!-- 復原按鈕（與新增編輯按鈕區隔） -->
    <el-button
      size="small"
      type="warning"
      link
      @click="$emit('resetPresets')"
      :disabled="!isDirty"
    >
      復原
    </el-button>
  </div>
</template>

<script setup lang="ts">
import type { CameraPreset } from '../types/camera'

/**
 * 預置點欄位組件
 * 顯示預置點列表，提供勾選、查看、編輯和復原功能
 */

defineProps<{
  presets: CameraPreset[]
  isAuthenticated: boolean
  isAdmin: boolean
  isDirty: boolean
}>()

const emit = defineEmits<{
  presetChange: [presetId: number, checked: boolean]
  viewPreset: [preset: CameraPreset]
  editPresets: []
  addPreset: []
  resetPresets: []
}>()

/**
 * 處理預置點勾選狀態變更
 * @param presetId - 預置點 ID
 * @param checked - 是否勾選
 */
function handlePresetChange(presetId: number, checked: boolean): void {
  emit('presetChange', presetId, checked)
}
</script>

<style scoped></style>

