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

// Mogući statusi projekta
export const STATUSI_PROJEKTA = {
  AKTIVAN: 'aktivan',
  ZAVRSEN: 'završen',
  PAUZIRAN: 'pauziran',
  OTKAZAN: 'otkazan'
}

/**
 * Kreira novi projekt u Firestore-u.
 */
export async function kreirajProjekt({ naziv, opis, datumZavrsetka, status = STATUSI_PROJEKTA.AKTIVAN }) {
  const ref = await addDoc(collection(db, 'projekti'), {
    naziv,
    opis,
    datumKreiranja: serverTimestamp(),
    datumZavrsetka: datumZavrsetka ? Timestamp.fromDate(new Date(datumZavrsetka)) : null,
    status
  })
  return ref.id
}

/**
 * Dohvaća jedan projekt po ID-u.
 * Vraća { id, ...data } ili null.
 */
export async function dohvatiProjekt(projektId) {
  const ref = doc(db, 'projekti', projektId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

/**
 * Dohvaća sve projekte.
 */
export async function dohvatiSveProjekte() {
  const snap = await getDocs(collection(db, 'projekti'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Ažurira podatke projekta.
 */
export async function azurirajProjekt(projektId, podaci) {
  const ref = doc(db, 'projekti', projektId)
  if (podaci.datumZavrsetka) {
    podaci.datumZavrsetka = Timestamp.fromDate(new Date(podaci.datumZavrsetka))
  }
  await updateDoc(ref, podaci)
}

/**
 * Briše projekt i sve njegove podkolekcije NE briše automatski —
 * za produkciju koristiti Cloud Functions. Ovdje brišemo samo dokument.
 */
export async function obrisiProjekt(projektId) {
  const ref = doc(db, 'projekti', projektId)
  await deleteDoc(ref)
}
