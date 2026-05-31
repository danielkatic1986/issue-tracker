import { auth } from '@/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { defineStore } from 'pinia'
import { kreirajKorisnika, dohvatiKorisnika, ULOGE, normalizirajUloge } from '@/services/korisnikService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    profil: null
  }),

  getters: {
    jeAutentificiran: (state) => !!state.user,
    jeAdministrator: (state) => normalizirajUloge(state.profil).includes(ULOGE.ADMINISTRATOR),
    jeDeveloper:     (state) => normalizirajUloge(state.profil).includes(ULOGE.DEVELOPER),
    jeTester:        (state) => normalizirajUloge(state.profil).includes(ULOGE.TESTER),
    punoIme: (state) =>
      state.profil ? `${state.profil.ime} ${state.profil.prezime}` : (state.user?.email ?? '')
  },

  actions: {
    async login(email, password) {
      const result = await signInWithEmailAndPassword(auth, email, password)
      this.user = result.user
      this.profil = await dohvatiKorisnika(result.user.uid)
    },

    async registracija(email, password, { ime, prezime, uloge = [ULOGE.DEVELOPER] }) {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      this.user = result.user
      await kreirajKorisnika(result.user.uid, { ime, prezime, email, uloge })
      this.profil = await dohvatiKorisnika(result.user.uid)
    },

    async logout() {
      await signOut(auth)
      this.user = null
      this.profil = null
    },

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
