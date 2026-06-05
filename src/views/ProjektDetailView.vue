<template>
  <div class="p-6 h-full flex flex-col gap-4">

    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
      Projekt: {{ projektiStore.aktivniProjekt?.naziv ?? '...' }}
    </h1>

    <div class="flex items-center justify-end gap-3">
      <div class="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800 text-sm">
        <span class="px-3 py-1.5 text-gray-400 dark:text-gray-500">Sortiraj kao</span>
        <div class="w-px self-stretch bg-gray-200 dark:bg-gray-600" />
        <div class="relative">
          <select
            v-model="sortir"
            class="appearance-none pl-3 pr-8 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
          >
            <option value="najnovije">Najnovije</option>
            <option value="najstarije">Najstarije</option>
            <option value="naziv">Naziv A-Z</option>
            <option value="prioritet_desc">Prioritet (visok → nizak)</option>
            <option value="prioritet_asc">Prioritet (nizak → visok)</option>
          </select>
          <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </div>

      <div class="relative">
        <input
          v-model="pretraga"
          type="text"
          placeholder="Pretraga"
          class="border border-gray-200 dark:border-gray-600 rounded-lg pl-4 pr-10 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-gray-300 dark:focus:border-gray-500 w-52"
        />
        <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex-1 overflow-auto">

      <div v-if="ucitavanje" class="flex items-center justify-center h-48">
        <span class="text-sm text-gray-400 dark:text-gray-500">Učitavanje...</span>
      </div>

      <div v-else-if="filtrirani.length === 0" class="flex flex-col items-center justify-center h-48 gap-2">
        <svg class="w-10 h-10 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
        </svg>
        <p class="text-sm text-gray-400 dark:text-gray-500">{{ pretraga ? 'Nema rezultata pretrage' : 'Nema prijavljenih problema' }}</p>
        <button
          v-if="!pretraga && mozeDodati"
          @click.stop="prikazModal = true"
          class="text-xs text-blue-500 hover:text-blue-600 mt-1"
        >
          Prijavi prvi problem
        </button>
      </div>

      <template v-if="filtrirani.length > 0">

        <div class="lg:hidden divide-y divide-gray-50 dark:divide-gray-700">
          <div
            v-for="problem in filtrirani"
            :key="'card-' + problem.id"
            @click="navigirajNaProblem(problem)"
            :class="['px-5 py-4 cursor-pointer transition-colors', jeZatvoren(problem) ? 'opacity-40' : 'hover:bg-gray-50 dark:hover:bg-gray-700']"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span :class="prioritetBoja(problem.prioritet)" class="w-2 h-2 rounded-full shrink-0" />
                  <span :class="jeZatvoren(problem) ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'" class="text-sm font-semibold">{{ problem.naslov }}</span>
                  <span v-if="problem.prioritet === 'kritičan'" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">Kritičan</span>
                  <span v-else-if="problem.prioritet === 'visok'" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">Visok</span>
                </div>
                <p v-if="problem.opis" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{{ problem.opis }}</p>
                <div class="flex items-center gap-3 mt-2 flex-wrap">
                  <span class="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
                    </svg>
                    {{ problem.brojKomentara ?? 0 }}
                  </span>
                  <span v-if="problem.datumZavrsetka" class="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
                    </svg>
                    {{ formatDatum(problem.datumZavrsetka) }}
                  </span>
                </div>
              </div>
              <div class="flex flex-col items-end gap-2 shrink-0">
                <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ formatStatus(problem.status) }}</span>
                <div v-if="mozeMijenjati" class="relative" @click.stop>
                  <button @click.stop="toggleMeni(problem.id)" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <svg class="w-1 h-4 text-gray-400" fill="currentColor" viewBox="0 0 4 20">
                      <circle cx="2" cy="2" r="2"/><circle cx="2" cy="10" r="2"/><circle cx="2" cy="18" r="2"/>
                    </svg>
                  </button>
                  <div v-if="otvoreniMeni === problem.id" class="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg py-1 z-10 w-32">
                    <button @click.stop="otvoriUredi(problem)" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Uredi</button>
                    <button @click.stop="potvrdiIzbris(problem.id)" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700">Obriši</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <table class="hidden lg:table w-full">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700">
              <th class="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-6 py-4">Problem</th>
              <th class="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-4">Opis</th>
              <th class="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-4">Komentari</th>
              <th class="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-4 whitespace-nowrap">Početak</th>
              <th class="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-4">Rok</th>
              <th class="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-4">Status</th>
              <th class="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-4">Akcije</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="problem in filtrirani"
              :key="problem.id"
              @click="navigirajNaProblem(problem)"
              :class="['border-b border-gray-50 dark:border-gray-700/50 transition-colors cursor-pointer', jeZatvoren(problem) ? 'opacity-40 hover:opacity-60' : 'hover:bg-gray-50 dark:hover:bg-gray-700']"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span :class="prioritetBoja(problem.prioritet)" class="w-2 h-2 rounded-full shrink-0" />
                  <span :class="jeZatvoren(problem) ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'" class="text-sm font-medium">{{ problem.naslov }}</span>
                  <span v-if="problem.prioritet === 'kritičan'" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 whitespace-nowrap">Kritičan</span>
                  <span v-else-if="problem.prioritet === 'visok'" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 whitespace-nowrap">Visok</span>
                </div>
              </td>
              <td class="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-40 truncate">{{ problem.opis || '—' }}</td>
              <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{{ problem.brojKomentara ?? 0 }}</td>
              <td class="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ formatDatum(problem.datumPrijave) }}</td>
              <td class="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ formatDatum(problem.datumZavrsetka) }}</td>
              <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{{ formatStatus(problem.status) }}</td>
              <td class="px-4 py-4" @click.stop>
                <div v-if="mozeMijenjati" class="relative">
                  <button @click.stop="toggleMeni(problem.id)" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <svg class="w-1 h-4 text-gray-400" fill="currentColor" viewBox="0 0 4 20">
                      <circle cx="2" cy="2" r="2"/><circle cx="2" cy="10" r="2"/><circle cx="2" cy="18" r="2"/>
                    </svg>
                  </button>
                  <div v-if="otvoreniMeni === problem.id" class="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg py-1 z-10 w-32">
                    <button @click.stop="otvoriUredi(problem)" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Uredi</button>
                    <button @click.stop="potvrdiIzbris(problem.id)" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700">Obriši</button>
                  </div>
                </div>
                <span v-else class="text-xs text-gray-300 dark:text-gray-600">—</span>
              </td>
            </tr>
          </tbody>
        </table>

      </template>

    </div>

    <div
      v-if="prikazModal"
      class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      @click.self="zatvoriModal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6" @click.stop>
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-5">
          {{ aktivniProblem ? 'Uredi problem' : 'Novi problem' }}
        </h2>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Naslov *</label>
            <input
              v-model="forma.naslov"
              type="text"
              placeholder="Unesite naslov"
              class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Opis</label>
            <textarea
              v-model="forma.opis"
              rows="3"
              placeholder="Kratki opis problema"
              class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 resize-none"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Prioritet</label>
            <select
              v-model="forma.prioritet"
              class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
            >
              <option value="nizak">Nizak</option>
              <option value="srednji">Normalni</option>
              <option value="visok">Visok</option>
              <option value="kritičan">Kritičan</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rok</label>
            <div class="flex items-center gap-1.5">
              <input
                v-model="datumDan"
                type="number" placeholder="DD" min="1" max="31"
                class="w-14 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-center focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span class="text-gray-400 select-none">/</span>
              <input
                v-model="datumMjesec"
                type="number" placeholder="MM" min="1" max="12"
                class="w-14 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-center focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span class="text-gray-400 select-none">/</span>
              <input
                v-model="datumGodina"
                type="number" placeholder="YYYY" min="2024" max="2100"
                class="w-20 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-center focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div v-if="upozorenjeDatuma" class="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 space-y-2">
            <div class="flex items-start gap-2">
              <svg class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
              <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                Rok problema <strong>{{ formatDatumObican(upozorenjeDatuma.problemDate) }}</strong>
                premašuje rok projekta <strong>{{ formatDatumObican(upozorenjeDatuma.projektDate) }}</strong>.
              </p>
            </div>
            <button
              @click="pokaziProduljenje = !pokaziProduljenje"
              class="text-xs text-amber-700 dark:text-amber-300 font-medium underline underline-offset-2 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
            >
              {{ pokaziProduljenje ? 'Odustani od produženja' : 'Produži rok projekta' }}
            </button>
            <div v-if="pokaziProduljenje" class="pt-1 space-y-2">
              <p class="text-xs text-amber-600 dark:text-amber-400 font-medium">Novi rok projekta:</p>
              <div class="flex items-center gap-1.5">
                <input
                  v-model="noviDatumDan"
                  type="number" placeholder="DD" min="1" max="31"
                  class="w-14 border border-amber-200 dark:border-amber-700 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-amber-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span class="text-amber-400 select-none">/</span>
                <input
                  v-model="noviDatumMjesec"
                  type="number" placeholder="MM" min="1" max="12"
                  class="w-14 border border-amber-200 dark:border-amber-700 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-amber-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span class="text-amber-400 select-none">/</span>
                <input
                  v-model="noviDatumGodina"
                  type="number" placeholder="YYYY" min="2024" max="2100"
                  class="w-20 border border-amber-200 dark:border-amber-700 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-amber-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  @click="produljRokProjekta"
                  class="ml-1 px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Potvrdi
                </button>
              </div>
              <p v-if="produljenjeGreska" class="text-xs text-red-500">{{ produljenjeGreska }}</p>
            </div>
          </div>
        </div>

        <p v-if="formaGreska" class="text-xs text-red-500 mt-3">{{ formaGreska }}</p>

        <div class="flex justify-end gap-3 mt-6">
          <button @click="zatvoriModal" class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Odustani</button>
          <button
            @click="spremiProblem"
            :disabled="sprema"
            class="px-5 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {{ sprema ? 'Spremanje...' : (aktivniProblem ? 'Spremi' : 'Kreiraj') }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useProjektiStore } from '@/stores/projektiStore'
