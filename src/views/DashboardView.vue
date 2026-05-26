<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6">Dashboard</h1>

    <!-- TEST: Informacije o prijavljenom korisniku -->
    <div class="mb-4 p-4 bg-gray-100 rounded text-sm">
      <p><strong>Email:</strong> {{ authStore.user?.email }}</p>
      <p><strong>Puno ime:</strong> {{ authStore.punoIme }}</p>
      <p><strong>Uloga:</strong> {{ authStore.profil?.uloga ?? '—' }}</p>
    </div>

    <!-- TEST: Logout dugme -->
    <button
      @click="logout"
      class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
    >
      Odjava (test)
    </button>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

async function logout() {
  await authStore.logout()
  router.push('/login')
}
</script>
