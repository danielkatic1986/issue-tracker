// Ovaj store pamti je li uključen tamni ili svijetli način rada.
// persist: true znači da se postavka automatski sprema u localStorage,
// pa korisnik ne mora ponovo birati temu svaki put kad otvori aplikaciju.

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const tamna = ref(false) // false = svijetla tema, true = tamna tema

  function toggleTema() {
    tamna.value = !tamna.value
  }

  return { tamna, toggleTema }
}, {
  persist: true
})
