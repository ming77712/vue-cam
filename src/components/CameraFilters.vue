<template>
  <div class="flex flex-wrap gap-3">
    <el-input
      :model-value="searchKeyword"
      placeholder="搜尋攝影機名稱"
      clearable
      class="flex-1 min-w-[200px] max-w-[320px]"
      @update:model-value="(val: string) => $emit('update:searchKeyword', val)"
    />

    <el-select
      :model-value="pushFilter"
      placeholder="推播狀態"
      clearable
      class="w-[180px]"
      @update:model-value="(val: boolean | null) => $emit('update:pushFilter', val)"
    >
      <el-option label="全部" :value="null" />
      <el-option label="只顯示推播" :value="true" />
      <el-option label="只顯示不推播" :value="false" />
    </el-select>
  </div>
</template>

<script setup lang="ts">
/**
 * 攝影機篩選組件
 * 提供搜尋、推播狀態篩選功能
 */

defineProps<{
  searchKeyword: string
  pushFilter: boolean | null
  isAdmin: boolean
}>()

defineEmits<{
  'update:searchKeyword': [value: string]
  'update:pushFilter': [value: boolean | null]
}>()
</script>

<style scoped></style>

