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
  Timestamp,
  query,
  where
} from 'firebase/firestore'

// Mogući statusi problema
export const STATUSI_PROBLEMA = {
  OTVOREN: 'otvoren',
  U_TIJEKU: 'u tijeku',
  RIJEŠEN: 'riješen',
  ZATVOREN: 'zatvoren',
  ODBIJEN: 'odbijen'
}

// Prioriteti problema
export const PRIORITETI = {
  NIZAK: 'nizak',
  SREDNJI: 'srednji',
  VISOK: 'visok',
  KRITICAN: 'kritičan'
}

/**
 * Kreira novi problem unutar projekta.
 * @param {string} projektId - ID projekta kojemu problem pripada
 * @param {object} podaci - podaci problema
 * @param {string} podaci.naslov
 * @param {string} podaci.opis
 * @param {string} podaci.status
 * @param {string} podaci.prioritet
 * @param {string} podaci.testerUid - UID testera koji je prijavio problem
 * @param {string|null} podaci.developerUid - UID developera koji radi na problemu
 * @param {string|null} podaci.administratorUid - UID administratora koji je dodijelio
 * @param {Date|string|null} podaci.datumZavrsetka
 */
export async function kreirajProblem(projektId, {
  naslov,
  opis,
  status = STATUSI_PROBLEMA.OTVOREN,
  prioritet = PRIORITETI.SREDNJI,
  testerUid = null,
  developerUid = null,
  administratorUid = null,
  datumZavrsetka = null
}) {
  const ref = await addDoc(collection(db, 'projekti', projektId, 'problemi'), {
    naslov,
    opis,
    status,
    prioritet,
    testerUid,
    developerUid,
    administratorUid,
    projektId,
    datumPrijave: serverTimestamp(),
    datumZavrsetka: datumZavrsetka ? Timestamp.fromDate(new Date(datumZavrsetka)) : null
  })
  return ref.id
}

/**
 * Dohvaća jedan problem iz projekta.
 */
export async function dohvatiProblem(projektId, problemId) {
  const ref = doc(db, 'projekti', projektId, 'problemi', problemId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

/**
 * Dohvaća sve probleme jednog projekta.
 */
export async function dohvatiSveProbleme(projektId) {
  const snap = await getDocs(collection(db, 'projekti', projektId, 'problemi'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Dohvaća probleme dodijeljene određenom developeru.
 */
export async function dohvatiProblemeZaDevelopera(projektId, developerUid) {
  const q = query(
    collection(db, 'projekti', projektId, 'problemi'),
    where('developerUid', '==', developerUid)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Dohvaća probleme koje je prijavio određeni tester.
 */
export async function dohvatiProblemeZaTestera(projektId, testerUid) {
  const q = query(
    collection(db, 'projekti', projektId, 'problemi'),
    where('testerUid', '==', testerUid)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Ažurira problem (npr. mijenja status, dodjeljuje developera...).
 */
export async function azurirajProblem(projektId, problemId, podaci) {
  const ref = doc(db, 'projekti', projektId, 'problemi', problemId)
  if (podaci.datumZavrsetka) {
    podaci.datumZavrsetka = Timestamp.fromDate(new Date(podaci.datumZavrsetka))
  }
  await updateDoc(ref, podaci)
}

/**
 * Dodjeljuje developera na problem (akcija administratora).
 */
export async function dodijeliDevelopera(projektId, problemId, developerUid, administratorUid) {
  await azurirajProblem(projektId, problemId, {
    developerUid,
    administratorUid,
    status: STATUSI_PROBLEMA.U_TIJEKU
  })
}

/**
 * Briše problem.
 */
export async function obrisiProblem(projektId, problemId) {
  const ref = doc(db, 'projekti', projektId, 'problemi', problemId)
  await deleteDoc(ref)
}
