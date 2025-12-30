<template>
  <div class="space-y-4">
    <el-collapse v-model="activeNames" class="camera-collapse">
      <el-collapse-item
        v-for="camera in cameras"
        :key="camera.id"
        :name="camera.id"
        :class="{ 'camera-card--dirty': isDirty(camera.id) }"
      >
        <template #title>
          <div class="flex w-full items-center justify-between pr-4">
            <span class="font-semibold text-gray-800">{{ camera.name }}</span>
            <el-tag v-if="isDirty(camera.id)" type="warning" size="small">已修改</el-tag>
          </div>
        </template>

        <div class="space-y-3 p-4">
          <!-- 是否推播 -->
          <div class="flex items-center justify-between border-b border-gray-200 pb-3">
            <span class="text-sm font-medium text-gray-700">是否推播</span>
            <el-switch
              :model-value="camera.pushEnabled"
              :disabled="!isAuthenticated"
              @update:model-value="(val: boolean) => $emit('pushEnabledChange', camera.id, val)"
            />
          </div>

          <!-- 轉向時間 -->
          <div class="flex items-center justify-between border-b border-gray-200 pb-3">
            <span class="text-sm font-medium text-gray-700">轉向時間 (秒)</span>
            <span class="text-sm text-gray-600">{{ camera.panTime }}</span>
          </div>

          <!-- 預置點 -->
          <div class="border-b border-gray-200 pb-3">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">預置點</span>
              <div class="flex items-center gap-2">
                <!-- 管理者可以新增/編輯預置點 -->
                <div v-if="isAdmin" class="flex items-center gap-1">
                  <el-button
                    size="small"
                    type="success"
                    link
                    @click="$emit('addPreset', camera)"
                  >
                    新增
                  </el-button>
                  <el-button
                    size="small"
                    type="primary"
                    link
                    @click="$emit('editPresets', camera)"
                  >
                    編輯
                  </el-button>
                </div>
                <!-- 復原按鈕（與新增編輯按鈕區隔） -->
                <el-button
                  size="small"
                  type="warning"
                  link
                  @click="$emit('resetPresets', camera.id)"
                  :disabled="!isDirty(camera.id)"
                >
                  復原
                </el-button>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="preset in camera.presets"
                :key="preset.id"
                class="flex items-center gap-1"
              >
                <el-checkbox
                  :model-value="preset.checked"
                  :disabled="!isAuthenticated"
                  @update:model-value="(val: boolean) => $emit('presetChange', camera.id, preset.id, val)"
                />
                <span
                  class="cursor-pointer text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  @click="$emit('viewPreset', camera.id, preset)"
                >
                  {{ preset.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { CameraItem, CameraPreset } from '../types/camera'

/**
 * 攝影機卡片列表組件（響應式）
 * 在小螢幕時以卡片摺疊方式顯示攝影機資料
 */

defineProps<{
  cameras: CameraItem[]
  isAuthenticated: boolean
  isAdmin: boolean
  isDirty: (cameraId: number) => boolean
}>()

defineEmits<{
  pushEnabledChange: [cameraId: number, enabled: boolean]
  presetChange: [cameraId: number, presetId: number, checked: boolean]
  viewPreset: [cameraId: number, preset: CameraPreset]
  editPresets: [camera: CameraItem]
  addPreset: [camera: CameraItem]
  resetPresets: [cameraId: number]
}>()

// 預設展開第一個項目
const activeNames = ref<number[]>([])
</script>

<style scoped>
.camera-collapse :deep(.el-collapse-item__header) {
  padding: 12px 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  margin-bottom: 8px;
}

.camera-collapse :deep(.camera-card--dirty .el-collapse-item__header) {
  background-color: #fff7d6;
}

.camera-collapse :deep(.el-collapse-item__content) {
  padding: 0;
  background-color: white;
  border-radius: 0 0 8px 8px;
}
</style>

