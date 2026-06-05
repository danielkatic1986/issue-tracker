<script setup>
import { watch } from 'vue'
import { useThemeStore } from '@/stores/themeStore'

const themeStore = useThemeStore()

watch(
  () => themeStore.tamna,
  (tamna) => document.documentElement.classList.toggle('dark', tamna),
  { immediate: true }
)
</script>

<template>
  <RouterView />
</template>
