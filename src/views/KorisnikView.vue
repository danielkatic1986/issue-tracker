<template>
  <div class="p-6 flex flex-col gap-4 max-w-3xl">

    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Korisnički podaci</h1>

    <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 flex items-center gap-5">
      <div class="relative w-16 h-16 shrink-0 group">
        <div class="w-16 h-16 rounded-full overflow-hidden">
          <img
            v-if="authStore.profil?.avatarUrl"
            :src="authStore.profil.avatarUrl"
            class="w-full h-full object-cover"
          />
          <div
            v-else
            class="w-full h-full bg-indigo-100 flex items-center justify-center"
          >
            <span class="text-xl font-bold text-indigo-600 select-none">{{ inicijali }}</span>
          </div>
        </div>

        <button
          @click="$refs.avatarInput.click()"
          :disabled="avatarUcitavanje"
          class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <svg v-if="!avatarUcitavanje" class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
          </svg>
          <svg v-else class="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </button>

        <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="uploadAvatar" />
      </div>

      <div class="flex flex-col gap-1">
        <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ authStore.punoIme }}</p>
        <p class="text-sm text-gray-400 dark:text-gray-500">{{ authStore.user?.email }}</p>
        <div class="mt-1 flex flex-wrap gap-1">
          <span
            v-for="badge in ulogeBadges"
            :key="badge.label"
            :class="['inline-block text-xs font-medium px-2.5 py-0.5 rounded-full', badge.boja]"
          >
            {{ badge.label }}
          </span>
        </div>
      </div>
    </div>

    <p v-if="avatarGreska" class="text-xs text-red-500 -mt-2 px-1">{{ avatarGreska }}</p>

    <div class="grid grid-cols-2 gap-4">

      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 flex flex-col gap-4">
        <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Osobni podaci</h2>

        <div class="flex flex-col gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">Ime</label>
            <input v-model="forma.ime" type="text"
              class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">Prezime</label>
            <input v-model="forma.prezime" type="text"
              class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">E-mail</label>
            <input :value="authStore.user?.email" type="text" disabled
              class="w-full border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">Uloga</label>
            <input :value="ulogaLabelTekst" type="text" disabled
              class="w-full border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 cursor-not-allowed" />
          </div>
        </div>

        <p v-if="osobniGreska" class="text-xs text-red-500">{{ osobniGreska }}</p>
        <p v-if="osobniUspjeh" class="text-xs text-green-600">{{ osobniUspjeh }}</p>

        <button @click="spremiOsobne" :disabled="spremaOsobne"
          class="mt-auto w-full py-2 text-sm font-medium bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
          {{ spremaOsobne ? 'Spremanje...' : 'Spremi promjene' }}
        </button>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 flex flex-col gap-4">
        <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Promjena lozinke</h2>

        <div class="flex flex-col gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">Trenutna lozinka</label>
            <input v-model="lozinka.trenutna" type="password"
              class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">Nova lozinka</label>
            <input v-model="lozinka.nova" type="password"
              class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">Potvrda nove lozinke</label>
            <input v-model="lozinka.potvrda" type="password"
              class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500" />
          </div>
        </div>

        <p v-if="lozinkaGreska" class="text-xs text-red-500">{{ lozinkaGreska }}</p>
        <p v-if="lozinkaUspjeh" class="text-xs text-green-600">{{ lozinkaUspjeh }}</p>

        <button @click="promijeniLozinku" :disabled="spremaLozinku"
          class="mt-auto w-full py-2 text-sm font-medium bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
          {{ spremaLozinku ? 'Mijenjanje...' : 'Promijeni lozinku' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, storage } from '@/firebase'
import { useAuthStore } from '@/stores/authStore'
import { azurirajKorisnika, ULOGE, normalizirajUloge } from '@/services/korisnikService'

const authStore = useAuthStore()

const inicijali = computed(() => {
  const i = authStore.profil?.ime?.charAt(0) ?? ''
  const p = authStore.profil?.prezime?.charAt(0) ?? ''
  return (i + p).toUpperCase() || '?'
})

const ULOGA_META = {
  [ULOGE.ADMINISTRATOR]: { label: 'Administrator', boja: 'bg-violet-100 text-violet-700' },
  [ULOGE.DEVELOPER]:     { label: 'Developer',     boja: 'bg-blue-100 text-blue-700'    },
  [ULOGE.TESTER]:        { label: 'Tester',         boja: 'bg-green-100 text-green-700'  },
}

const ulogeBadges = computed(() =>
  normalizirajUloge(authStore.profil).map(u => ULOGA_META[u] ?? { label: u, boja: 'bg-gray-100 text-gray-600' })
)

const ulogaLabelTekst = computed(() =>
  ulogeBadges.value.map(b => b.label).join(', ') || '—'
)

const avatarUcitavanje = ref(false)
const avatarGreska = ref('')

async function uploadAvatar(event) {
  const file = event.target.files[0]
  if (!file) return

  const MAX_MB = 5
  if (file.size > MAX_MB * 1024 * 1024) {
    avatarGreska.value = `Slika je prevelika. Maksimalna veličina je ${MAX_MB} MB.`
    event.target.value = ''
    return
  }

  avatarGreska.value = ''
  avatarUcitavanje.value = true
  try {
    const path = `avatarji/${authStore.user.uid}/avatar`
    const fileRef = storageRef(storage, path)
    await uploadBytes(fileRef, file)
    const url = await getDownloadURL(fileRef)
    await azurirajKorisnika(authStore.user.uid, { avatarUrl: url })
    authStore.profil = { ...authStore.profil, avatarUrl: url }
  } catch {
    avatarGreska.value = 'Greška pri uploadu. Pokušajte ponovo.'
  } finally {
    avatarUcitavanje.value = false
    event.target.value = ''
  }
}

const forma = ref({
  ime:     authStore.profil?.ime     ?? '',
  prezime: authStore.profil?.prezime ?? '',
})
const osobniGreska = ref('')
const osobniUspjeh = ref('')
const spremaOsobne = ref(false)

async function spremiOsobne() {
  osobniGreska.value = ''
  osobniUspjeh.value = ''
  if (!forma.value.ime.trim() || !forma.value.prezime.trim()) {
    osobniGreska.value = 'Ime i prezime su obavezni.'
    return
  }
  spremaOsobne.value = true
  try {
    await azurirajKorisnika(authStore.user.uid, {
      ime:     forma.value.ime.trim(),
      prezime: forma.value.prezime.trim(),
    })
    authStore.profil = { ...authStore.profil, ime: forma.value.ime.trim(), prezime: forma.value.prezime.trim() }
    osobniUspjeh.value = 'Podaci su uspješno spremljeni.'
  } catch {
    osobniGreska.value = 'Greška pri spremanju. Pokušajte ponovo.'
  } finally {
    spremaOsobne.value = false
  }
}

const lozinka = ref({ trenutna: '', nova: '', potvrda: '' })
const lozinkaGreska = ref('')
const lozinkaUspjeh = ref('')
const spremaLozinku = ref(false)

const LOZINKA_GRESKE = {
  'auth/wrong-password':        'Trenutna lozinka nije ispravna.',
  'auth/invalid-credential':    'Trenutna lozinka nije ispravna.',
  'auth/too-many-requests':     'Previše pokušaja. Pokušajte kasnije.',
  'auth/weak-password':         'Nova lozinka je preslaba (min. 6 znakova).',
  'auth/requires-recent-login': 'Sesija je istekla. Odjavite se i prijavite ponovo.',
}

async function promijeniLozinku() {
  lozinkaGreska.value = ''
  lozinkaUspjeh.value = ''
  if (!lozinka.value.trenutna || !lozinka.value.nova || !lozinka.value.potvrda) {
    lozinkaGreska.value = 'Sva polja su obavezna.'
    return
  }
  if (lozinka.value.nova !== lozinka.value.potvrda) {
    lozinkaGreska.value = 'Nova lozinka i potvrda se ne podudaraju.'
    return
  }
  if (lozinka.value.nova.length < 6) {
    lozinkaGreska.value = 'Nova lozinka mora imati najmanje 6 znakova.'
    return
  }
  spremaLozinku.value = true
  try {
    const user = auth.currentUser
    const credential = EmailAuthProvider.credential(user.email, lozinka.value.trenutna)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, lozinka.value.nova)
    lozinka.value = { trenutna: '', nova: '', potvrda: '' }
    lozinkaUspjeh.value = 'Lozinka je uspješno promijenjena.'
  } catch (e) {
    lozinkaGreska.value = LOZINKA_GRESKE[e.code] ?? 'Greška pri promjeni lozinke.'
  } finally {
    spremaLozinku.value = false
  }
}
</script>
