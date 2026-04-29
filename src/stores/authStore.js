import { auth } from '@/firebase'
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null
    }),
    actions: {
        async login(email, password) {
            const result = await signInWithEmailAndPassword(auth, email, password)
            this.user = result.user
        },

        init() {
            return new Promise((resolve) => {
                onAuthStateChanged(auth, (user) => {
                    this.user = user
                    resolve()
                })
        })
}

    }
})
