<script setup>
// Stranica s popisom svih projekata.
// Administrator može kreirati, uređivati i brisati projekte.
// Ostali korisnici vide popis i mogu kliknuti na projekt kako bi vidjeli probleme.

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import {
  dohvatiSveProjekte,
  kreirajProjekt,
  azurirajProjekt,
  obrisiProjekt,
  STATUSI_PROJEKTA
} from '@/services/projektService'
import { dohvatiSveProbleme } from '@/services/problemService'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router    = useRouter()

const projekti    = ref([])
const ucitavanje  = ref(true)
const sortir      = ref('najnovije')
const pretraga    = ref('')
const otvoreniMeni = ref(null)

const prikazDodaj = ref(false)
const prikazUredi = ref(false)
const aktivniId   = ref(null)
const forma       = ref(praznaForma())
const formaGreska = ref('')
const sprema      = ref(false)

// Datum je razbijen na tri odvojena polja jer koristimo custom input umjesto <input type="date">
const datumDan    = ref('')
const datumMjesec = ref('')
const datumGodina = ref('')

function praznaForma() {
  return { naziv: '', opis: '', status: STATUSI_PROJEKTA.AKTIVAN }
}

// Složi uneseni datum u ISO format (YYYY-MM-DD) koji Firestore servis očekuje
function datumZavrsetkaISO() {
  if (!datumDan.value || !datumMjesec.value || !datumGodina.value) return ''
  const dd = String(datumDan.value).padStart(2, '0')
  const mm = String(datumMjesec.value).padStart(2, '0')
  return `${datumGodina.value}-${mm}-${dd}`
}

function resetirajDatum() {
  datumDan.value    = ''
  datumMjesec.value = ''
  datumGodina.value = ''
}

// Filtriraj i sortiraj projekte prema pretrazi i odabranom načinu sortiranja
const filtrirani = computed(() => {
  let lista = [...projekti.value]

  if (pretraga.value.trim()) {
    const q = pretraga.value.toLowerCase()
    lista = lista.filter(
      (p) => p.naziv.toLowerCase().includes(q) || (p.opis ?? '').toLowerCase().includes(q)
    )
  }

  if (sortir.value === 'najnovije') {
    lista.sort((a, b) => (b.datumKreiranja?.seconds ?? 0) - (a.datumKreiranja?.seconds ?? 0))
  } else if (sortir.value === 'najstarije') {
    lista.sort((a, b) => (a.datumKreiranja?.seconds ?? 0) - (b.datumKreiranja?.seconds ?? 0))
  } else {
    lista.sort((a, b) => a.naziv.localeCompare(b.naziv, 'hr'))
  }

  return lista
})

