<script setup>
// Glavni layout za zaštićene stranice — sadrži sidebar s navigacijom i <main> s RouterViewom.
// Na mobitelu je sidebar skriven i otvara se kao overlay; na desktopu je uvijek vidljiv.

import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useProjektiStore } from '@/stores/projektiStore'
import { useThemeStore } from '@/stores/themeStore'

const authStore     = useAuthStore()
const projektiStore = useProjektiStore()
const themeStore    = useThemeStore()
const router        = useRouter()
const route         = useRoute()

const sidebarOtvoren = ref(false)
const prikazPostavki = ref(false)

// Zatvori mobilni sidebar automatski pri svakoj navigaciji
watch(() => route.path, () => { sidebarOtvoren.value = false })

// Prikaži podsekciju "Projekt / Problemi" u sidebaru samo dok je korisnik na rutama projekta
const projektjeAktivan = computed(() => !!route.params.projektId)

// Preusmjeri na stranicu projekta s ?dodaj=1 — ProjektDetailView watch otvori modal za novi problem
function dodajProblemIzSidebara() {
  router.push({ path: `/projekti/${route.params.projektId}`, query: { dodaj: '1' } })
}

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

<template>
  <div class="flex h-screen bg-slate-50 dark:bg-gray-900 overflow-hidden">

    <div
      v-if="sidebarOtvoren"
      class="fixed inset-0 bg-black/40 z-20 md:hidden"
      @click="sidebarOtvoren = false"
    />

    <aside
      :class="[
        'w-56 bg-white dark:bg-gray-800 flex flex-col shrink-0 border-r border-gray-200 dark:border-gray-700 shadow-sm transition-transform duration-200',
        'fixed top-0 left-0 h-full z-30 md:relative md:translate-x-0',
        sidebarOtvoren ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      ]"
    >
      <div class="px-5 pt-6 pb-2">
        <p class="text-xs font-medium text-gray-400 dark:text-gray-500 tracking-wide">Meni</p>
      </div>

      <nav class="px-3 mt-1 space-y-0.5">
        <RouterLink to="/" v-slot="{ isExactActive, navigate }" custom>
          <div
            @click="navigate"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer select-none text-sm font-medium transition-colors',
              isExactActive
                ? 'bg-blue-50 text-gray-800 dark:bg-blue-950 dark:text-gray-100'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
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
              isActive
                ? 'bg-blue-50 text-gray-800 dark:bg-blue-950 dark:text-gray-100'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
            ]"
          >
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/>
            </svg>
            Projekti
          </div>
        </RouterLink>

        <RouterLink v-if="authStore.jeAdministrator" to="/admin/korisnici" v-slot="{ isActive, navigate }" custom>
          <div
            @click="navigate"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer select-none text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-50 text-gray-800 dark:bg-blue-950 dark:text-gray-100'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
            ]"
          >
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
            </svg>
            Korisnici
          </div>
        </RouterLink>
      </nav>

      <div v-if="projektjeAktivan" class="mt-3 px-3 border-t border-gray-100 dark:border-gray-700 pt-3">
        <p class="text-xs text-gray-400 dark:text-gray-500 px-3 mb-1 truncate">Projekt: {{ projektiStore.aktivniProjekt?.naziv ?? '...' }}</p>
        <RouterLink :to="`/projekti/${route.params.projektId}`" v-slot="{ isActive, navigate }" custom>
          <div
            @click="navigate"
            :class="[
              'flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer select-none text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-50 text-gray-800 dark:bg-blue-950 dark:text-gray-100'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
            ]"
          >
            <div class="flex items-center gap-3">
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
              Problemi
            </div>
            <button
              v-if="authStore.jeAdministrator || authStore.jeTester || authStore.jeDeveloper"
              @click.stop="dodajProblemIzSidebara"
              class="w-5 h-5 rounded-full border border-current flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
            </button>
          </div>
        </RouterLink>
      </div>

      <div class="flex-1" />

      <div class="px-4 border-t border-gray-100 dark:border-gray-700 pt-4 pb-3">
        <div class="flex items-center gap-2.5 mb-4">
          <div class="w-8 h-8 rounded-full shrink-0 overflow-hidden">
            <img v-if="authStore.profil?.avatarUrl" :src="authStore.profil.avatarUrl" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full bg-indigo-100 flex items-center justify-center">
              <span class="text-xs font-bold text-indigo-600 select-none">{{ inicijali }}</span>
            </div>
          </div>
          <span class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{{ punoIme }}</span>
        </div>
        <div class="space-y-1.5">
          <button
            @click="prikazPostavki = true"
            class="w-full text-left text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-2 py-0.5"
          >
            <span class="text-gray-300 dark:text-gray-600 text-base leading-none">◦</span>
            Postavke aplikacije
          </button>
          <button @click="router.push('/korisnik')" class="w-full text-left text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-2 py-0.5">
            <span class="text-gray-300 dark:text-gray-600 text-base leading-none">◦</span>
            Korisnički podaci
          </button>
          <button @click="logout" class="w-full text-left text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-2 py-0.5">
            <span class="text-gray-300 dark:text-gray-600 text-base leading-none">◦</span>
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
        <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">BugTracker</span>
      </div>
    </aside>

    <main class="flex-1 overflow-hidden flex flex-col min-w-0">

      <div class="md:hidden flex items-center gap-3 px-4 h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm shrink-0 z-10">
        <button
          @click="sidebarOtvoren = !sidebarOtvoren"
          class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
          </svg>
        </button>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-md bg-amber-400 flex items-center justify-center">
            <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C13.04 5.06 12.53 5 12 5c-.53 0-1.04.06-1.52.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8z"/>
            </svg>
          </div>
          <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">BugTracker</span>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto md:overflow-hidden">
        <RouterView />
      </div>
    </main>

    <!-- Modal za postavke aplikacije -->
    <div
      v-if="prikazPostavki"
      class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      @click.self="prikazPostavki = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-xs p-6" @click.stop>
        <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100 mb-6">Postavke aplikacije</h2>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg v-if="themeStore.tamna" class="w-5 h-5 text-gray-400 dark:text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
            </svg>
            <svg v-else class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
            </svg>
            <span class="text-sm text-gray-700 dark:text-gray-200">Tamna tema</span>
          </div>
          <button
            @click="themeStore.toggleTema()"
            :class="[
              'relative w-11 h-6 rounded-full transition-colors duration-200',
              themeStore.tamna ? 'bg-blue-500' : 'bg-gray-200'
            ]"
          >
            <span
              :class="[
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                themeStore.tamna ? 'translate-x-5' : 'translate-x-0'
              ]"
            />
          </button>
        </div>

        <div class="flex justify-end mt-6">
          <button
            @click="prikazPostavki = false"
            class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Zatvori
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