import {
  dohvatiSveProbleme,
  kreirajProblem,
  azurirajProblem,
  obrisiProblem,
  PRIORITETI
} from '@/services/problemService'
import { dohvatiKomentare } from '@/services/komentarService'

const route  = useRoute()
const router = useRouter()
const authStore    = useAuthStore()
const projektiStore = useProjektiStore()

const projektId = route.params.projektId

const problemi     = ref([])
const ucitavanje   = ref(true)
const sortir       = ref('najnovije')
const pretraga     = ref('')
const otvoreniMeni = ref(null)

const prikazModal  = ref(false)
const aktivniProblem = ref(null)
const forma        = ref(praznaForma())
const formaGreska  = ref('')
const sprema       = ref(false)
const datumDan     = ref('')
const datumMjesec  = ref('')
const datumGodina  = ref('')

const pokaziProduljenje = ref(false)
const noviDatumDan      = ref('')
const noviDatumMjesec   = ref('')
const noviDatumGodina   = ref('')
const produljenjeGreska = ref('')

const mozeDodati    = computed(() => authStore.jeAdministrator || authStore.jeTester || authStore.jeDeveloper)
const mozeMijenjati = computed(() => authStore.jeAdministrator)

const ZATVORENI_STATUSI = new Set(['zatvoren', 'riješen', 'odbijen'])
const PRIORITET_REDOSLJED = { 'kritičan': 4, visok: 3, srednji: 2, nizak: 1 }