// Pretvori Firestore Timestamp u čitljivi datum
function formatDatum(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  if (isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}.`
}

// Prijevod statusa iz internog koda u tekst za prikaz
function formatStatus(s) {
  return {
    [STATUSI_PROJEKTA.AKTIVAN]:  'U tijeku',
    [STATUSI_PROJEKTA.ZAVRSEN]:  'Završen',
    [STATUSI_PROJEKTA.PAUZIRAN]: 'Pauziran',
    [STATUSI_PROJEKTA.OTKAZAN]:  'Otkazan',
  }[s] ?? s
}

// Boja badge-a ovisno o statusu projekta
function statusBoja(s) {
  return {
    [STATUSI_PROJEKTA.AKTIVAN]:  'bg-blue-50 text-blue-600',
    [STATUSI_PROJEKTA.ZAVRSEN]:  'bg-green-50 text-green-600',
    [STATUSI_PROJEKTA.PAUZIRAN]: 'bg-amber-50 text-amber-600',
    [STATUSI_PROJEKTA.OTKAZAN]:  'bg-red-50 text-red-500',
  }[s] ?? 'bg-gray-100 text-gray-500'
}

// Otvori/zatvori kontekstni meni za projekt (uredi/obriši)
function toggleMeni(id) {
  otvoreniMeni.value = otvoreniMeni.value === id ? null : id
}

function zatvoriMeni() {
  otvoreniMeni.value = null
}

function otvoriProjekt(projekt) {
  if (!projekt.jeClan) return
  router.push(`/projekti/${projekt.id}`)
}

function zatvoriModal() {
  prikazDodaj.value = false
  prikazUredi.value = false
  aktivniId.value   = null
  forma.value       = praznaForma()
  formaGreska.value = ''
  resetirajDatum()
}

// Popuni formu s postojećim podacima projekta za uređivanje
function otvoriUredi(projekt) {
  zatvoriMeni()
  aktivniId.value = projekt.id
  forma.value = {
    naziv:  projekt.naziv,
    opis:   projekt.opis ?? '',
    status: projekt.status,
  }
  if (projekt.datumZavrsetka) {
    const d = projekt.datumZavrsetka.toDate()
    datumDan.value    = d.getDate()
    datumMjesec.value = d.getMonth() + 1
    datumGodina.value = d.getFullYear()
  } else {
    resetirajDatum()
  }
  prikazUredi.value = true
}

// Spremi novi ili uređeni projekt ovisno o tome koji modal je otvoren
async function spremiProjekt() {
  formaGreska.value = ''
  if (!forma.value.naziv.trim()) {
    formaGreska.value = 'Naziv projekta je obavezan.'
    return
  }
  sprema.value = true
  try {
    const podaci = { ...forma.value, datumZavrsetka: datumZavrsetkaISO() }
    if (prikazUredi.value) {
      await azurirajProjekt(aktivniId.value, podaci)
    } else {
      await kreirajProjekt(podaci)
    }
    zatvoriModal()
    await ucitajProjekte()
  } finally {
    sprema.value = false
  }
}

async function potvrdiIzbris(id) {
  zatvoriMeni()
  if (!confirm('Jeste li sigurni da želite obrisati ovaj projekt?')) return
  await obrisiProjekt(id)
  await ucitajProjekte()
}

// Dohvati projekte i za svaki dodatno učitaj broj problema jer se taj podatak prikazuje u tablici
async function ucitajProjekte() {
  ucitavanje.value = true
  try {
    const svi = await dohvatiSveProjekte()
    const uid = authStore.user?.uid
    projekti.value = await Promise.all(
      svi.map(async (p) => {
        const problemi = await dohvatiSveProbleme(p.id)
        const jeClan = authStore.jeAdministrator || problemi.some(
          (pr) => pr.administratorUid === uid || pr.testerUid === uid || pr.developerUid === uid
        )
        return { ...p, brojProblema: problemi.length, jeClan }
      })
    )
  } finally {
    ucitavanje.value = false
  }
}

// Listener za klik izvan menija — zatvara sve otvorene kontekstne menije
onMounted(() => {
  ucitajProjekte()
  document.addEventListener('click', zatvoriMeni)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', zatvoriMeni)
})
</script>

<template>
  <div class="p-6 h-full flex flex-col gap-4">

    <div class="flex items-center gap-3">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Projekti</h1>
      <button
        v-if="authStore.jeAdministrator"
        @click.stop="prikazDodaj = true"
        class="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:border-gray-500 dark:hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
      </button>
    </div>

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

      <div
        v-else-if="filtrirani.length === 0"
        class="flex flex-col items-center justify-center h-48 gap-2"
      >
        <svg class="w-10 h-10 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/>
        </svg>
        <p class="text-sm text-gray-400 dark:text-gray-500">
          {{ pretraga ? 'Nema rezultata pretrage' : 'Nema projekata' }}
        </p>
        <button
          v-if="!pretraga"
          @click.stop="prikazDodaj = true"
          class="text-xs text-blue-500 hover:text-blue-600 mt-1"
        >
          Dodaj prvi projekt
        </button>
      </div>

      <div v-else-if="false" />
      <template v-if="filtrirani.length > 0">

        <div class="lg:hidden divide-y divide-gray-50 dark:divide-gray-700">
          <div
            v-for="projekt in filtrirani"
            :key="'card-' + projekt.id"
            @click="otvoriProjekt(projekt)"
            class="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            :class="{ 'opacity-50': !projekt.jeClan }"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ projekt.naziv }}</p>
                  <span v-if="!projekt.jeClan" class="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 shrink-0">Niste član</span>
                </div>
                <p v-if="projekt.opis" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{{ projekt.opis }}</p>
                <div class="flex items-center gap-3 mt-2 flex-wrap">
                  <span class="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/>
                    </svg>
                    {{ projekt.brojProblema }} {{ projekt.brojProblema === 1 ? 'problem' : 'problema' }}
                  </span>
                  <span v-if="projekt.datumZavrsetka" class="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
                    </svg>
                    Rok: {{ formatDatum(projekt.datumZavrsetka) }}
                  </span>
                </div>
              </div>
              <div class="flex flex-col items-end gap-2 shrink-0">
                <span :class="statusBoja(projekt.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                  {{ formatStatus(projekt.status) }}
                </span>
                <div v-if="authStore.jeAdministrator" class="relative" @click.stop>
                  <button @click.stop="toggleMeni(projekt.id)" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <svg class="w-1 h-4 text-gray-400" fill="currentColor" viewBox="0 0 4 20">
                      <circle cx="2" cy="2" r="2"/><circle cx="2" cy="10" r="2"/><circle cx="2" cy="18" r="2"/>
                    </svg>
                  </button>
                  <div v-if="otvoreniMeni === projekt.id" class="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg py-1 z-10 w-32">
                    <button @click.stop="otvoriUredi(projekt)" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Uredi</button>
                    <button @click.stop="potvrdiIzbris(projekt.id)" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700">Obriši</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <table class="hidden lg:table w-full">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700">
              <th class="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-6 py-4">Naziv projekta</th>
              <th class="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-4">Opis</th>
              <th class="text-center text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-4">Problemi</th>
              <th class="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-4">Status</th>
              <th class="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-4 whitespace-nowrap">Kreiran</th>
              <th class="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-4">Rok</th>
              <th class="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-4">Akcije</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="projekt in filtrirani"
              :key="projekt.id"
              @click="otvoriProjekt(projekt)"
              class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              :class="{ 'opacity-50': !projekt.jeClan }"
            >
              <td class="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  {{ projekt.naziv }}
                  <span v-if="!projekt.jeClan" class="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500">Niste član</span>
                </div>
              </td>
              <td class="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-48 truncate">{{ projekt.opis || '—' }}</td>
              <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 text-center">{{ projekt.brojProblema }}</td>
              <td class="px-4 py-4">
                <span :class="statusBoja(projekt.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ formatStatus(projekt.status) }}</span>
              </td>
              <td class="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ formatDatum(projekt.datumKreiranja) }}</td>
              <td class="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ formatDatum(projekt.datumZavrsetka) }}</td>
              <td class="px-4 py-4" @click.stop>
                <div v-if="!authStore.jeAdministrator" class="relative group inline-block">
                  <button disabled class="w-7 h-7 flex items-center justify-center rounded-lg opacity-40 cursor-not-allowed">
                    <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <rect x="5" y="11" width="14" height="10" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 11V7a4 4 0 018 0v4"/>
                    </svg>
                  </button>
                  <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2.5 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    Samo administratori mogu uređivati projekte
                    <div class="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                  </div>
                </div>
                <div v-if="authStore.jeAdministrator" class="relative">
                  <button @click.stop="toggleMeni(projekt.id)" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <svg class="w-1 h-4 text-gray-400" fill="currentColor" viewBox="0 0 4 20">
                      <circle cx="2" cy="2" r="2"/><circle cx="2" cy="10" r="2"/><circle cx="2" cy="18" r="2"/>
                    </svg>
                  </button>
                  <div v-if="otvoreniMeni === projekt.id" class="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg py-1 z-10 w-32">
                    <button @click.stop="otvoriUredi(projekt)" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Uredi</button>
                    <button @click.stop="potvrdiIzbris(projekt.id)" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700">Obriši</button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

      </template>
    </div>

    <div
      v-if="prikazDodaj || prikazUredi"
      class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      @click.self="zatvoriModal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6" @click.stop>
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-5">
          {{ prikazUredi ? 'Uredi projekt' : 'Novi projekt' }}
        </h2>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Naziv projekta *</label>
            <input
              v-model="forma.naziv"
              type="text"
              placeholder="Unesite naziv"
              class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Opis</label>
            <textarea
              v-model="forma.opis"
              placeholder="Kratki opis projekta"
              rows="3"
              class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 resize-none"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
            <select
              v-model="forma.status"
              class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
            >
              <option value="aktivan">U tijeku</option>
              <option value="pauziran">Pauziran</option>
              <option value="završen">Završen</option>
              <option value="otkazan">Otkazan</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rok (datum završetka)</label>
            <div class="flex items-center gap-1.5">
              <input v-model="datumDan" type="number" placeholder="DD" min="1" max="31"
                class="w-14 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-center focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span class="text-gray-400 select-none">/</span>
              <input v-model="datumMjesec" type="number" placeholder="MM" min="1" max="12"
                class="w-14 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-center focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span class="text-gray-400 select-none">/</span>
              <input v-model="datumGodina" type="number" placeholder="YYYY" min="2024" max="2100"
                class="w-20 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-center focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>

        <p v-if="formaGreska" class="text-xs text-red-500 mt-3">{{ formaGreska }}</p>

        <div class="flex justify-end gap-3 mt-6">
          <button @click="zatvoriModal" class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            Odustani
          </button>
          <button @click="spremiProjekt" :disabled="sprema"
            class="px-5 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
            {{ sprema ? 'Spremanje...' : (prikazUredi ? 'Spremi' : 'Kreiraj') }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
