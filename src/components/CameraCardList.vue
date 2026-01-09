<template>
  <div class="space-y-4">
    <el-collapse v-model="activeNames" class="camera-collapse">
      <el-collapse-item
        v-for="camera in cameras"
        :key="camera.CameraId"
        :name="camera.CameraId"
        :class="{ 'camera-card--dirty': isDirty(camera.CameraId) }"
      >
        <template #title>
          <div class="flex w-full items-center justify-between pr-4">
            <div class="flex items-center gap-2">
              <!-- 管理者可以選擇攝影機 -->
              <el-checkbox
                v-if="isAdmin"
                :model-value="selectedCameraIds.has(camera.CameraId)"
                @update:model-value="(val: boolean) => handleSelectionChange(camera.CameraId, val)"
                @click.stop
              />
              <span class="font-semibold text-gray-800">{{ camera.CameraName }}</span>
            </div>
            <el-tag v-if="isDirty(camera.CameraId)" type="warning" size="small">已修改</el-tag>
          </div>
        </template>

        <div class="space-y-3 p-4">
          <!-- 推播 -->
          <div class="flex items-center justify-between border-b border-gray-200 pb-3">
            <span class="text-sm font-medium text-gray-700">推播</span>
            <el-switch
              :model-value="camera.WantToBot"
              :disabled="!isAuthenticated"
              @update:model-value="(val: boolean) => $emit('pushEnabledChange', camera.CameraId, val)"
            />
          </div>

          <!-- 巡弋 -->
          <div class="flex items-center justify-between border-b border-gray-200 pb-3">
            <span class="text-sm font-medium text-gray-700">巡弋</span>
            <el-switch
              :model-value="camera.IsSpin"
              :disabled="!isAuthenticated"
              @update:model-value="(val: boolean) => $emit('isSpinChange', camera.CameraId, val)"
            />
          </div>

          <!-- 鎖定視角 -->
          <div class="flex items-center justify-between border-b border-gray-200 pb-3">
            <span class="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[5rem]">鎖定視角</span>
            <el-select
              :model-value="camera.IsLock ? camera.CurrentPointId : null"
              placeholder="未鎖定"
              clearable
              :disabled="!isAuthenticated"
              size="small"
              class="flex-1 w-full max-w-[12rem]"
              @change="(val: number | undefined) => $emit('lockViewChange', camera.CameraId, val)"
              @clear="() => $emit('lockViewChange', camera.CameraId, undefined)"
            >
              <el-option
                v-for="point in camera.CameraPoints"
                :key="point.CameraPointId"
                :label="point.CameraPointName"
                :value="point.CameraPointId"
              />
            </el-select>
          </div>

          <!-- 預置點 -->
          <div class="border-b border-gray-200 pb-3">
            <div class="mb-2">
              <span class="text-sm font-medium text-gray-700">預置點</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="preset in camera.CameraPoints"
                :key="preset.CameraPointId"
                class="flex items-center gap-1"
              >
                <el-checkbox
                  :model-value="preset.Checked"
                  :disabled="!isAuthenticated"
                  @update:model-value="
                    (val: boolean) => $emit('presetChange', camera.CameraId, preset.CameraPointId, val)
                  "
                />
                <span
                  class="cursor-pointer text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  @click="$emit('viewPreset', camera.CameraId, preset)"
                >
                  {{ preset.CameraPointName }}
                </span>
              </div>
            </div>
            <!-- 操作按鈕 -->
            <div class="mt-2 flex items-center gap-2">
              <el-button
                v-if="isAdmin"
                size="small"
                type="primary"
                link
                @click="$emit('editPresets', camera)"
              >
                編輯
              </el-button>
              <el-button
                size="small"
                type="warning"
                link
                @click="$emit('resetPresets', camera.CameraId)"
                :disabled="!isDirty(camera.CameraId)"
              >
                復原
              </el-button>
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { CameraItem, CameraPoint } from '../types/camera'
import { useEditableField } from '../composables'

/**
 * 攝影機卡片列表組件
 * 在小螢幕時以卡片摺疊方式顯示攝影機資料
 */

defineProps<{
  cameras: CameraItem[]
  isAuthenticated: boolean
  isAdmin: boolean
  isDirty: (cameraId: number) => boolean
  selectedCameraIds: Set<number>
}>()

const emit = defineEmits<{
  pushEnabledChange: [cameraId: number, enabled: boolean]
  presetChange: [cameraId: number, presetId: number, checked: boolean]
  viewPreset: [cameraId: number, preset: CameraPoint]
  editPresets: [camera: CameraItem]
  resetPresets: [cameraId: number]
  isSpinChange: [cameraId: number, isSpin: boolean]
  lockViewChange: [cameraId: number, presetId: number | undefined]
  selectionChange: [cameraId: number, selected: boolean]
}>()

// 預設展開第一個項目
const activeNames = ref<number[]>([])

/**
 * 處理攝影機選擇變更
 */
function handleSelectionChange(cameraId: number, selected: boolean): void {
  emit('selectionChange', cameraId, selected)
}
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
