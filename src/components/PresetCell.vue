<template>
  <div class="preset-container">
    <!-- 預置點網格 -->
    <div class="preset-grid">
      <div
        v-for="index in maxPresets"
        :key="index"
        class="preset-cell"
        :class="{ 'preset-cell--empty': !getPresetByIndex(index) }"
      >
        <template v-if="getPresetByIndex(index)">
          <el-checkbox
            :model-value="getPresetByIndex(index)!.checked"
            :disabled="!isAuthenticated"
            @update:model-value="(val: boolean) => handlePresetChange(getPresetByIndex(index)!.id, val)"
          />
          <span
            class="preset-name cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
            @click="$emit('viewPreset', getPresetByIndex(index)!)"
          >
            {{ getPresetByIndex(index)!.name }}
          </span>
        </template>
        <template v-else>
          <!-- 空格 -->
          <span class="text-gray-400 text-sm">—</span>
        </template>
      </div>
    </div>

    <!-- 操作按鈕 -->
    <div class="preset-actions">
      <el-button v-if="isAdmin" size="small" type="primary" link @click="$emit('editPresets')">
        編輯
      </el-button>
      <el-button size="small" type="warning" link @click="$emit('resetPresets')" :disabled="!isDirty">
        復原
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CameraPreset } from '../types/camera'

/**
 * 預置點欄位組件
 * 以網格方式顯示預置點列表，提供勾選、查看、編輯和復原功能
 */

const props = defineProps<{
  presets: CameraPreset[]
  isAuthenticated: boolean
  isAdmin: boolean
  isDirty: boolean
  maxPresets?: number // 最大預置點數量，預設為 15
}>()

const emit = defineEmits<{
  presetChange: [presetId: number, checked: boolean]
  viewPreset: [preset: CameraPreset]
  editPresets: []
  resetPresets: []
}>()

/**
 * 最大預置點數量
 */
const maxPresets = computed(() => props.maxPresets || 15)

/**
 * 根據索引取得預置點
 * @param index - 索引（1-based）
 */
function getPresetByIndex(index: number): CameraPreset | undefined {
  return props.presets[index - 1]
}

/**
 * 處理預置點勾選狀態變更
 * @param presetId - 預置點 ID
 * @param checked - 是否勾選
 */
function handlePresetChange(presetId: number, checked: boolean): void {
  emit('presetChange', presetId, checked)
}
</script>

<style scoped>
.preset-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  gap: 0.25rem;
}

.preset-cell {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  background-color: #f9fafb;
  min-height: 2rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.preset-cell:hover:not(.preset-cell--empty) {
  background-color: #e5e7eb;
  border-color: #9ca3af;
}

.preset-cell--empty {
  background-color: #fafafa;
  justify-content: center;
  cursor: default;
}

.preset-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
}

.preset-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>
