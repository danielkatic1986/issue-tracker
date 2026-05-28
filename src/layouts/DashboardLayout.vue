<template>
  <div class="flex h-screen bg-slate-50 overflow-hidden">
    <aside class="w-56 bg-white flex flex-col shrink-0 border-r border-gray-100">
      <div class="px-5 pt-6 pb-2">
        <p class="text-xs font-medium text-gray-400 tracking-wide">Meni</p>
      </div>

      <nav class="px-3 mt-1 space-y-0.5">
        <RouterLink to="/" v-slot="{ isActive, navigate }" custom>
          <div
            @click="navigate"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer select-none text-sm font-medium transition-colors',
              isActive ? 'bg-blue-50 text-gray-800' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            ]"
          >
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              <path d="M11 2.05v9.9A8.003 8.003 0 0 0 19.95 4 8.003 8.003 0 0 0 11 2.05z" opacity=".3"/>
              <path d="M11 2.05A10.003 10.003 0 0 0 2 12h9V2.05z"/>
            </svg>
            Statistika
          </div>
        </RouterLink>

        <RouterLink to="/projekti" v-slot="{ isActive, navigate }" custom>
          <div
            @click="navigate"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer select-none text-sm font-medium transition-colors',
              isActive ? 'bg-blue-50 text-gray-800' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            ]"
          >
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/>
            </svg>
            Projekti
          </div>
        </RouterLink>

        <!-- samo za administratore -->
        <RouterLink v-if="authStore.jeAdministrator" to="/admin/korisnici" v-slot="{ isActive, navigate }" custom>
          <div
            @click="navigate"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer select-none text-sm font-medium transition-colors',
              isActive ? 'bg-blue-50 text-gray-800' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            ]"
          >
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
            </svg>
            Korisnici
          </div>
        </RouterLink>
      </nav>

      <div class="flex-1" />

      <div class="px-4 border-t border-gray-100 pt-4 pb-3">
        <div class="flex items-center gap-2.5 mb-4">
          <div class="w-8 h-8 rounded-full shrink-0 overflow-hidden">
            <img
              v-if="authStore.profil?.avatarUrl"
              :src="authStore.profil.avatarUrl"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full bg-indigo-100 flex items-center justify-center"
            >
              <span class="text-xs font-bold text-indigo-600 select-none">{{ inicijali }}</span>
            </div>
          </div>
          <span class="text-sm font-medium text-gray-800 truncate">{{ punoIme }}</span>
        </div>

        <div class="space-y-1.5">
          <button class="w-full text-left text-xs text-gray-500 hover:text-gray-700 flex items-center gap-2 py-0.5">
            <span class="text-gray-300 text-base leading-none">◦</span>
            Postavke aplikacije
          </button>
          <button
            @click="router.push('/korisnik')"
            class="w-full text-left text-xs text-gray-500 hover:text-gray-700 flex items-center gap-2 py-0.5"
          >
            <span class="text-gray-300 text-base leading-none">◦</span>
            Korisnički podaci
          </button>
          <button
            @click="logout"
            class="w-full text-left text-xs text-gray-500 hover:text-gray-700 flex items-center gap-2 py-0.5"
          >
            <span class="text-gray-300 text-base leading-none">◦</span>
            Odjava
          </button>
        </div>
      </div>

      <div class="px-4 py-4 flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C13.04 5.06 12.53 5 12 5c-.53 0-1.04.06-1.52.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/>
          </svg>
        </div>
        <span class="text-sm font-semibold text-gray-800">BugTracker</span>
      </div>
    </aside>

    <main class="flex-1 overflow-auto">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()

const punoIme = computed(() =>
  authStore.profil
    ? `${authStore.profil.ime} ${authStore.profil.prezime}`
    : (authStore.user?.email ?? '')
)

const inicijali = computed(() => {
  const i = authStore.profil?.ime?.charAt(0) ?? ''
  const p = authStore.profil?.prezime?.charAt(0) ?? ''
  return (i + p).toUpperCase() || '?'
})

async function logout() {
  await authStore.logout()
  router.push('/login')
}
</script>
