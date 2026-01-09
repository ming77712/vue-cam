<template>
  <el-dialog
    :model-value="visible"
    title="編輯預置點"
    :width="dialogWidth"
    class="edit-preset-dialog"
    @update:model-value="(val: boolean) => $emit('update:visible', val)"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" label-width="120px">
      <div v-for="(preset, index) in form.presets" :key="preset.CameraPointId" class="mb-4 rounded border border-gray-200 p-3">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-bold text-gray-700">#{{ index + 1 }}</span>
          <el-button
            type="danger"
            size="small"
            link
            @click="handleDeletePreset(preset.CameraPointId)"
          >
            刪除
          </el-button>
        </div>

        <div class="flex flex-col gap-3">
          <!-- 名稱 -->
          <div>
             <span class="mb-1 block text-xs text-gray-500">名稱</span>
             <el-input v-model="preset.CameraPointName" placeholder="預置點名稱" />
          </div>

          <!-- 轉向時間 -->
          <div>
            <span class="mb-1 block text-xs text-gray-500">轉向時間 (秒)</span>
            <div class="flex items-center gap-2">
              <el-input-number
                v-model="preset.ChangePointSec"
                :min="0"
                :max="3600"
                size="small"
                placeholder="-"
                class="flex-1"
                style="width: 100%"
              />
            </div>
          </div>

          <!-- 排程設定 -->
          <div class="rounded border border-gray-100 bg-gray-50 p-2">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs font-medium text-gray-700">排程設定</span>
              <el-button
                size="small"
                type="primary"
                link
                @click="handleAddSchedule(preset.CameraPointId)"
              >
                新增排程
              </el-button>
            </div>
            <div
              v-for="(schedule, sIndex) in preset.Schedule"
              :key="sIndex"
              class="mb-2 flex flex-col gap-2 border-b border-gray-100 pb-2 last:mb-0 last:border-0 last:pb-0 sm:flex-row sm:items-center"
            >
              <div class="flex items-center gap-1">
                 <el-time-picker
                  v-model="schedule.StartTime"
                  placeholder="開始"
                  format="HH:mm:ss"
                  value-format="HH:mm:ss.SSS"
                  size="small"
                  class="!w-28"
                  :clearable="false"
                />
                <span class="text-gray-400">-</span>
                <el-time-picker
                  v-model="schedule.EndTime"
                  placeholder="結束"
                  format="HH:mm:ss"
                  value-format="HH:mm:ss.SSS"
                  size="small"
                  class="!w-28"
                  :clearable="false"
                />
              </div>
              <div class="flex items-center justify-between gap-2 sm:justify-start">
                <el-switch
                  v-model="schedule.IsEnabled"
                  active-text="啟用"
                  inline-prompt
                  size="small"
                />
                <el-button
                  type="danger"
                  link
                  size="small"
                  @click="handleDeleteSchedule(preset.CameraPointId, sIndex)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div v-if="!preset.Schedule || preset.Schedule.length === 0" class="text-center text-xs text-gray-400">
              無排程
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-center mt-6">
        <el-button type="primary" @click="handleAddPreset">新增預置點</el-button>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">確認</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import type { CameraPoint } from '../types/camera'
import { useDialogWidth } from '../composables'

/**
 * 編輯預置點對話框組件
 * 用於編輯特定攝影機的預置點列表
 */

const props = defineProps<{
  visible: boolean
  cameraId: number
  presets: CameraPoint[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [cameraId: number, presets: CameraPoint[]]
}>()

const formRef = ref<FormInstance>()
const form = reactive<{
  presets: CameraPoint[]
}>({
  presets: [],
})

/**
 * 響應式對話框寬度
 */
const dialogWidth = useDialogWidth({
  small: '450px',
  large: '600px',
})

/**
 * 監聽 props 變化，更新表單資料
 */
watch(
  () => [props.visible, props.presets],
  ([visible, presets]) => {
    if (visible && presets) {
      form.presets = JSON.parse(JSON.stringify(presets)) as CameraPoint[]
    }
  },
  { immediate: true },
)

/**
 * 處理新增預置點
 */
function handleAddPreset(): void {
  const newPresetId = Math.max(...form.presets.map((p) => p.CameraPointId), 0) + 1
  form.presets.push({
    CameraPointId: newPresetId,
    DocGuid: '000-0000-00000',
    CameraPointNo: newPresetId,
    CameraPointName: `預置點${form.presets.length + 1}`,
    CameraPointAreaPic: '',
    CameraPointScenePic: '',
    IsSpinToTarget: false,
    ChangePointSec: 10,
    Schedule: [],
    Checked: false,
  })
}

/**
 * 處理刪除預置點
 * @param presetId - 預置點 ID
 */
function handleDeletePreset(presetId: number): void {
  const index = form.presets.findIndex((p) => p.CameraPointId === presetId)
  if (index > -1) {
    form.presets.splice(index, 1)
  }
}

/**
 * 處理新增排程
 * @param presetId - 預置點 ID
 */
function handleAddSchedule(presetId: number): void {
  const preset = form.presets.find((p) => p.CameraPointId === presetId)
  if (preset) {
    if (!preset.Schedule) {
      preset.Schedule = []
    }
    preset.Schedule.push({
      StartTime: '00:00:00.000',
      EndTime: '23:59:59.000',
      IsEnabled: true,
    })
  }
}

/**
 * 處理刪除排程
 * @param presetId - 預置點 ID
 * @param scheduleIndex - 排程索引
 */
function handleDeleteSchedule(presetId: number, scheduleIndex: number): void {
  const preset = form.presets.find((p) => p.CameraPointId === presetId)
  if (preset && preset.Schedule) {
    preset.Schedule.splice(scheduleIndex, 1)
  }
}

/**
 * 處理儲存
 */
function handleSave(): void {
  emit('save', props.cameraId, form.presets)
  handleClose()
}

/**
 * 處理對話框關閉
 */
function handleClose(): void {
  form.presets = []
  formRef.value?.clearValidate()
  emit('update:visible', false)
}
</script>

<style scoped>
.breathing-btn {
  animation: breathing 1.5s infinite alternate;
}

@keyframes breathing {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 139, 255, 0.3);
    background-color: #409eff;
    color: #fff;
  }
  100% {
    box-shadow: 0 0 18px 8px rgba(64, 158, 255, 0.25);
    background-color: #66b1ff;
    color: #fff;
  }
}
</style>
