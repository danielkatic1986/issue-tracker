<script setup>
// Detalji jednog problema: komentari, privitci i dodijeljeni članovi.
// Privitci nisu zasebni dokumenti — to su komentari koji imaju priloženu datoteku,
// pa se isti podaci prikazuju i u panelu komentara i u panelu privitaka.

import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useProjektiStore } from '@/stores/projektiStore'
import { dohvatiProblem, azurirajProblem } from '@/services/problemService'
import { dodajKomentar, dohvatiKomentare, obrisiKomentar } from '@/services/komentarService'
import { dohvatiKorisnika, dohvatiSveKorisnike, normalizirajUloge } from '@/services/korisnikService'

const route       = useRoute()
const authStore   = useAuthStore()
const projektiStore = useProjektiStore()

const projektId = route.params.projektId
const problemId = route.params.problemId

const problem              = ref(null)
const komentari            = ref([])
const korisnici            = ref({})   // cache uid → profil, popunjava se lazy
const sviKorisnici         = ref([])
const ucitavanjeKomentara  = ref(true)

const sortirKomentare      = ref('najnovije')
const pretragaKomentara    = ref('')
const pretragaPrivitaka    = ref('')
const otvoreniKomentarMeni = ref(null)

const prikazNoviKomentar   = ref(false)
const noviKomentarTekst    = ref('')
const novaKomentarDatoteka = ref(null)
const komentarGreska       = ref('')
const spremanjeKomentara   = ref(false)

const trenutniStatus    = ref('')
const trenutniPrioritet = ref('')

const otvoreniClanMeni      = ref(null)
const dodajClanaMeniOtvoren = ref(false)

const fileInput     = ref(null)
const uploadLoading = ref(false)
const uploadGreska  = ref('')

// Drag za vertikalno mijenjanje visine panela komentara (samo desktop)
const containerRef  = ref(null)
const commentHeight = ref(280)
const windowWidth   = ref(window.innerWidth)
const isMobile      = computed(() => windowWidth.value < 768)
let dragStartY = 0, dragStartH = 0

function onWindowResize() { windowWidth.value = window.innerWidth }

function startDrag(e) {
  dragStartY = e.clientY
  dragStartH = commentHeight.value
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  e.preventDefault()
}
function onDrag(e) {
  if (!containerRef.value) return
  const total = containerRef.value.getBoundingClientRect().height
  commentHeight.value = Math.max(80, Math.min(total - 80, dragStartH + (e.clientY - dragStartY)))
}
function stopDrag() {
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// Drag za horizontalno mijenjanje širine panela privitaka (samo desktop)
const bottomRef       = ref(null)
const privitciPercent = ref(50)
let hDragStartX = 0, hDragStartPct = 0

function startHDrag(e) {
  hDragStartX   = e.clientX
  hDragStartPct = privitciPercent.value
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onHDrag)
  document.addEventListener('mouseup', stopHDrag)
  e.preventDefault()
}
function onHDrag(e) {
  if (!bottomRef.value) return
  const total = bottomRef.value.getBoundingClientRect().width
  const delta = ((e.clientX - hDragStartX) / total) * 100
  privitciPercent.value = Math.max(20, Math.min(80, hDragStartPct + delta))
}
function stopHDrag() {
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onHDrag)
  document.removeEventListener('mouseup', stopHDrag)
}

// Lista članova izgrađena iz polja na dokumentu problema.
// administratorUid je "stalan" — prijavljivač/vlasnik koji se ne može ukloniti.
const clanovi = computed(() => {
  if (!problem.value) return []
  const lista = []
  if (problem.value.administratorUid) {
    lista.push({ uid: problem.value.administratorUid, datum: problem.value.datumPrijave, stalan: true })
  }
  if (problem.value.testerUid) {
    lista.push({ uid: problem.value.testerUid, datum: problem.value.datumPrijave })
  }
  if (problem.value.developerUid) {
    lista.push({ uid: problem.value.developerUid, datum: problem.value.developerDodanDatum ?? problem.value.datumPrijave })
  }
  return lista
})

