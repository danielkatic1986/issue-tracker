// Ovaj store drži listu svih projekata i pamti koji je projekt trenutno otvoren.
// Komponente ne pozivaju Firestore direktno — sve ide kroz ovaj store
// kako bi podaci bili na jednom mjestu i ne bi se duplirali u svakoj komponenti.

import { defineStore } from 'pinia'
import {
  kreirajProjekt,
  dohvatiSveProjekte,
  dohvatiProjekt,
  azurirajProjekt,
  obrisiProjekt,
  STATUSI_PROJEKTA
} from '@/services/projektService'

export { STATUSI_PROJEKTA }

export const useProjektiStore = defineStore('projekti', {
  state: () => ({
    projekti: [],          // puna lista svih projekata
    aktivniProjekt: null,  // projekt koji je trenutno otvoren (korisnik ga pregledava)
    ucitavanje: false,     // true dok čekamo odgovor iz baze — koristi se za prikaz loadera
    greska: null           // poruka greške ako nešto krene po zlu
  }),

  getters: {
    // Filtrira samo aktivne projekte — korisno za navigacijski izbornik i dashboard
    aktivniProjekti: (state) =>
      state.projekti.filter((p) => p.status === STATUSI_PROJEKTA.AKTIVAN),

    // Brzo pronađi projekt po ID-u unutar već učitane liste (bez novog poziva prema bazi)
    projektPoId: (state) => (id) =>
      state.projekti.find((p) => p.id === id) ?? null
  },

  actions: {
    // Dohvati sve projekte iz Firestore-a i spremi ih u lokalno stanje
    async ucitajProjekte() {
      this.ucitavanje = true
      this.greska = null
      try {
        this.projekti = await dohvatiSveProjekte()
      } catch (e) {
        this.greska = e.message
      } finally {
        this.ucitavanje = false
      }
    },

    // Postavlja koji je projekt "aktivan" kada korisnik uđe na stranicu projekta.
    // Prvo provjeri je li projekt već u lokalnoj listi — ako jest, nema potrebe ići u bazu.
    // Ako nije (npr. direktan link na URL), dohvati ga iz Firestore-a.
    async postaviAktivniProjekt(projektId) {
      const lokalniProjekt = this.projektPoId(projektId)
      if (lokalniProjekt) {
        this.aktivniProjekt = lokalniProjekt
        return
      }
      this.aktivniProjekt = await dohvatiProjekt(projektId)
    },

    // Kreiraj novi projekt u bazi i odmah osvježi lokalnu listu
    async dodajProjekt(podaci) {
      this.greska = null
      try {
        const id = await kreirajProjekt(podaci)
        await this.ucitajProjekte()
        return id
      } catch (e) {
        this.greska = e.message
        throw e
      }
    },

    // Spremi izmjene projekta u bazu i odmah ažuriraj lokalno stanje,
    // kako sučelje ne bi moralo čekati novi dohvat iz baze da bi prikazalo promjenu.
    async urediProjekt(projektId, podaci) {
      this.greska = null
      try {
        await azurirajProjekt(projektId, podaci)
        const idx = this.projekti.findIndex((p) => p.id === projektId)
        if (idx !== -1) {
          this.projekti[idx] = { ...this.projekti[idx], ...podaci }
        }
        // Ako je taj projekt trenutno otvoren, ažuriraj i aktivniProjekt
        if (this.aktivniProjekt?.id === projektId) {
          this.aktivniProjekt = { ...this.aktivniProjekt, ...podaci }
        }
      } catch (e) {
        this.greska = e.message
        throw e
      }
    },

    // Obriši projekt iz baze i ukloni ga iz lokalne liste.
    // Ako je upravo taj projekt bio aktivan, poništi i aktivniProjekt.
    async izbrisiProjekt(projektId) {
      this.greska = null
      try {
        await obrisiProjekt(projektId)
        this.projekti = this.projekti.filter((p) => p.id !== projektId)
        if (this.aktivniProjekt?.id === projektId) {
          this.aktivniProjekt = null
        }
      } catch (e) {
        this.greska = e.message
        throw e
      }
    }
  }
})