function jeZatvoren(p) {
  return ZATVORENI_STATUSI.has(p.status)
}

function prioritetBoja(prioritet) {
  return {
    'kritičan': 'bg-red-500',
    visok:      'bg-orange-400',
    srednji:    'bg-amber-400',
    nizak:      'bg-gray-300'
  }[prioritet] ?? 'bg-gray-200'
}

function praznaForma() {
  return { naslov: '', opis: '', prioritet: PRIORITETI.SREDNJI }
}

function datumZavrsetkaISO() {
  if (!datumDan.value || !datumMjesec.value || !datumGodina.value) return ''
  const dd = String(datumDan.value).padStart(2, '0')
  const mm = String(datumMjesec.value).padStart(2, '0')
  return `${datumGodina.value}-${mm}-${dd}`
}

function resetirajDatum() {
  datumDan.value = ''
  datumMjesec.value = ''
  datumGodina.value = ''
}

const upozorenjeDatuma = computed(() => {
  const projekt = projektiStore.aktivniProjekt
  if (!projekt?.datumZavrsetka) return null
  const iso = datumZavrsetkaISO()
  if (!iso) return null
  const problemDate = new Date(iso)
  const projektDate = projekt.datumZavrsetka.toDate
    ? projekt.datumZavrsetka.toDate()
    : new Date(projekt.datumZavrsetka)
  if (problemDate > projektDate) return { problemDate, projektDate }
  return null
})

