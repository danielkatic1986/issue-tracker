import { auth } from '@/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { defineStore } from 'pinia'
import { kreirajKorisnika, dohvatiKorisnika, ULOGE } from '@/services/korisnikService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Firebase Auth user objekt (uid, email, ...)
    user: null,
    // Firestore profil korisnika (ime, prezime, uloga, aktivan, ...)
    profil: null
  }),

  getters: {
    jeAutentificiran: (state) => !!state.user,
    jeAdministrator: (state) => state.profil?.uloga === ULOGE.ADMINISTRATOR,
    jeDeveloper: (state) => state.profil?.uloga === ULOGE.DEVELOPER,
    jeTester: (state) => state.profil?.uloga === ULOGE.TESTER,
    punoIme: (state) =>
      state.profil ? `${state.profil.ime} ${state.profil.prezime}` : (state.user?.email ?? '')
  },

  actions: {
    async login(email, password) {
      const result = await signInWithEmailAndPassword(auth, email, password)
      this.user = result.user
      this.profil = await dohvatiKorisnika(result.user.uid)
    },

    async registracija(email, password, { ime, prezime, uloga = ULOGE.DEVELOPER }) {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      this.user = result.user
      await kreirajKorisnika(result.user.uid, { ime, prezime, email, uloga })
      this.profil = await dohvatiKorisnika(result.user.uid)
    },

    async logout() {
      await signOut(auth)
      this.user = null
      this.profil = null
    },

    // čeka dok Firebase ne potvrdi auth stanje, onda razrješava Promise
    init() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          this.user = user
          if (user) {
            this.profil = await dohvatiKorisnika(user.uid)
          } else {
            this.profil = null
          }
          resolve()
        })
      })
    }
  }
})
