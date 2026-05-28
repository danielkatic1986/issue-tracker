<template>
  <div class="p-6 flex flex-col gap-4">

    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-bold text-gray-900">Upravljanje korisnicima</h1>
      <button
        @click="prikazDodaj = true"
        class="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
      </button>
    </div>

    <div class="bg-white rounded-2xl overflow-hidden">

      <div v-if="ucitavanje" class="flex items-center justify-center h-48">
        <span class="text-sm text-gray-400">Učitavanje...</span>
      </div>

      <table v-else class="w-full">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="text-left text-xs font-medium text-gray-400 px-6 py-4">Korisnik</th>
            <th class="text-left text-xs font-medium text-gray-400 px-4 py-4">E-mail</th>
            <th class="text-left text-xs font-medium text-gray-400 px-4 py-4">Uloga</th>
            <th class="text-left text-xs font-medium text-gray-400 px-4 py-4">Status</th>
            <th class="text-left text-xs font-medium text-gray-400 px-4 py-4">Član od</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="k in korisnici"
            :key="k.id"
            class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
          >
            <td class="px-6 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full overflow-hidden shrink-0">
                  <img v-if="k.avatarUrl" :src="k.avatarUrl" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full bg-indigo-100 flex items-center justify-center">
                    <span class="text-xs font-bold text-indigo-600 select-none">{{ inicijaliZa(k) }}</span>
                  </div>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ k.ime }} {{ k.prezime }}</p>
                  <p v-if="k.id === authStore.user?.uid" class="text-xs text-gray-400">(vi)</p>
                </div>
              </div>
            </td>

            <td class="px-4 py-3 text-sm text-gray-500">{{ k.email }}</td>

            <td class="px-4 py-3">
              <select
                :value="k.uloga"
                :disabled="k.id === authStore.user?.uid || k.sprema"
                @change="promijeniUlogu(k, $event.target.value)"
                class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="administrator">Administrator</option>
                <option value="developer">Developer</option>
                <option value="tester">Tester</option>
              </select>
            </td>

            <td class="px-4 py-3">
              <button
                :disabled="k.id === authStore.user?.uid || k.sprema"
                @click="promijeniStatus(k)"
                :class="[
                  'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                  k.aktivan
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                ]"
              >
                <span :class="['w-1.5 h-1.5 rounded-full', k.aktivan ? 'bg-green-500' : 'bg-gray-400']" />
                {{ k.aktivan ? 'Aktivan' : 'Neaktivan' }}
              </button>
            </td>

            <td class="px-4 py-3 text-sm text-gray-400">{{ formatDatum(k.datumStvaranja) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- modal za novog korisnika -->
    <div
      v-if="prikazDodaj"
      class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      @click.self="zatvoriModal"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" @click.stop>
        <h2 class="text-lg font-semibold text-gray-800 mb-5">Novi korisnik</h2>

        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Ime *</label>
              <input
                v-model="forma.ime"
                type="text"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Prezime *</label>
              <input
                v-model="forma.prezime"
                type="text"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">E-mail *</label>
            <input
              v-model="forma.email"
              type="email"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">Lozinka * (min. 6 znakova)</label>
            <input
              v-model="forma.lozinka"
              type="password"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">Uloga</label>
            <select
              v-model="forma.uloga"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-gray-400"
            >
              <option value="administrator">Administrator</option>
              <option value="developer">Developer</option>
              <option value="tester">Tester</option>
            </select>
          </div>
        </div>

        <p v-if="formaGreska" class="text-xs text-red-500 mt-3">{{ formaGreska }}</p>

        <div class="flex justify-end gap-3 mt-6">
          <button @click="zatvoriModal" class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
            Odustani
          </button>
          <button
            @click="dodajKorisnika"
            :disabled="dodavanje"
            class="px-5 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {{ dodavanje ? 'Kreiranje...' : 'Kreiraj korisnika' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { useAuthStore } from '@/stores/authStore'
import { firebaseConfig } from '@/firebase'
import { dohvatiSveKorisnike, azurirajKorisnika, kreirajKorisnika } from '@/services/korisnikService'

const authStore = useAuthStore()
const korisnici  = ref([])
const ucitavanje = ref(true)

function inicijaliZa(k) {
  return ((k.ime?.charAt(0) ?? '') + (k.prezime?.charAt(0) ?? '')).toUpperCase() || '?'
}

function formatDatum(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  if (isNaN(d.getTime())) return '—'
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}.`
}

async function promijeniUlogu(korisnik, novaUloga) {
  if (korisnik.uloga === novaUloga) return
  korisnik.sprema = true
  try {
    await azurirajKorisnika(korisnik.id, { uloga: novaUloga })
    korisnik.uloga = novaUloga
  } finally {
    korisnik.sprema = false
  }
}

async function promijeniStatus(korisnik) {
  korisnik.sprema = true
  try {
    const noviStatus = !korisnik.aktivan
    await azurirajKorisnika(korisnik.id, { aktivan: noviStatus })
    korisnik.aktivan = noviStatus
  } finally {
    korisnik.sprema = false
  }
}

const prikazDodaj = ref(false)
const dodavanje   = ref(false)
const formaGreska = ref('')
const forma = ref(praznaForma())

function praznaForma() {
  return { ime: '', prezime: '', email: '', lozinka: '', uloga: 'developer' }
}

function zatvoriModal() {
  prikazDodaj.value = false
  formaGreska.value = ''
  forma.value = praznaForma()
}

const AUTH_GRESKE = {
  'auth/email-already-in-use': 'Korisnik s tim e-mailom već postoji.',
  'auth/invalid-email':        'Nevažeća e-mail adresa.',
  'auth/weak-password':        'Lozinka je preslaba (min. 6 znakova).',
}

async function dodajKorisnika() {
  formaGreska.value = ''

  if (!forma.value.ime.trim() || !forma.value.prezime.trim() || !forma.value.email.trim() || !forma.value.lozinka) {
    formaGreska.value = 'Sva polja su obavezna.'
    return
  }
  if (forma.value.lozinka.length < 6) {
    formaGreska.value = 'Lozinka mora imati najmanje 6 znakova.'
    return
  }

  dodavanje.value = true
  // Koristimo privremenu drugu Firebase instancu da ne odjavimo admina
  let tmpApp = null
  try {
    tmpApp = initializeApp(firebaseConfig, `new-user-${Date.now()}`)
    const tmpAuth = getAuth(tmpApp)

    const result = await createUserWithEmailAndPassword(tmpAuth, forma.value.email.trim(), forma.value.lozinka)
    const uid = result.user.uid

    await kreirajKorisnika(uid, {
      ime:     forma.value.ime.trim(),
      prezime: forma.value.prezime.trim(),
      email:   forma.value.email.trim(),
      uloga:   forma.value.uloga,
    })

    // Dodaj u lokalnu listu
    korisnici.value.push({
      id:             uid,
      ime:            forma.value.ime.trim(),
      prezime:        forma.value.prezime.trim(),
      email:          forma.value.email.trim(),
      uloga:          forma.value.uloga,
      aktivan:        true,
      datumStvaranja: null,
      sprema:         false,
    })

    zatvoriModal()
  } catch (e) {
    formaGreska.value = AUTH_GRESKE[e.code] ?? 'Greška pri kreiranju korisnika.'
  } finally {
    if (tmpApp) await deleteApp(tmpApp)
    dodavanje.value = false
  }
}

onMounted(async () => {
  try {
    const svi = await dohvatiSveKorisnike()
    korisnici.value = svi
      .map((k) => ({ ...k, sprema: false }))
      .sort((a, b) => {
        if (a.id === authStore.user?.uid) return -1
        if (b.id === authStore.user?.uid) return 1
        return a.ime.localeCompare(b.ime, 'hr')
      })
  } finally {
    ucitavanje.value = false
  }
})
</script>