function formatDatumObican(d) {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}.`
}

watch(pokaziProduljenje, (val) => {
  if (val && upozorenjeDatuma.value) {
    const d = upozorenjeDatuma.value.problemDate
    noviDatumDan.value    = d.getDate()
    noviDatumMjesec.value = d.getMonth() + 1
    noviDatumGodina.value = d.getFullYear()
    produljenjeGreska.value = ''
  }
})

async function produljRokProjekta() {
  produljenjeGreska.value = ''
  if (!noviDatumDan.value || !noviDatumMjesec.value || !noviDatumGodina.value) {
    produljenjeGreska.value = 'Unesite datum.'
    return
  }
  const dd = String(noviDatumDan.value).padStart(2, '0')
  const mm = String(noviDatumMjesec.value).padStart(2, '0')
  const noviIso = `${noviDatumGodina.value}-${mm}-${dd}`
  if (new Date(noviIso) < new Date(datumZavrsetkaISO())) {
    produljenjeGreska.value = 'Novi rok projekta mora biti na datum roka problema ili nakon njega.'
    return
  }
  await projektiStore.urediProjekt(projektId, { datumZavrsetka: noviIso })
  pokaziProduljenje.value = false
}

const filtrirani = computed(() => {
  let lista = [...problemi.value]

  if (pretraga.value.trim()) {
    const q = pretraga.value.toLowerCase()
    lista = lista.filter(
      p => p.naslov.toLowerCase().includes(q) || (p.opis ?? '').toLowerCase().includes(q)
    )
  }

  lista.sort((a, b) => {
    const aZ = jeZatvoren(a) ? 1 : 0
    const bZ = jeZatvoren(b) ? 1 : 0
    if (aZ !== bZ) return aZ - bZ

    if (sortir.value === 'najnovije') {
      return (b.datumPrijave?.seconds ?? 0) - (a.datumPrijave?.seconds ?? 0)
    }
    if (sortir.value === 'najstarije') {
      return (a.datumPrijave?.seconds ?? 0) - (b.datumPrijave?.seconds ?? 0)
    }
    if (sortir.value === 'naziv') {
      return a.naslov.localeCompare(b.naslov, 'hr')
    }
    if (sortir.value === 'prioritet_desc') {
      return (PRIORITET_REDOSLJED[b.prioritet] ?? 0) - (PRIORITET_REDOSLJED[a.prioritet] ?? 0)
    }
    if (sortir.value === 'prioritet_asc') {
      return (PRIORITET_REDOSLJED[a.prioritet] ?? 0) - (PRIORITET_REDOSLJED[b.prioritet] ?? 0)
    }
    return 0
  })

  return lista
})

function formatDatum(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  if (isNaN(d.getTime())) return '—'
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}.`
}

