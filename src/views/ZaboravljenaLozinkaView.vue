<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'

const email = ref('')
const greska = ref('')
const uspjeh = ref(false)
const ucitavanje = ref(false)

const router = useRouter()

const poruckeGresaka = {
  'auth/user-not-found': 'Nema korisnika s tim email adresom.',
  'auth/invalid-email': 'Email adresa nije ispravna.',
  'auth/too-many-requests': 'Previše pokušaja. Pokušajte kasnije.',
  'auth/network-request-failed': 'Greška mreže. Provjerite internet vezu.'
}

async function handleSubmit() {
  greska.value = ''
  ucitavanje.value = true

  try {
    await sendPasswordResetEmail(auth, email.value)
    uspjeh.value = true
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

    <!-- Uspješno poslano -->
    <div v-if="uspjeh" class="flex flex-col gap-4 text-center">
      <div class="bg-green-50 border border-green-200 rounded p-4">
        <p class="text-green-700 font-medium mb-1">✅ Link je poslan!</p>
        <p class="text-sm text-green-600">
          Provjerite email <strong>{{ email }}</strong> i kliknite na link za resetiranje lozinke.
        </p>
      </div>
      <button
        @click="router.push('/login')"
        class="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-medium transition-colors"
      >
        Natrag na prijavu
      </button>
    </div>

    <!-- Forma za email -->
    <form v-else @submit.prevent="handleSubmit" class="flex flex-col gap-4">
      <div>
        <h1 class="text-xl font-bold text-gray-800">Zaboravili ste lozinku?</h1>
        <p class="text-sm text-gray-500 mt-1">
          Unesite svoj email i poslat ćemo vam link za resetiranje lozinke.
        </p>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm text-gray-600">Email</label>
        <input
          type="email"
          v-model="email"
          placeholder="harry@potter.hr"
          required
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
        {{ ucitavanje ? 'Slanje...' : 'Pošalji link' }}
      </button>

      <button
        type="button"
        @click="router.push('/login')"
        class="text-sm text-center text-gray-500 underline hover:text-gray-700"
      >
        ← Natrag na prijavu
      </button>
    </form>
  </div>
</template>
