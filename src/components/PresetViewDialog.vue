<template>
  <el-dialog
    :model-value="visible"
    title="預置點視角與可視圖"
    :width="dialogWidth"
    class="preset-view-dialog"
    @update:model-value="(val: boolean) => $emit('update:visible', val)"
  >
    <div v-if="presetView" class="space-y-4">
      <div>
        <h3 class="mb-2 text-lg font-semibold text-gray-800">
          {{ presetView.presetName }} - {{ presetView.cameraName }}
        </h3>
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div class="mb-2 flex items-center justify-between">
            <h4 class="text-sm font-medium text-gray-700">視角圖</h4>
            <el-upload
              v-if="isAdmin"
              :show-file-list="false"
              :before-upload="(file: File) => handleImageUpload(file, 'view')"
              accept="image/*"
              class="inline-block"
            >
              <el-button size="small" type="primary" link>上傳</el-button>
            </el-upload>
          </div>
          <div
            class="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <img
              :src="viewImage.imageData.value.previewUrl || presetView?.viewImage || getPlaceholderImage('view')"
              :alt="`${presetView?.presetName} 視角圖`"
              class="max-h-64 w-full rounded object-contain"
              @error="(e) => handleImageError(e, 'view')"
            />
          </div>
        </div>
        <div>
          <div class="mb-2 flex items-center justify-between">
            <h4 class="text-sm font-medium text-gray-700">可視圖</h4>
            <el-upload
              v-if="isAdmin"
              :show-file-list="false"
              :before-upload="(file: File) => handleImageUpload(file, 'location')"
              accept="image/*"
              class="inline-block"
            >
              <el-button size="small" type="primary" link>上傳</el-button>
            </el-upload>
          </div>
          <div
            class="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <img
              :src="
                locationImage.imageData.value.previewUrl || presetView?.locationImage || getPlaceholderImage('location')
              "
              :alt="`${presetView?.presetName} 可視圖`"
              class="max-h-64 w-full rounded object-contain"
              @error="(e) => handleImageError(e, 'location')"
            />
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">關閉</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDialogWidth, useImageUpload } from '../composables'
import { ElMessage } from 'element-plus'

/**
 * 預置點視角與點位圖對話框組件
 * 顯示預置點的視角圖和實際點位圖
 * 管理者可以上傳新的圖片
 */

export interface PresetViewData {
  cameraId: number
  cameraName: string
  presetId: number
  presetName: string
  viewImage?: string
  locationImage?: string
}

const props = defineProps<{
  visible: boolean
  presetView: PresetViewData | null
  isAdmin: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'image-upload': [cameraId: number, presetId: number, type: 'view' | 'location', file: File]
}>()

/**
 * 響應式對話框寬度
 */
const dialogWidth = useDialogWidth({
  large: '800px',
})

/**
 * 視角圖上傳處理
 */
const viewImage = useImageUpload({
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  onError: (message) => ElMessage.error(message),
})

/**
 * 可視圖上傳處理
 */
const locationImage = useImageUpload({
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  onError: (message) => ElMessage.error(message),
})

/**
 * 取得 placeholder 圖片（當圖片載入失敗或不存在時使用）
 * @param type - 圖片類型：'view' 或 'location'
 * @returns placeholder 圖片的 data URL
 */
function getPlaceholderImage(type: 'view' | 'location'): string {
  // 使用 SVG data URL 作為 placeholder
  if (type === 'view') {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7op4bpopHlpLHotKU8L3RleHQ+PC9zdmc+'
  } else {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7op4bpopHlpLHotKU8L3RleHQ+PC9zdmc+'
  }
}

/**
 * 處理圖片上傳
 * @param file - 上傳的檔案
 * @param type - 圖片類型：'view' 或 'location'
 * @returns false 阻止自動上傳
 */
function handleImageUpload(file: File, type: 'view' | 'location'): boolean {
  if (!props.presetView) return false

  const imageUpload = type === 'view' ? viewImage : locationImage
  const success = imageUpload.handleUpload(file)

  if (success === false && imageUpload.imageData.value.file) {
    // 發送事件給父組件處理實際上傳
    emit('image-upload', props.presetView.cameraId, props.presetView.presetId, type, file)
  }

  return false // 阻止自動上傳，由父組件處理
}

/**
 * 處理圖片載入錯誤
 * @param event - 圖片錯誤事件
 * @param type - 圖片類型
 */
function handleImageError(event: Event, type: 'view' | 'location'): void {
  const img = event.target as HTMLImageElement
  if (img) {
    img.src = getPlaceholderImage(type)
  }
}

// 當 dialog 關閉或 presetView 改變時，重置預覽 URL
watch(
  () => [props.visible, props.presetView],
  ([visible]) => {
    if (!visible) {
      viewImage.clearImage()
      locationImage.clearImage()
    } else if (props.presetView) {
      viewImage.setPreviewUrl(props.presetView.viewImage || null)
      locationImage.setPreviewUrl(props.presetView.locationImage || null)
    }
  },
)
</script>

<style scoped></style>
