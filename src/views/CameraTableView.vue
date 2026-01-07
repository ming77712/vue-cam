<template>
  <div class="flex flex-col gap-4 p-4 sm:p-3">
    <!-- 標題與登出按鈕 -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-xl font-semibold text-gray-800 sm:text-lg">攝影機設定</h1>
      <div class="flex items-center gap-2 sm:gap-4">
        <span class="text-xs text-gray-600 sm:text-sm">{{ authStore.username }}</span>
        <el-button type="danger" size="small" @click="handleLogout">登出</el-button>
      </div>
    </div>

    <!-- 篩選區與操作按鈕 -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <CameraFilters
        v-model:search-keyword="searchKeyword"
        v-model:push-filter="pushFilter"
        :is-admin="authStore.isAdmin"
      />
      <div class="flex flex-wrap gap-2">
        <!-- 管理者可以新增/刪除攝影機 -->
        <template v-if="authStore.isAdmin">
          <el-button type="success" @click="handleAddCamera">
            <el-icon class="mr-1"><Plus /></el-icon>
            新增攝影機
          </el-button>
          <el-button type="danger" @click="handleDeleteCamera" :disabled="!hasSelectedCameras">
            <el-icon class="mr-1"><Delete /></el-icon>
            刪除攝影機
          </el-button>
        </template>
        <el-button
          type="primary"
          :loading="saving"
          :disabled="!hasChanges"
          @click="handleSave"
          class="breathing-button w-full sm:w-auto"
        >
          儲存變更
        </el-button>
      </div>
    </div>

    <!-- 桌面版表格 -->
    <div class="hidden md:block">
      <el-table
        :data="pagedCameras"
        border
        style="width: 100%"
        :default-sort="{ prop: sortState.prop, order: sortState.order }"
        :row-class-name="rowClassName"
        @sort-change="onSortChange"
        @selection-change="handleSelectionChange"
      >
        <!-- 選擇欄（僅管理者可見） -->
        <el-table-column v-if="authStore.isAdmin" type="selection" width="55" />
        <el-table-column
          prop="name"
          label="攝影機"
          sortable="custom"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column
          prop="pushEnabled"
          label="是否推播"
          sortable="custom"
          width="110"
          align="center"
        >
          <template #default="{ row }">
            <el-switch
              :model-value="row.pushEnabled"
              :disabled="!authStore.isAuthenticated"
              @update:model-value="(val: boolean) => handlePushEnabledChange(row.id, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="轉向時間 (秒)" sortable="custom" width="140" align="center">
          <template #default="{ row, $index: index }">
              <template v-if="editingPanTimeIndex === index">
              <el-input
                type="number"
                size="small"
                v-model.number="panTimeEditor.editingValue.value"
                style="width: 80px"
                autofocus
                @blur="savePanTime(row, index)"
                @keyup.enter="savePanTime(row, index)"
                @keyup.esc="cancelPanTimeEdit()"
                min="0"
              />
            </template>
            <template v-else>
              <span
                class="editable-cell cursor-pointer"
                style="color: #409eff"
                @click="startPanTimeEdit(row, index)"
              >
                {{ row.panTime }}
              </span>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="預置點" min-width="320">
          <template #default="{ row }">
            <PresetCell
              :presets="row.presets"
              :is-authenticated="authStore.isAuthenticated"
              :is-admin="authStore.isAdmin"
              :is-dirty="isRowDirty(row.id)"
              @preset-change="(presetId, checked) => handlePresetChange(row.id, presetId, checked)"
              @view-preset="(preset) => handleViewPreset(row.id, preset)"
              @edit-presets="() => handleEditPresets(row)"
              @reset-presets="() => resetPresets(row.id)"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>


    <!-- 行動版卡片列表 -->
    <div class="block md:hidden">
      <CameraCardList
        :cameras="pagedCameras"
        :is-authenticated="authStore.isAuthenticated"
        :is-admin="authStore.isAdmin"
        :is-dirty="isRowDirty"
        :selected-camera-ids="selectedCameraIds"
        @push-enabled-change="handlePushEnabledChange"
        @preset-change="handlePresetChange"
        @view-preset="(cameraId, preset) => handleViewPreset(cameraId, preset)"
        @edit-presets="handleEditPresets"
        @reset-presets="resetPresets"
        @pan-time-change="handlePanTimeChangeMobile"
        @selection-change="handleMobileSelectionChange"
      />
    </div>

    <!-- 分頁 -->
    <div class="mt-3 flex justify-center">
      <el-pagination
        background
        :layout="'prev, pager, next'"
        :page-size="pageSize"
        :current-page="currentPage"
        :total="filteredCameras.length"
        :small="isMobile"
        @current-change="onPageChange"
      />
    </div>

    <!-- 預置點視角與點位圖對話框 -->
    <PresetViewDialog
      v-model:visible="showPresetViewDialog"
      :preset-view="currentPresetView"
      :is-admin="authStore.isAdmin"
      @image-upload="handleImageUpload"
    />

    <!-- 編輯預置點對話框 -->
    <EditPresetDialog
      v-model:visible="showEditPresetDialog"
      :camera-id="editPresetForm.cameraId"
      :presets="editPresetForm.presets"
      @save="handleSaveEditPresets"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import type { SortOrder } from '../types/camera'
