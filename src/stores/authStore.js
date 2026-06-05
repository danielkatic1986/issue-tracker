// Ovaj store upravlja stanjem prijavljenog korisnika kroz cijelu aplikaciju.
// Čuva dva podatka: Firebase user objekt (tehnički podaci o prijavi) i profil
// (ime, prezime, uloge i sl.) koji je pohranjen u Firestore bazi.

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
    user: null,    // Firebase user objekt — sadrži uid, email i slične tehničke podatke
    profil: null   // naš vlastiti zapis iz Firestore baze s imenom, prezimenom i ulogama
  }),

  getters: {
    // Jednostavna provjera je li netko prijavljen (user nije null)
    jeAutentificiran: (state) => !!state.user,

    // Provjere uloga — koriste se po cijeloj aplikaciji da bi znali što se smije prikazati
    jeAdministrator: (state) => normalizirajUloge(state.profil).includes(ULOGE.ADMINISTRATOR),
    jeDeveloper:     (state) => normalizirajUloge(state.profil).includes(ULOGE.DEVELOPER),
    jeTester:        (state) => normalizirajUloge(state.profil).includes(ULOGE.TESTER),

    // Vraća "Ime Prezime" za prikaz u sučelju, a ako profil nije učitan, padne na email
    punoIme: (state) =>
      state.profil ? `${state.profil.ime} ${state.profil.prezime}` : (state.user?.email ?? '')
  },

  actions: {
    // Prijava postojećeg korisnika — Firebase provjeri lozinku, a mi odmah dohvatimo profil iz baze
    async login(email, password) {
      const result = await signInWithEmailAndPassword(auth, email, password)
      this.user = result.user
      this.profil = await dohvatiKorisnika(result.user.uid)
    },

    // Registracija novog korisnika — Firebase kreira auth zapis, a mi dodajemo profil u Firestore
    async registracija(email, password, { ime, prezime, uloge = [ULOGE.DEVELOPER] }) {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      this.user = result.user
      await kreirajKorisnika(result.user.uid, { ime, prezime, email, uloge })
      this.profil = await dohvatiKorisnika(result.user.uid)
    },

    // Odjava — Firebase odjavi korisnika i očistimo lokalno stanje
    async logout() {
      await signOut(auth)
      this.user = null
      this.profil = null
    },

    // Ovo se poziva jednom pri pokretanju aplikacije (main.js).
    // Firebase asinkrono provjerava postoji li aktivna sesija (npr. korisnik je osvježio stranicu),
    // pa čekamo taj odgovor prije nego što aplikacija uopće krene s radom.
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
