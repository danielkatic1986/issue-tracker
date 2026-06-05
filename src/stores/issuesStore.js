// Ovaj store upravlja problemima i njihovim komentarima.
// Drži listu problema za trenutno otvoreni projekt i komentare za trenutno otvoreni problem.

import { defineStore } from 'pinia'
import {
  kreirajProblem,
  dohvatiSveProbleme,
  dohvatiProblem,
  azurirajProblem,
  dodijeliDevelopera,
  obrisiProblem,
  STATUSI_PROBLEMA,
  PRIORITETI
} from '@/services/problemService'
import {
  dodajKomentar,
  dohvatiKomentare,
  azurirajKomentar,
  obrisiKomentar,
  dodajPrivitak,
  dohvatiPrivitke,
  obrisiPrivitak
} from '@/services/komentarService'

// Izvozimo konstante dalje kako bi ih komponente mogle uvesti iz jednog mjesta
export { STATUSI_PROBLEMA, PRIORITETI }

export const useIssuesStore = defineStore('issues', {
  state: () => ({
    problemi: [],          // svi problemi trenutno otvorenog projekta
    aktivniProblem: null,  // problem čiji su detalji trenutno otvoreni
    komentari: [],         // komentari aktivnog problema
    ucitavanje: false,
    greska: null
  }),

  getters: {
    // Opći getter koji filtrira probleme prema bilo kojem statusu koji mu proslijedimo
    problemiPoStatusu: (state) => (status) =>
      state.problemi.filter((p) => p.status === status),

    // Gotovi prečaci za najčešće korištene statuse
    otvoreniProblemi: (state) =>
      state.problemi.filter((p) => p.status === STATUSI_PROBLEMA.OTVOREN),

    problemiUTijeku: (state) =>
      state.problemi.filter((p) => p.status === STATUSI_PROBLEMA.U_TIJEKU),

    rijeseniProblemi: (state) =>
      state.problemi.filter((p) => p.status === STATUSI_PROBLEMA.RIJEŠEN),

    // Pronalazi problem po ID-u unutar već učitane liste
    problemPoId: (state) => (id) =>
      state.problemi.find((p) => p.id === id) ?? null
  },

  actions: {
    // Dohvaća sve probleme za zadani projekt iz Firestore-a
    async ucitajProbleme(projektId) {
      this.ucitavanje = true
      this.greska = null
      try {
        this.problemi = await dohvatiSveProbleme(projektId)
      } catch (e) {
        this.greska = e.message
      } finally {
        this.ucitavanje = false
      }
    },

    // Postavlja koji je problem "aktivan" kada korisnik otvori detalje.
    // Ako je problem već u lokalnoj listi, koristimo ga odmah bez poziva prema bazi.
    // Nakon toga odmah učitamo i komentare za taj problem.
    async postaviAktivniProblem(projektId, problemId) {
      const lokalni = this.problemPoId(problemId)
      this.aktivniProblem = lokalni ?? await dohvatiProblem(projektId, problemId)
      await this.ucitajKomentare(projektId, problemId)
    },

    // Kreiramo novi problem u bazi i osvježavamo lokalnu listu
    async prijaviProblem(projektId, podaci) {
      this.greska = null
      try {
        const id = await kreirajProblem(projektId, podaci)
        await this.ucitajProbleme(projektId)
        return id
      } catch (e) {
        this.greska = e.message
        throw e
      }
    },

    // Spremamo izmjene problema i ažuriramo lokalno stanje na dva mjesta:
    // u listi svih problema i u aktivniProblem (ako je taj problem trenutno otvoren).
    async urediProblem(projektId, problemId, podaci) {
      this.greska = null
      try {
        await azurirajProblem(projektId, problemId, podaci)
        const idx = this.problemi.findIndex((p) => p.id === problemId)
        if (idx !== -1) this.problemi[idx] = { ...this.problemi[idx], ...podaci }
        if (this.aktivniProblem?.id === problemId) {
          this.aktivniProblem = { ...this.aktivniProblem, ...podaci }
        }
      } catch (e) {
        this.greska = e.message
        throw e
      }
    },

    // Dodjelimo developera na problem i automatski mijenjamo status u "U tijeku"
    async dodijeliDevelopera(projektId, problemId, developerUid, administratorUid) {
      await dodijeliDevelopera(projektId, problemId, developerUid, administratorUid)
      await this.urediProblem(projektId, problemId, {
        developerUid,
        administratorUid,
        status: STATUSI_PROBLEMA.U_TIJEKU
      })
    },

    // Brišemo problem iz baze, uklanjamo ga iz lokalne liste i poništavamo aktivniProblem ako treba
    async izbrisiProblem(projektId, problemId) {
      this.greska = null
      try {
        await obrisiProblem(projektId, problemId)
        this.problemi = this.problemi.filter((p) => p.id !== problemId)
        if (this.aktivniProblem?.id === problemId) this.aktivniProblem = null
      } catch (e) {
        this.greska = e.message
        throw e
      }
    },

    // Dohvaćamo komentare za zadani problem iz Firestore-a
    async ucitajKomentare(projektId, problemId) {
      this.greska = null
      try {
        this.komentari = await dohvatiKomentare(projektId, problemId)
      } catch (e) {
        this.greska = e.message
      }
    },

    // Dodajemo novi komentar (s ili bez privitka) i odmah osvježavamo listu komentara
    async dodajKomentar(projektId, problemId, podaci) {
      this.greska = null
      try {
        const id = await dodajKomentar(projektId, problemId, podaci)
        await this.ucitajKomentare(projektId, problemId)
        return id
      } catch (e) {
        this.greska = e.message
        throw e
      }
    },

    // Uređuje tekst postojećeg komentara i ažurira ga u lokalnoj listi bez ponovnog dohvata
    async urediKomentar(projektId, problemId, komentarId, tekst) {
      await azurirajKomentar(projektId, problemId, komentarId, { tekst })
      const idx = this.komentari.findIndex((k) => k.id === komentarId)
      if (idx !== -1) this.komentari[idx] = { ...this.komentari[idx], tekst }
    },

    // Brisanje komentara i uklanjanje iz lokalne liste
    async izbrisiKomentar(projektId, problemId, komentarId) {
      await obrisiKomentar(projektId, problemId, komentarId)
      this.komentari = this.komentari.filter((k) => k.id !== komentarId)
    },

    // Dodaje privitak uz komentar i odmah označavamo taj komentar kao "ima privitak"
    async dodajPrivitak(projektId, problemId, komentarId, datoteka) {
      const privitak = await dodajPrivitak(projektId, problemId, komentarId, datoteka)
      const idx = this.komentari.findIndex((k) => k.id === komentarId)
      if (idx !== -1) this.komentari[idx] = { ...this.komentari[idx], privitak: true }
      return privitak
    },

    dohvatiPrivitke(projektId, problemId, komentarId) {
      return dohvatiPrivitke(projektId, problemId, komentarId)
    },

    async izbrisiPrivitak(projektId, problemId, komentarId, privitkId, putanja) {
      await obrisiPrivitak(projektId, problemId, komentarId, privitkId, putanja)
    }
  }
})