import type { CameraItem, CameraPreset } from '../types/camera'
import CameraFilters from '../components/CameraFilters.vue'
import PresetCell from '../components/PresetCell.vue'
import CameraCardList from '../components/CameraCardList.vue'
import EditPresetDialog from '../components/EditPresetDialog.vue'
import PresetViewDialog, { type PresetViewData } from '../components/PresetViewDialog.vue'
import { saveCameraChanges } from '../api/camera'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { useResponsive, useEditableField } from '../composables'

const authStore = useAuthStore()

const cameras = ref<CameraItem[]>([
  {
    id: 1,
    name: '大門口一號',
    pushEnabled: true,
    panTime: 3,
    presets: [
      { id: 1, name: '預置點1', checked: true },
      { id: 2, name: '預置點2', checked: false },
      { id: 3, name: '預置點3', checked: false },
    ],
  },
  {
    id: 2,
    name: '倉庫後門',
    pushEnabled: false,
    panTime: 5,
    presets: [
      { id: 1, name: '預置點1', checked: false },
      { id: 2, name: '預置點2', checked: true },
      { id: 3, name: '預置點3', checked: false },
    ],
  },
  {
    id: 3,
    name: '停車場北區',
    pushEnabled: true,
    panTime: 4,
    presets: [
      { id: 1, name: '預置點1', checked: false },
      { id: 2, name: '預置點2', checked: false },
      { id: 3, name: '預置點3', checked: true },
    ],
  },
])

const originalCameras = ref<CameraItem[]>(JSON.parse(JSON.stringify(cameras.value)) as CameraItem[])

const searchKeyword = ref('')
const pushFilter = ref<boolean | null>(null)

const sortState = reactive<{
  prop: keyof CameraItem | null
  order: SortOrder
}>({
  prop: null,
  order: null,
})

const currentPage = ref(1)
const pageSize = ref(10)

// Dialog 狀態
const showEditPresetDialog = ref(false)
const showPresetViewDialog = ref(false)

const editPresetForm = reactive<{
  cameraId: number
  presets: CameraPreset[]
}>({
  cameraId: 0,
  presets: [],
})

const currentPresetView = ref<PresetViewData | null>(null)

// 儲存狀態
const saving = ref(false)

// 攝影機選擇狀態
const selectedCameraIds = ref<Set<number>>(new Set())

// 圖片上傳暫存
const imageUploads = ref<
  Array<{
    cameraId: number
    presetId: number
    type: 'view' | 'location'
    file: File
  }>
>([])

// 響應式狀態
const { isMobile } = useResponsive()

// 轉向時間編輯狀態（桌面版）
const editingPanTimeIndex = ref<number | null>(null)
const panTimeEditor = useEditableField<number>((newValue) => {
  if (editingPanTimeIndex.value !== null) {
    const camera = pagedCameras.value[editingPanTimeIndex.value]
    if (camera) {
      camera.panTime = newValue
      cameras.value = [...cameras.value]
    }
  }
})

function startPanTimeEdit(row: CameraItem, index: number) {
  editingPanTimeIndex.value = index
  panTimeEditor.startEdit(row.panTime)
}

function savePanTime(row: CameraItem, index: number) {
  panTimeEditor.save()
  editingPanTimeIndex.value = null
}

function cancelPanTimeEdit() {
  panTimeEditor.cancel()
  editingPanTimeIndex.value = null
}

