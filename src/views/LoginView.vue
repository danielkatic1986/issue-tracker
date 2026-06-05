<script setup>
// Stranica za prijavu u aplikaciju.
// Šalje kredencijale authStoreu koji komunicira s Firebase Authom.

import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const email      = ref('')
const password   = ref('')
const greska     = ref('')
const ucitavanje = ref(false)

const authStore = useAuthStore()
const router    = useRouter()

// Firebase vraća error kodove umjesto čitljivih poruka, pa ih ovdje prevodimo
const poruckeGresaka = {
  'auth/invalid-credential':    'Pogrešan email ili lozinka.',
  'auth/user-not-found':        'Korisnik s tim emailom ne postoji.',
  'auth/wrong-password':        'Pogrešna lozinka.',
  'auth/too-many-requests':     'Previše neuspjelih pokušaja. Pokušajte kasnije.',
  'auth/user-disabled':         'Ovaj korisnički račun je deaktiviran.',
  'auth/network-request-failed':'Greška mreže. Provjerite internet vezu.'
}

// Poziva authStore.login() i preusmjerava na dashboard pri uspjehu
async function handleSubmit() {
  greska.value     = ''
  ucitavanje.value = true
  try {
    await authStore.login(email.value, password.value)
    router.push('/')
  } catch (e) {
    greska.value = poruckeGresaka[e.code] ?? 'Došlo je do greške. Pokušajte ponovo.'
  } finally {
    ucitavanje.value = false
  }
}
</script>

<template>
    <div class="w-full max-w-sm">
        <div class="flex justify-center mb-8">
            <img src="@/assets/logo.png" alt="BugTracker" class="h-40" />
        </div>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1">
                <label class="text-sm text-gray-600">Email</label>
                <input
                    type="email"
                    v-model="email"
                    name="email"
                    placeholder="harry@potter.hr"
                    class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-sm text-gray-600">Lozinka</label>
                <input
                    type="password"
                    v-model="password"
                    name="password"
                    placeholder="••••••••••••••••"
                    class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
            </div>

            <!-- Poruka greške -->
            <p v-if="greska" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {{ greska }}
            </p>

            <button
                type="submit"
                :disabled="ucitavanje"
                class="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded font-medium transition-colors"
            >
                {{ ucitavanje ? 'Prijava...' : 'Log In' }}
            </button>

            <RouterLink
              to="/zaboravljena-lozinka"
              class="text-sm text-center text-gray-500 underline hover:text-gray-700"
            >
              Zaboravili ste lozinku?
            </RouterLink>
        </form>
    </div>
</template>
