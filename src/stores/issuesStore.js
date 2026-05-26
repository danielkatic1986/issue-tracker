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

export { STATUSI_PROBLEMA, PRIORITETI }

export const useIssuesStore = defineStore('issues', {
  state: () => ({
    problemi: [],           // svi problemi aktivnog projekta
    aktivniProblem: null,  // trenutno odabrani problem
    komentari: [],          // komentari aktivnog problema
    ucitavanje: false,
    greska: null
  }),

  getters: {
    problemiPoStatusu: (state) => (status) =>
      state.problemi.filter((p) => p.status === status),

    otvoreniProblemi: (state) =>
      state.problemi.filter((p) => p.status === STATUSI_PROBLEMA.OTVOREN),

    problemiUTijeku: (state) =>
      state.problemi.filter((p) => p.status === STATUSI_PROBLEMA.U_TIJEKU),

    rijeseniProblemi: (state) =>
      state.problemi.filter((p) => p.status === STATUSI_PROBLEMA.RIJEŠEN),

    problemPoId: (state) => (id) =>
      state.problemi.find((p) => p.id === id) ?? null
  },

  actions: {
    // ─────────────────────────────────────
    // PROBLEMI
    // ─────────────────────────────────────

    /**
     * Učitava sve probleme projekta iz Firestore-a.
     */
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

    /**
     * Postavlja aktivni (odabrani) problem i učitava njegove komentare.
     */
    async postaviAktivniProblem(projektId, problemId) {
      const lokalni = this.problemPoId(problemId)
      this.aktivniProblem = lokalni ?? await dohvatiProblem(projektId, problemId)
      await this.ucitajKomentare(projektId, problemId)
    },

    /**
     * Prijavljuje (kreira) novi problem na projektu.
     */
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

    /**
     * Ažurira problem (status, prioritet, opis...).
     */
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

    /**
     * Administrator dodjeljuje developera na problem.
     */
    async dodijeliDevelopera(projektId, problemId, developerUid, administratorUid) {
      await dodijeliDevelopera(projektId, problemId, developerUid, administratorUid)
      await this.urediProblem(projektId, problemId, {
        developerUid,
        administratorUid,
        status: STATUSI_PROBLEMA.U_TIJEKU
      })
    },

    /**
     * Briše problem.
     */
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

    // ─────────────────────────────────────
    // KOMENTARI
    // ─────────────────────────────────────

    /**
     * Učitava komentare aktivnog problema.
     */
    async ucitajKomentare(projektId, problemId) {
      this.greska = null
      try {
        this.komentari = await dohvatiKomentare(projektId, problemId)
      } catch (e) {
        this.greska = e.message
      }
    },

    /**
     * Dodaje komentar na problem.
     */
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

    /**
     * Ažurira tekst komentara.
     */
    async urediKomentar(projektId, problemId, komentarId, tekst) {
      await azurirajKomentar(projektId, problemId, komentarId, { tekst })
      const idx = this.komentari.findIndex((k) => k.id === komentarId)
      if (idx !== -1) this.komentari[idx] = { ...this.komentari[idx], tekst }
    },

    /**
     * Briše komentar.
     */
    async izbrisiKomentar(projektId, problemId, komentarId) {
      await obrisiKomentar(projektId, problemId, komentarId)
      this.komentari = this.komentari.filter((k) => k.id !== komentarId)
    },

    // ─────────────────────────────────────
    // PRIVITCI
    // ─────────────────────────────────────

    /**
     * Uploadira datoteku i dodaje je kao privitak komentara.
     * @param {File} datoteka
     */
    async dodajPrivitak(projektId, problemId, komentarId, datoteka) {
      const privitak = await dodajPrivitak(projektId, problemId, komentarId, datoteka)
      // Ažuriraj lokalni komentar da pokazuje privitak: true
      const idx = this.komentari.findIndex((k) => k.id === komentarId)
      if (idx !== -1) this.komentari[idx] = { ...this.komentari[idx], privitak: true }
      return privitak
    },

    /**
     * Dohvaća privitke komentara.
     */
    dohvatiPrivitke(projektId, problemId, komentarId) {
      return dohvatiPrivitke(projektId, problemId, komentarId)
    },

    /**
     * Briše privitak.
     */
    async izbrisiPrivitak(projektId, problemId, komentarId, privitkId, putanja) {
      await obrisiPrivitak(projektId, problemId, komentarId, privitkId, putanja)
    }
  }
})
