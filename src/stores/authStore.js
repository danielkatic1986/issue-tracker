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
    /**
     * Prijava postojećeg korisnika.
     */
    async login(email, password) {
      const result = await signInWithEmailAndPassword(auth, email, password)
      this.user = result.user
      this.profil = await dohvatiKorisnika(result.user.uid)
    },

    /**
     * Registracija novog korisnika + kreiranje Firestore profila.
     */
    async registracija(email, password, { ime, prezime, uloga = ULOGE.DEVELOPER }) {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      this.user = result.user
      await kreirajKorisnika(result.user.uid, { ime, prezime, email, uloga })
      this.profil = await dohvatiKorisnika(result.user.uid)
    },

    /**
     * Odjava korisnika.
     */
    async logout() {
      await signOut(auth)
      this.user = null
      this.profil = null
    },

    /**
     * Inicijalizacija — sluša promjene auth stanja (poziva se u main.js).
     * Vraća Promise koji se razrješava čim Firebase potvrdi stanje.
     */
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
