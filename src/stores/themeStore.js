import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const tamna = ref(false)

  function toggleTema() {
    tamna.value = !tamna.value
  }

  return { tamna, toggleTema }
}, {
  persist: true
})