const filtriranihKomentara = computed(() => {
  let lista = [...komentari.value]
  if (pretragaKomentara.value.trim()) {
    const q = pretragaKomentara.value.toLowerCase()
    lista = lista.filter(k => (k.tekst ?? '').toLowerCase().includes(q))
  }
  if (sortirKomentare.value === 'najnovije') {
    lista.sort((a, b) => (b.datumVrijeme?.seconds ?? 0) - (a.datumVrijeme?.seconds ?? 0))
  } else {
    lista.sort((a, b) => (a.datumVrijeme?.seconds ?? 0) - (b.datumVrijeme?.seconds ?? 0))
  }
  return lista
})

// Privitci su podskup komentara — oni koji imaju priloženu datoteku
const filtriranihPrivitaka = computed(() => {
  let lista = komentari.value.filter(k => k.privitak && k.privitakNaziv)
  if (pretragaPrivitaka.value.trim()) {
    const q = pretragaPrivitaka.value.toLowerCase()
    lista = lista.filter(k => (k.privitakNaziv ?? '').toLowerCase().includes(q))
  }
  return lista
})

// Korisnici se dohvaćaju po UID-u i keširaju lokalno — isti objekt koriste komentari i panel članova
function korisnikNaziv(uid) {
  if (!uid) return '—'
  const k = korisnici.value[uid]
  if (!k) return uid
  return `${k.ime} ${k.prezime}`
}

function formatUloga(profil) {
  const NAZIVI = { administrator: 'Administrator', developer: 'Developer', tester: 'Tester' }
  return normalizirajUloge(profil).map(u => NAZIVI[u] ?? u).join(', ')
}