function handlePanTimeChangeMobile(cameraId: number, value: number) {
  const camera = cameras.value.find((c) => c.id === cameraId)
  if (camera) {
    camera.panTime = value
    cameras.value = [...cameras.value]
  }
}

/**
 * 過濾並排序攝影機列表
 * @returns 過濾和排序後的攝影機陣列
 */
const filteredCameras = computed(() => {
  let result = [...cameras.value]

  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase()
    result = result.filter((item) => item.name.toLowerCase().includes(keyword))
  }

  if (pushFilter.value !== null) {
    result = result.filter((item) => item.pushEnabled === pushFilter.value)
  }

  if (sortState.prop && sortState.order) {
    const prop = sortState.prop
    const factor = sortState.order === 'ascending' ? 1 : -1
    result.sort((a, b) => {
      const aVal = a[prop]
      const bVal = b[prop]

      if (aVal === bVal) return 0
      if (aVal > bVal) return factor
      return -factor
    })
  }

  return result
})

/**
 * 分頁後的攝影機列表
 * @returns 當前頁面的攝影機陣列
 */
const pagedCameras = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredCameras.value.slice(start, end)
})

/**
 * 檢查是否有選擇的攝影機
 */
const hasSelectedCameras = computed(() => selectedCameraIds.value.size > 0)

/**
 * 檢查是否有變更需要儲存
 * @returns 若有變更則返回 true，否則返回 false
 */
const hasChanges = computed(() => {
  // 檢查是否有任何攝影機的 checkbox, 轉向時間 或推播狀態有變更
  const hasDirtyRows = cameras.value.some((camera) => isRowDirty(camera.id))
  // 檢查是否有圖片上傳
  const hasImageUploads = imageUploads.value.length > 0
  return hasDirtyRows || hasImageUploads
})

/**
 * 檢查指定攝影機的設定是否有變更
 * @param cameraId - 攝影機 ID
 * @returns 若有變更則返回 true，否則返回 false
 */
function isRowDirty(cameraId: number): boolean {
  const current = cameras.value.find((c) => c.id === cameraId)
  const original = originalCameras.value.find((c) => c.id === cameraId)
  if (!current || !original) return false

  // 檢查推播狀態
  if (current.pushEnabled !== original.pushEnabled) return true

  // 檢查轉向時間
  if (current.panTime !== original.panTime) return true

  // 檢查預置點數量是否改變（新增或刪除）
  if (current.presets.length !== original.presets.length) return true

  // 檢查預置點的 checkbox 狀態和名稱
  const originalPresetMap = new Map(original.presets.map((p) => [p.id, p]))

  for (const preset of current.presets) {
    const originalPreset = originalPresetMap.get(preset.id)

    // 新增的預置點（原始資料中沒有此 ID）
    if (!originalPreset) return true

    // 檢查 checkbox 狀態
    if (originalPreset.checked !== preset.checked) return true

    // 檢查名稱是否改變
    if (originalPreset.name !== preset.name) return true
  }

  return false
}

/**
 * 設定表格列的 class name（用於標示已修改的列）
 * @param param0 - 包含 row 物件的參數
 * @returns 若該列有變更則返回 'camera-row--dirty'，否則返回空字串
 */
function rowClassName({ row }: { row: CameraItem }): string {
  return isRowDirty(row.id) ? 'camera-row--dirty' : ''
}

/**
 * 處理表格排序變更
 * @param param0 - 包含 prop 和 order 的參數
 */
function onSortChange({
  prop,
  order,
}: {
  prop: keyof CameraItem | undefined
  order: SortOrder
}): void {
  sortState.prop = prop ?? null
  sortState.order = order
}

/**
 * 處理分頁變更
 * @param page - 新的頁碼
 */
function onPageChange(page: number): void {
  currentPage.value = page
}

/**
 * 處理表格選擇變更
 * @param selection - 選中的攝影機列表
 */
function handleSelectionChange(selection: CameraItem[]): void {
  selectedCameraIds.value = new Set(selection.map((camera) => camera.id))
}

/**
 * 處理行動版選擇變更
 * @param cameraId - 攝影機 ID
 * @param selected - 是否選中
 */
