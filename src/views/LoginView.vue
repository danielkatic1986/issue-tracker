<script setup>
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'vue-router';
import { ref } from 'vue'

const email = ref('')
const password = ref('')


const authStore = useAuthStore()
const router = useRouter()

async function handleSubmit() {
  await authStore.login(email.value, password.value)
  router.push('/')
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
            <button 
                type="submit"
                class="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-medium transition-colors"
            >
                Log In
            </button>

            <a href="#" class="text-sm text-center text-gray-500 underline">
                Zaboravili ste lozinku?
            </a>
        </form>
    </div>
</template>