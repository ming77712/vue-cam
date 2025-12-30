<template>
  <el-dialog
    :model-value="visible"
    title="編輯預置點"
    :width="dialogWidth"
    class="edit-preset-dialog"
    @update:model-value="(val: boolean) => $emit('update:visible', val)"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item
        v-for="preset in form.presets"
        :key="preset.id"
        :label="preset.name"
      >
        <div class="flex items-center gap-2">
          <el-input v-model="preset.name" placeholder="預置點名稱" class="flex-1" />
          <el-button
            type="danger"
            size="small"
            @click="handleDeletePreset(preset.id)"
          >
            刪除
          </el-button>
        </div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleAddPreset">新增預置點</el-button>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">儲存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import type { CameraPreset } from '../types/camera'

/**
 * 編輯預置點對話框組件
 * 用於編輯特定攝影機的預置點列表
 */

const props = defineProps<{
  visible: boolean
  cameraId: number
  presets: CameraPreset[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [cameraId: number, presets: CameraPreset[]]
}>()

const formRef = ref<FormInstance>()
const form = reactive<{
  presets: CameraPreset[]
}>({
  presets: [],
})

/**
 * 響應式對話框寬度
 */
const dialogWidth = computed(() => {
  if (typeof window !== 'undefined') {
    if (window.innerWidth < 640) {
      return '95%'
    } else if (window.innerWidth < 768) {
      return '90%'
    }
    return '500px'
  }
  return '500px'
})

/**
 * 監聽 props 變化，更新表單資料
 */
watch(
  () => [props.visible, props.presets],
  ([visible, presets]) => {
    if (visible && presets) {
      form.presets = JSON.parse(JSON.stringify(presets)) as CameraPreset[]
    }
  },
  { immediate: true },
)

/**
 * 處理新增預置點
 */
function handleAddPreset(): void {
  const newPresetId = Math.max(...form.presets.map((p) => p.id), 0) + 1
  form.presets.push({
    id: newPresetId,
    name: `預置點${form.presets.length + 1}`,
    checked: false,
  })
}

/**
 * 處理刪除預置點
 * @param presetId - 預置點 ID
 */
function handleDeletePreset(presetId: number): void {
  const index = form.presets.findIndex((p) => p.id === presetId)
  if (index > -1) {
    form.presets.splice(index, 1)
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

<style scoped></style>