function handleMobileSelectionChange(cameraId: number, selected: boolean): void {
  if (selected) {
    selectedCameraIds.value.add(cameraId)
  } else {
    selectedCameraIds.value.delete(cameraId)
  }
  // 觸發響應式更新
  selectedCameraIds.value = new Set(selectedCameraIds.value)
}

/**
 * 處理登出
 */
function handleLogout(): void {
  authStore.logout()
}

/**
 * 處理推播狀態變更
 * @param cameraId - 攝影機 ID
 * @param enabled - 是否推播
 */
function handlePushEnabledChange(cameraId: number, enabled: boolean): void {
  const camera = cameras.value.find((c) => c.id === cameraId)
  if (camera) {
    camera.pushEnabled = enabled
    // 觸發響應式更新
    cameras.value = [...cameras.value]
  }
}

/**
 * 處理預置點勾選狀態變更
 * @param cameraId - 攝影機 ID
 * @param presetId - 預置點 ID
 * @param checked - 是否勾選
 */
function handlePresetChange(cameraId: number, presetId: number, checked: boolean): void {
  const camera = cameras.value.find((c) => c.id === cameraId)
  if (camera) {
    const preset = camera.presets.find((p) => p.id === presetId)
    if (preset) {
      preset.checked = checked
      // 觸發響應式更新
      cameras.value = [...cameras.value]
    }
  }
}

/**
 * 處理新增攝影機
 */
function handleAddCamera(): void {
  ElMessageBox.prompt('請輸入攝影機名稱', '新增攝影機', {
    confirmButtonText: '確定',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '請輸入攝影機名稱',
  })
    .then(({ value }) => {
      const newCameraId = Math.max(...cameras.value.map((c) => c.id), 0) + 1
      const newCamera: CameraItem = {
        id: newCameraId,
        name: value,
        pushEnabled: false,
        panTime: 3,
        presets: [],
      }
      cameras.value.push(newCamera)
      originalCameras.value.push(JSON.parse(JSON.stringify(newCamera)) as CameraItem)
      ElMessage.success(`已新增攝影機：${value}`)
    })
    .catch(() => {
      // 使用者取消
    })
}

/**
 * 處理刪除攝影機
 */
function handleDeleteCamera(): void {
  if (selectedCameraIds.value.size === 0) {
    ElMessage.warning('請先選擇要刪除的攝影機')
    return
  }

  const cameraNames = cameras.value
    .filter((c) => selectedCameraIds.value.has(c.id))
    .map((c) => c.name)
    .join('、')

  ElMessageBox.confirm(`確定要刪除以下攝影機嗎？\n${cameraNames}`, '刪除攝影機', {
    confirmButtonText: '確定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      cameras.value = cameras.value.filter((c) => !selectedCameraIds.value.has(c.id))
      originalCameras.value = originalCameras.value.filter(
        (c) => !selectedCameraIds.value.has(c.id),
      )
      selectedCameraIds.value.clear()
      ElMessage.success('刪除成功')
    })
    .catch(() => {
      // 使用者取消
    })
}

/**
 * 處理編輯預置點（針對特定攝影機）
 * @param row - 攝影機資料
 */
function handleEditPresets(row: CameraItem): void {
  editPresetForm.cameraId = row.id
  editPresetForm.presets = JSON.parse(JSON.stringify(row.presets)) as CameraPreset[]
  showEditPresetDialog.value = true
}

/**
 * 處理儲存編輯的預置點
 * @param cameraId - 攝影機 ID
 * @param presets - 預置點列表
 */
function handleSaveEditPresets(cameraId: number, presets: CameraPreset[]): void {
  const camera = cameras.value.find((c) => c.id === cameraId)
  if (camera) {
    camera.presets = JSON.parse(JSON.stringify(presets)) as CameraPreset[]
    // 不更新 originalCameras，讓預置點的新增/刪除/修改被視為變更
    // 這樣 isDirty 會檢測到變更，使用者需要點擊「儲存變更」才會真正保存
  }
}

/**
 * 復原指定攝影機的預置點設定到原始狀態
 * @param cameraId - 攝影機 ID
 */
function resetPresets(cameraId: number): void {
  const current = cameras.value.find((c) => c.id === cameraId)
  const original = originalCameras.value.find((c) => c.id === cameraId)
  if (!current || !original) return

  current.pushEnabled = original.pushEnabled
  current.presets = original.presets.map((p) => ({ ...p }))
  current.panTime = original.panTime
}