function formatDatum(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  if (isNaN(d.getTime())) return '—'
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}.`
}

function formatDatumVrijeme(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  if (isNaN(d.getTime())) return '—'
  const datum   = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}.`
  const vrijeme = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${datum} ${vrijeme}`
}

function toggleKomentarMeni(id) {
  otvoreniKomentarMeni.value = otvoreniKomentarMeni.value === id ? null : id
}

function toggleClanMeni(uid) {
  otvoreniClanMeni.value = otvoreniClanMeni.value === uid ? null : uid
}

function toggleDodajClanaMeni() {
  dodajClanaMeniOtvoren.value = !dodajClanaMeniOtvoren.value
  if (dodajClanaMeniOtvoren.value && sviKorisnici.value.length === 0) {
    ucitajSveKorisnike()
  }
}

function zatvoriSveMeniji() {
  otvoreniKomentarMeni.value = null
  otvoreniClanMeni.value = null
  dodajClanaMeniOtvoren.value = false
}

// Administrator može brisati tuđe komentare; ostali samo svoje
function mozeBrisatiKomentar(k) {
  return authStore.jeAdministrator || k.korisnikUid === authStore.user?.uid
}

async function ucitajKorisnike(uids) {
  const nepoznati = uids.filter(uid => uid && !korisnici.value[uid])
  if (nepoznati.length === 0) return
  const rezultati = await Promise.all(nepoznati.map(uid => dohvatiKorisnika(uid)))
  rezultati.forEach((k, i) => {
    if (k) korisnici.value[nepoznati[i]] = k
  })
}

async function ucitajSveKorisnike() {
  sviKorisnici.value = await dohvatiSveKorisnike()
}

async function ucitajProblem() {
  problem.value = await dohvatiProblem(projektId, problemId)
  if (problem.value) {
    trenutniStatus.value    = problem.value.status
    trenutniPrioritet.value = problem.value.prioritet
    const uids = [problem.value.testerUid, problem.value.developerUid, problem.value.administratorUid].filter(Boolean)
    await ucitajKorisnike(uids)
  }
}

async function ucitajKomentare() {
  ucitavanjeKomentara.value = true
  try {
    komentari.value = await dohvatiKomentare(projektId, problemId)
    const uids = [...new Set(komentari.value.map(k => k.korisnikUid).filter(Boolean))]
    await ucitajKorisnike(uids)
  } finally {
    ucitavanjeKomentara.value = false
  }
}

function zatvoriKomentarModal() {
  prikazNoviKomentar.value = false
  noviKomentarTekst.value  = ''
  novaKomentarDatoteka.value = null
  komentarGreska.value = ''
}

function onKomentarDatoteka(e) {
  novaKomentarDatoteka.value = e.target.files?.[0] ?? null
}

async function spremiKomentar() {
  if (!noviKomentarTekst.value.trim()) {
    komentarGreska.value = 'Tekst komentara je obavezan.'
    return
  }
  spremanjeKomentara.value = true
  komentarGreska.value = ''
  try {
    await dodajKomentar(projektId, problemId, {
      tekst:      noviKomentarTekst.value.trim(),
      korisnikUid: authStore.user.uid,
      datoteka:   novaKomentarDatoteka.value
    })
    // Prazan azuriranje triggera zadnjaMijenjanja na problemu
    await azurirajProblem(projektId, problemId, {})
    zatvoriKomentarModal()
    await ucitajKomentare()
    problem.value = await dohvatiProblem(projektId, problemId)
  } catch (e) {
    komentarGreska.value = storageGreskaPoruka(e)
  } finally {
    spremanjeKomentara.value = false
  }
}

async function potvrdiIzbrisKomentara(komentarId) {
  otvoreniKomentarMeni.value = null
  if (!confirm('Obrisati komentar?')) return
  await obrisiKomentar(projektId, problemId, komentarId)
  await ucitajKomentare()
}

// Upload iz panela privitaka — kreira komentar čiji je tekst ime datoteke, privitak je sama datoteka
async function uploadPrivitak(e) {
  const datoteka = e.target.files?.[0]
  if (!datoteka) return
  uploadLoading.value = true
  uploadGreska.value  = ''
  try {
    await dodajKomentar(projektId, problemId, {
      tekst:      datoteka.name,
      korisnikUid: authStore.user.uid,
      datoteka
    })
    await azurirajProblem(projektId, problemId, {})
    await ucitajKomentare()
    problem.value = await dohvatiProblem(projektId, problemId)
  } catch (e) {
    uploadGreska.value = storageGreskaPoruka(e)
  } finally {
    uploadLoading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function storageGreskaPoruka(e) {
  return e?.message || 'Greška pri uploadu datoteke.'
}

// Status i prioritet mijenjaju se inline iz footera — <select> direktno šalje promjenu u Firestore
async function promijeniStatus() {
  if (!problem.value || trenutniStatus.value === problem.value.status) return
  await azurirajProblem(projektId, problemId, { status: trenutniStatus.value })
  problem.value = { ...problem.value, status: trenutniStatus.value }
}

async function promijeniPrioritet() {
  if (!problem.value || trenutniPrioritet.value === problem.value.prioritet) return
  await azurirajProblem(projektId, problemId, { prioritet: trenutniPrioritet.value })
  problem.value = { ...problem.value, prioritet: trenutniPrioritet.value }
}

async function dodajClana(korisnik) {
  dodajClanaMeniOtvoren.value = false
  if (!problem.value) return
  const podaci = {}
  const uloge = normalizirajUloge(korisnik)
  if (uloge.includes('developer')) {
    podaci.developerUid        = korisnik.id
    podaci.developerDodanDatum = new Date().toISOString()
  } else if (uloge.includes('tester')) {
    podaci.testerUid = korisnik.id
  } else {
    podaci.administratorUid = korisnik.id
  }
  await azurirajProblem(projektId, problemId, podaci)
  await ucitajProblem()
}

async function ukloniClana(clan) {
  otvoreniClanMeni.value = null
  if (!problem.value) return
  const podaci = {}
  if (clan.uid === problem.value.developerUid) {
    podaci.developerUid        = null
    podaci.developerDodanDatum = null
  } else if (clan.uid === problem.value.testerUid) {
    podaci.testerUid = null
  }
  await azurirajProblem(projektId, problemId, podaci)
  await ucitajProblem()
}

onMounted(async () => {
  await projektiStore.postaviAktivniProjekt(projektId)
  await ucitajProblem()
  await ucitajKomentare()
  document.addEventListener('click', zatvoriSveMeniji)
  window.addEventListener('resize', onWindowResize)
  await nextTick()
  if (containerRef.value && !isMobile.value) {
    commentHeight.value = Math.round(containerRef.value.getBoundingClientRect().height * 0.55)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', zatvoriSveMeniji)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', onHDrag)
  document.removeEventListener('mouseup', stopHDrag)
  window.removeEventListener('resize', onWindowResize)
})
</script>

<template>
  <div class="flex flex-col gap-4 p-3 md:p-6 min-h-full md:h-full md:overflow-hidden md:gap-0">

    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 md:p-6 shrink-0 md:mb-4">
      <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
        <div class="min-w-0">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Problem: {{ problem?.naslov ?? '...' }}
          </h1>
          <p v-if="problem?.opis" class="text-sm text-gray-500 dark:text-gray-400 mt-1">Opis: {{ problem.opis }}</p>
        </div>
        <div class="flex flex-wrap gap-x-6 gap-y-2 md:shrink-0 text-sm">
          <div>
            <p class="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Datum prijave</p>
            <p class="text-gray-700 dark:text-gray-200 whitespace-nowrap">{{ formatDatumVrijeme(problem?.datumPrijave) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Rok</p>
            <p class="text-gray-700 dark:text-gray-200 whitespace-nowrap">{{ formatDatum(problem?.datumZavrsetka) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Zadnja izmjena</p>
            <p class="text-gray-700 dark:text-gray-200 whitespace-nowrap">{{ formatDatumVrijeme(problem?.zadnjaMijenjanja) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div ref="containerRef" class="flex flex-col gap-4 md:gap-0 md:flex-1 md:min-h-0 md:overflow-hidden">

    <div
      class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 md:p-6 flex flex-col overflow-hidden md:shrink-0"
      :style="isMobile ? {} : { height: commentHeight + 'px' }"
    >

      <div class="flex items-center justify-between mb-4 shrink-0 gap-2">
        <div class="flex items-center gap-2 shrink-0">
          <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100">Komentari</h2>
          <button
            @click="prikazNoviKomentar = true"
            class="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:border-gray-500 dark:hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>
        <div class="flex items-center gap-2 min-w-0">
          <div class="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800 text-sm shrink-0">
            <span class="hidden md:inline px-3 py-1.5 text-gray-400 dark:text-gray-500">Sortiraj kao</span>
            <div class="hidden md:block w-px self-stretch bg-gray-200 dark:bg-gray-600" />
            <div class="relative">
              <select v-model="sortirKomentare" class="appearance-none pl-2 md:pl-3 pr-7 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer text-sm">
                <option value="najnovije">Najnovije</option>
                <option value="najstarije">Najstarije</option>
              </select>
              <svg class="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>
          <div class="relative">
            <input
              v-model="pretragaKomentara"
              type="text"
              placeholder="Pretraga"
              class="border border-gray-200 dark:border-gray-600 rounded-lg pl-3 md:pl-4 pr-8 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-gray-300 dark:focus:border-gray-500 w-24 md:w-44"
            />
            <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <div v-if="ucitavanjeKomentara" class="text-sm text-gray-400 dark:text-gray-500 py-4">Učitavanje...</div>
      <div v-else-if="filtriranihKomentara.length === 0" class="text-sm text-gray-400 dark:text-gray-500 py-4">Nema komentara.</div>
      <div v-else class="flex flex-col gap-2 flex-1 overflow-y-auto min-h-0 pr-1">
        <div
          v-for="k in filtriranihKomentara"
          :key="k.id"
          class="bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl px-3 py-2.5"
        >
          <div class="flex items-center justify-between gap-2 mb-1">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0">{{ formatDatum(k.datumVrijeme) }}</span>
              <span class="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{{ korisnikNaziv(k.korisnikUid) }}</span>
            </div>
            <div v-if="mozeBrisatiKomentar(k)" class="relative shrink-0">
              <button
                @click.stop="toggleKomentarMeni(k.id)"
                class="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-300 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <svg class="w-1 h-3.5" fill="currentColor" viewBox="0 0 4 20">
                  <circle cx="2" cy="2" r="2"/><circle cx="2" cy="10" r="2"/><circle cx="2" cy="18" r="2"/>
                </svg>
              </button>
              <div
                v-if="otvoreniKomentarMeni === k.id"
                class="absolute right-0 top-7 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg py-1 z-10 w-28"
              >
                <button @click.stop="potvrdiIzbrisKomentara(k.id)" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700">Obriši</button>
              </div>
            </div>
          </div>

          <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{{ k.tekst }}</p>

          <a
            v-if="k.privitak && k.privitakUrl"
            :href="k.privitakUrl"
            target="_blank"
            rel="noopener"
            class="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
            @click.stop
          >
            <svg class="w-3.5 h-3.5 text-gray-400 dark:text-gray-400 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/>
            </svg>
            <span class="text-xs text-gray-600 dark:text-gray-300 max-w-48 truncate">{{ k.privitakNaziv }}</span>
          </a>
        </div>
      </div>
    </div>

    <div
      v-if="!isMobile"
      @mousedown="startDrag"
      class="h-3 shrink-0 flex items-center justify-center cursor-row-resize group select-none"
    >
      <div class="w-12 h-1 rounded-full bg-gray-200 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-400 transition-colors duration-150" />
    </div>

    <div
      ref="bottomRef"
      class="flex flex-col gap-4 md:flex-row md:gap-0 md:flex-1 md:min-h-0 md:overflow-hidden"
    >

      <div
        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 md:p-6 flex flex-col overflow-hidden md:shrink-0"
        :style="isMobile ? {} : { width: privitciPercent + '%' }"
      >
        <div class="flex items-center justify-between mb-4 shrink-0">
          <div class="flex items-center gap-2">
            <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100">Privitci</h2>
            <button
              :disabled="uploadLoading"
              @click="fileInput?.click()"
              class="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:border-gray-500 dark:hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg v-if="!uploadLoading" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              <svg v-else class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            </button>
            <input ref="fileInput" type="file" class="hidden" @change="uploadPrivitak" />
          </div>
          <div class="relative">
            <input v-model="pretragaPrivitaka" type="text" placeholder="Pretraga" class="border border-gray-200 dark:border-gray-600 rounded-lg pl-4 pr-10 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-gray-300 dark:focus:border-gray-500 w-36" />
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>
        <p v-if="uploadGreska" class="text-xs text-red-500 mb-2 shrink-0">{{ uploadGreska }}</p>
        <div v-if="uploadLoading" class="text-sm text-gray-400 dark:text-gray-500 shrink-0">Uploadovanje...</div>
        <div v-else-if="filtriranihPrivitaka.length === 0" class="text-sm text-gray-400 dark:text-gray-500">Nema privitaka.</div>
        <div v-else class="flex-1 overflow-y-auto min-h-0 space-y-1">
          <a
            v-for="p in filtriranihPrivitaka"
            :key="p.id"
            :href="p.privitakUrl"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="w-8 h-8 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-gray-400 dark:text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{{ p.privitakNaziv }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-500">{{ formatDatumVrijeme(p.datumVrijeme) }}</p>
            </div>
          </a>
        </div>
      </div>

      <div
        v-if="!isMobile"
        @mousedown="startHDrag"
        class="w-3 shrink-0 flex items-center justify-center cursor-col-resize group select-none"
      >
        <div class="h-12 w-1 rounded-full bg-gray-200 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-400 transition-colors duration-150" />
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 md:p-6 flex flex-col overflow-hidden md:flex-1 md:min-w-0">
        <div class="flex items-center justify-between mb-4 shrink-0">
          <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100">Članovi</h2>
          <div v-if="authStore.jeAdministrator" class="relative">
            <button
              @click.stop="toggleDodajClanaMeni"
              class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Dodaj
              <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div
              v-if="dodajClanaMeniOtvoren"
              class="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg py-1 z-10 w-52 max-h-48 overflow-y-auto"
            >
              <div v-if="sviKorisnici.length === 0" class="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">Učitavanje...</div>
              <template v-for="k in sviKorisnici" :key="k.id">
                <button
                  v-if="!normalizirajUloge(k).includes('administrator')"
                  @click.stop="dodajClana(k)"
                  class="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <div class="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <span class="text-xs font-bold text-indigo-600">{{ (k.ime[0] ?? '') + (k.prezime?.[0] ?? '') }}</span>
                  </div>
                  <span class="truncate">{{ k.ime }} {{ k.prezime }}</span>
                  <span class="text-xs text-gray-400 dark:text-gray-500 ml-auto shrink-0">{{ formatUloga(k) }}</span>
                </button>
              </template>
            </div>
          </div>
        </div>
        <div v-if="clanovi.length === 0" class="text-sm text-gray-400 dark:text-gray-500">Nema dodijeljenih članova.</div>
        <div v-else class="flex-1 overflow-y-auto min-h-0 space-y-1">
          <div
            v-for="clan in clanovi"
            :key="clan.uid"
            class="flex items-center gap-3 py-2"
          >
            <div class="relative shrink-0">
              <div :class="clan.stalan ? 'bg-amber-100' : 'bg-gray-100 dark:bg-gray-600'" class="w-8 h-8 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4" :class="clan.stalan ? 'text-amber-500' : 'text-gray-400 dark:text-gray-400'" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                </svg>
              </div>
              <div v-if="clan.stalan" class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 19l2-9 5 4 3-7 3 7 5-4 2 9H2z"/>
                </svg>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ korisnikNaziv(clan.uid) }}</p>
              <p class="text-xs" :class="clan.stalan ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'">
                {{ clan.stalan ? 'Administrator projekta' : formatUloga(korisnici[clan.uid]) }}
              </p>
            </div>
            <span class="text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap">{{ formatDatum(clan.datum) }}</span>
            <div v-if="authStore.jeAdministrator && !clan.stalan" class="relative">
              <button @click.stop="toggleClanMeni(clan.uid)" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <svg class="w-1 h-4 text-gray-400" fill="currentColor" viewBox="0 0 4 20">
                  <circle cx="2" cy="2" r="2"/><circle cx="2" cy="10" r="2"/><circle cx="2" cy="18" r="2"/>
                </svg>
              </button>
              <div v-if="otvoreniClanMeni === clan.uid" class="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg py-1 z-10 w-32">
                <button @click.stop="ukloniClana(clan)" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700">Ukloni</button>
              </div>
            </div>
            <div v-else-if="authStore.jeAdministrator && clan.stalan" class="w-7" />
          </div>
        </div>
      </div>
    </div>

    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm px-4 md:px-8 py-4 md:py-5 flex items-center gap-6 md:gap-10 shrink-0 md:mt-4">
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Status</span>
        <div class="relative">
          <select v-model="trenutniStatus" @change="promijeniStatus" class="appearance-none pl-4 pr-8 py-2 text-base font-bold text-gray-800 dark:text-gray-100 bg-transparent border-none focus:outline-none cursor-pointer">
            <option value="otvoren">Otvoren</option>
            <option value="u tijeku">U tijeku</option>
            <option value="riješen">Završeno</option>
            <option value="zatvoren">Zatvoren</option>
            <option value="odbijen">Odbijen</option>
          </select>
          <svg class="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </div>
      <div class="w-px h-6 bg-gray-200 dark:bg-gray-600" />
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Prioritet</span>
        <div class="relative">
          <select v-model="trenutniPrioritet" @change="promijeniPrioritet" class="appearance-none pl-4 pr-8 py-2 text-base font-bold text-gray-800 dark:text-gray-100 bg-transparent border-none focus:outline-none cursor-pointer">
            <option value="nizak">Nizak</option>
            <option value="srednji">Normalni</option>
            <option value="visok">Visok</option>
            <option value="kritičan">Kritičan</option>
          </select>
          <svg class="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </div>
    </div>

    <div
      v-if="prikazNoviKomentar"
      class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      @click.self="zatvoriKomentarModal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6" @click.stop>
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-5">Novi komentar</h2>
        <div class="space-y-4">
          <textarea
            v-model="noviKomentarTekst"
            rows="4"
            placeholder="Napišite komentar..."
            class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 resize-none"
          />
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Privitak (opcionalno)</label>
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/>
                </svg>
                Odaberi datoteku
                <input type="file" class="hidden" @change="onKomentarDatoteka" />
              </label>
              <span v-if="novaKomentarDatoteka" class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-35">{{ novaKomentarDatoteka.name }}</span>
              <button v-if="novaKomentarDatoteka" @click="novaKomentarDatoteka = null" class="text-xs text-red-400 hover:text-red-600">Ukloni</button>
            </div>
          </div>
        </div>
        <p v-if="komentarGreska" class="text-xs text-red-500 mt-3">{{ komentarGreska }}</p>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="zatvoriKomentarModal" class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Odustani</button>
          <button
            @click="spremiKomentar"
            :disabled="spremanjeKomentara"
            class="px-5 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {{ spremanjeKomentara ? 'Slanje...' : 'Pošalji' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
