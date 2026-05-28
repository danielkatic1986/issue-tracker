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
    projekti: [],
    aktivniProjekt: null,
    ucitavanje: false,
    greska: null
  }),

  getters: {
    aktivniProjekti: (state) =>
      state.projekti.filter((p) => p.status === STATUSI_PROJEKTA.AKTIVAN),

    projektPoId: (state) => (id) =>
      state.projekti.find((p) => p.id === id) ?? null
  },

  actions: {
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

    async postaviAktivniProjekt(projektId) {
      // Pokušaj pronaći u lokalnom stanju
      const lokalniProjekt = this.projektPoId(projektId)
      if (lokalniProjekt) {
        this.aktivniProjekt = lokalniProjekt
        return
      }
      // Dohvati iz Firestore-a ako ga nema
      this.aktivniProjekt = await dohvatiProjekt(projektId)
    },

    async dodajProjekt(podaci) {
      this.greska = null
      try {
        const id = await kreirajProjekt(podaci)
        await this.ucitajProjekte() // osvježi listu
        return id
      } catch (e) {
        this.greska = e.message
        throw e
      }
    },

    async urediProjekt(projektId, podaci) {
      this.greska = null
      try {
        await azurirajProjekt(projektId, podaci)
        // Ažuriraj lokalno stanje
        const idx = this.projekti.findIndex((p) => p.id === projektId)
        if (idx !== -1) {
          this.projekti[idx] = { ...this.projekti[idx], ...podaci }
        }
        if (this.aktivniProjekt?.id === projektId) {
          this.aktivniProjekt = { ...this.aktivniProjekt, ...podaci }
        }
      } catch (e) {
        this.greska = e.message
        throw e
      }
    },

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