/**
 * 處理查看預置點視角與點位圖
 * @param cameraId - 攝影機 ID
 * @param preset - 預置點資料
 */
function handleViewPreset(cameraId: number, preset: CameraPreset): void {
  const camera = cameras.value.find((c) => c.id === cameraId)
  if (!camera) return

  currentPresetView.value = {
    cameraId,
    cameraName: camera.name,
    presetId: preset.id,
    presetName: preset.name,
    // 實際應用中可以從 API 取得：
    // viewImage: `/api/cameras/${cameraId}/presets/${preset.id}/view`,
    // locationImage: `/api/cameras/${cameraId}/presets/${preset.id}/location`,
  }

  showPresetViewDialog.value = true
}

/**
 * 處理圖片上傳
 * @param cameraId - 攝影機 ID
 * @param presetId - 預置點 ID
 * @param type - 圖片類型
 * @param file - 上傳的檔案
 */
function handleImageUpload(
  cameraId: number,
  presetId: number,
  type: 'view' | 'location',
  file: File,
): void {
  // 移除舊的上傳記錄（如果有的話）
  const index = imageUploads.value.findIndex(
    (upload) =>
      upload.cameraId === cameraId && upload.presetId === presetId && upload.type === type,
  )
  if (index > -1) {
    imageUploads.value.splice(index, 1)
  }

  // 加入新的上傳記錄
  imageUploads.value.push({
    cameraId,
    presetId,
    type,
    file,
  })
}

/**
 * 處理儲存所有變更
 */
async function handleSave(): Promise<void> {
  if (!hasChanges.value) return

  saving.value = true

  try {
    // 收集所有變更的資料
    const changes: Array<{
      cameraId: number
      pushEnabled: boolean
      presets: Array<{ presetId: number; checked: boolean }>
    }> = []

    // 找出所有有變更的攝影機
    cameras.value.forEach((camera) => {
      if (isRowDirty(camera.id)) {
        const original = originalCameras.value.find((c) => c.id === camera.id)
        if (original) {
          // 收集 checkbox 變更
          const presetChanges: Array<{ presetId: number; checked: boolean }> = []
          const originalPresetMap = new Map(original.presets.map((p) => [p.id, p.checked]))

          camera.presets.forEach((preset) => {
            const originalChecked = originalPresetMap.get(preset.id)
            if (originalChecked !== undefined && originalChecked !== preset.checked) {
              presetChanges.push({
                presetId: preset.id,
                checked: preset.checked,
              })
            }
          })

          changes.push({
            cameraId: camera.id,
            pushEnabled: camera.pushEnabled,
            presets: presetChanges,
          })
        }
      }
    })

    // 準備 FormData 來上傳圖片
    const formData = new FormData()

    // 加入變更資料
    formData.append('changes', JSON.stringify(changes))

    // 加入圖片上傳
    imageUploads.value.forEach(
      (
        upload: { cameraId: number; presetId: number; type: 'view' | 'location'; file: File },
        index: number,
      ) => {
        formData.append(`images[${index}][cameraId]`, upload.cameraId.toString())
        formData.append(`images[${index}][presetId]`, upload.presetId.toString())
        formData.append(`images[${index}][type]`, upload.type)
        formData.append(`images[${index}][file]`, upload.file)
      },
    )

    // 呼叫 API 儲存
    await saveCameraChanges(formData)

    // 更新原始資料
    originalCameras.value = JSON.parse(JSON.stringify(cameras.value)) as CameraItem[]

    // 清空圖片上傳記錄
    imageUploads.value = []

    // 顯示成功訊息
    ElMessage.success('儲存成功')
  } catch (error) {
    // 顯示錯誤訊息
    ElMessage.error('儲存失敗，請稍後再試')
    console.error('Save failed:', error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* 已修改的列背景色 */
:deep(.camera-row--dirty) > td {
  background-color: #fff7d6;
}

@keyframes breathing {
  0%,
  100% {
    background: linear-gradient(135deg, #2b7acc 0%, #409eff 100%);
  }
  50% {
    background: linear-gradient(135deg, #66b1ff 0%, #b3d8ff 100%);
  }
}

.breathing-button:not(.is-disabled):not(.is-loading) {
  animation: breathing 2s ease-in-out infinite;
  border: none;
}
</style>
