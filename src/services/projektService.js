// Sve Firestore operacije vezane uz projekte.
// Komponente i store ne komuniciraju direktno s bazom — sve ide kroz ovaj service.

import { db } from '@/firebase'
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'

// Sve moguće vrijednosti statusa projekta — koristimo konstante umjesto golih stringova
// kako bismo izbjegli greške pri tipkanju (npr. 'Aktivan' vs 'aktivan')
export const STATUSI_PROJEKTA = {
  AKTIVAN: 'aktivan',
  ZAVRSEN: 'završen',
  PAUZIRAN: 'pauziran',
  OTKAZAN: 'otkazan'
}

// Kreira novi dokument u kolekciji 'projekti'.
// Datum završetka pretvaramo u Firestore Timestamp format jer baza ne prihvaća obični JS Date.
// serverTimestamp() za datum kreiranja znači da Firebase sam upiše točno vrijeme — ne oslanjamo se na sat korisnikovog računala.
export async function kreirajProjekt({ naziv, opis, datumZavrsetka, status = STATUSI_PROJEKTA.AKTIVAN }) {
  const ref = await addDoc(collection(db, 'projekti'), {
    naziv,
    opis,
    datumKreiranja: serverTimestamp(),
    datumZavrsetka: datumZavrsetka ? Timestamp.fromDate(new Date(datumZavrsetka)) : null,
    status
  })
  return ref.id // vraćamo ID novog dokumenta jer ga store treba za navigaciju
}

// Dohvati jedan projekt po ID-u. Vraća { id, ...podaci } ili null ako ne postoji.
// snap.exists() provjerava postoji li dokument u bazi prije nego pokušamo čitati podatke.
export async function dohvatiProjekt(projektId) {
  const ref = doc(db, 'projekti', projektId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// Dohvati sve projekte iz baze i pretvori ih u niz objekata s ID-om
export async function dohvatiSveProjekte() {
  const snap = await getDocs(collection(db, 'projekti'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Ažuriraj podatke projekta. Ako se mijenja datum završetka, mora se pretvoriti u Timestamp
// jer Firestore ne može pohraniti obični string ili JS Date direktno na isti način.
export async function azurirajProjekt(projektId, podaci) {
  const ref = doc(db, 'projekti', projektId)
  if (podaci.datumZavrsetka) {
    podaci.datumZavrsetka = Timestamp.fromDate(new Date(podaci.datumZavrsetka))
  }
  await updateDoc(ref, podaci)
}

// Briše samo dokument projekta — podkolekcije (problemi, komentari) ostaju u bazi!
// Firestore ne briše podkolekcije automatski. Za potpuno brisanje trebalo bi koristiti
// Firebase Cloud Functions, ali za ovu aplikaciju to nije implementirano.
export async function obrisiProjekt(projektId) {
  const ref = doc(db, 'projekti', projektId)
  await deleteDoc(ref)
}