function formatStatus(s) {
  return {
    otvoren: 'Otvoren',
    'u tijeku': 'U tijeku',
    riješen: 'Završeno',
    zatvoren: 'Zatvoren',
    odbijen: 'Odbijen'
  }[s] ?? s
}

function toggleMeni(id) {
  otvoreniMeni.value = otvoreniMeni.value === id ? null : id
}

function zatvoriMeni() {
  otvoreniMeni.value = null
}

function navigirajNaProblem(problem) {
  router.push(`/projekti/${projektId}/problemi/${problem.id}`)
}

function zatvoriModal() {
  prikazModal.value = false
  aktivniProblem.value = null
  forma.value = praznaForma()
  formaGreska.value = ''
  resetirajDatum()
  pokaziProduljenje.value = false
  noviDatumDan.value = ''
  noviDatumMjesec.value = ''
  noviDatumGodina.value = ''
  produljenjeGreska.value = ''
  router.replace({ path: route.path })
}

function otvoriUredi(problem) {
  zatvoriMeni()
  aktivniProblem.value = problem
  forma.value = {
    naslov: problem.naslov,
    opis: problem.opis ?? '',
    prioritet: problem.prioritet
  }
  if (problem.datumZavrsetka) {
    const d = problem.datumZavrsetka.toDate()
    datumDan.value    = d.getDate()
    datumMjesec.value = d.getMonth() + 1
    datumGodina.value = d.getFullYear()
  } else {
    resetirajDatum()
  }
  prikazModal.value = true
}

async function spremiProblem() {
  formaGreska.value = ''
  if (!forma.value.naslov.trim()) {
    formaGreska.value = 'Naslov je obavezan.'
    return
  }
  if (upozorenjeDatuma.value) {
    formaGreska.value = `Rok problema ne može biti nakon roka projekta (${formatDatumObican(upozorenjeDatuma.value.projektDate)}).`
    return
  }
  sprema.value = true
  try {
    const podaci = { ...forma.value, datumZavrsetka: datumZavrsetkaISO() || null }
    if (aktivniProblem.value) {
      await azurirajProblem(projektId, aktivniProblem.value.id, podaci)
    } else {
      const uid = authStore.user.uid
      await kreirajProblem(projektId, {
        ...podaci,
        testerUid: authStore.jeTester ? uid : null,
        administratorUid: authStore.jeAdministrator ? uid : null,
        developerUid: null
      })
    }
    zatvoriModal()
    await ucitajProbleme()
  } finally {
    sprema.value = false
  }
}

async function potvrdiIzbris(id) {
  zatvoriMeni()
  if (!confirm('Jeste li sigurni da želite obrisati ovaj problem?')) return
  await obrisiProblem(projektId, id)
  await ucitajProbleme()
}

async function ucitajProbleme() {
  ucitavanje.value = true
  try {
    const svi = await dohvatiSveProbleme(projektId)
    problemi.value = await Promise.all(
      svi.map(async (p) => {
        const komentari = await dohvatiKomentare(projektId, p.id)
        return { ...p, brojKomentara: komentari.length }
      })
    )
  } finally {
    ucitavanje.value = false
  }
}

watch(
  () => route.query.dodaj,
  (val) => {
    if (val === '1' && mozeDodati.value) {
      prikazModal.value = true
      router.replace({ path: route.path })
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await projektiStore.postaviAktivniProjekt(projektId)
  await ucitajProbleme()
  document.addEventListener('click', zatvoriMeni)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', zatvoriMeni)
})
</script>
