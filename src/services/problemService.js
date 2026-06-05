// Sve Firestore operacije vezane uz probleme (issues).
// Problemi su podkolekcija projekta, pa svaki poziv mora sadržavati projektId
// kako bi Firestore znao u kojoj se kolekciji nalazi: projekti/{projektId}/problemi

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

// Sve moguće vrijednosti statusa problema
export const STATUSI_PROBLEMA = {
  OTVOREN: 'otvoren',
  U_TIJEKU: 'u tijeku',
  RIJEŠEN: 'riješen',
  ZATVOREN: 'zatvoren',
  ODBIJEN: 'odbijen'
}

// Sve moguće razine prioriteta
export const PRIORITETI = {
  NIZAK: 'nizak',
  SREDNJI: 'srednji',
  VISOK: 'visok',
  KRITICAN: 'kritičan'
}

// Kreira novi problem unutar projekta.
// Problem pamti tko ga je prijavio (testerUid), kome je dodijeljen (developerUid)
// i tko ga je dodijelio (administratorUid) — sve kao Firebase UID-ovi.
// Zadane vrijednosti osiguravaju da problem uvijek ima status i prioritet čak i ako se ne proslijede.
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
    projektId, // spremamo i projektId direktno u dokument — olakšava dohvat s dashboarda gdje trebamo znati kojemu projektu problem pripada
    datumPrijave: serverTimestamp(),
    datumZavrsetka: datumZavrsetka ? Timestamp.fromDate(new Date(datumZavrsetka)) : null
  })
  return ref.id
}

// Dohvati jedan problem po ID-u unutar projekta
export async function dohvatiProblem(projektId, problemId) {
  const ref = doc(db, 'projekti', projektId, 'problemi', problemId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// Dohvati sve probleme jednog projekta
export async function dohvatiSveProbleme(projektId) {
  const snap = await getDocs(collection(db, 'projekti', projektId, 'problemi'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Dohvati samo probleme koji su dodijeljeni određenom developeru.
// where() je Firestore filter koji radi na razini baze — vraća samo odgovarajuće dokumente,
// a ne sve pa onda filtrira u JavaScriptu.
export async function dohvatiProblemeZaDevelopera(projektId, developerUid) {
  const q = query(
    collection(db, 'projekti', projektId, 'problemi'),
    where('developerUid', '==', developerUid)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Dohvati samo probleme koje je prijavio određeni tester
export async function dohvatiProblemeZaTestera(projektId, testerUid) {
  const q = query(
    collection(db, 'projekti', projektId, 'problemi'),
    where('testerUid', '==', testerUid)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Ažuriraj bilo koji podatak problema.
// zadnjaMijenjanja se automatski postavlja na trenutno vrijeme kod svake izmjene
// kako bi sučelje moglo prikazati kada je problem zadnji put uređivan.
export async function azurirajProblem(projektId, problemId, podaci) {
  const ref = doc(db, 'projekti', projektId, 'problemi', problemId)
  const payload = { ...podaci, zadnjaMijenjanja: serverTimestamp() }
  if (payload.datumZavrsetka) {
    payload.datumZavrsetka = Timestamp.fromDate(new Date(payload.datumZavrsetka))
  }
  await updateDoc(ref, payload)
}

// Dodjeli developera na problem i automatski postavi status na "U tijeku".
// Ovo je zapravo samo omotač oko azurirajProblem s unaprijed određenim podacima.
export async function dodijeliDevelopera(projektId, problemId, developerUid, administratorUid) {
  await azurirajProblem(projektId, problemId, {
    developerUid,
    administratorUid,
    status: STATUSI_PROBLEMA.U_TIJEKU
  })
}

// Obriši problem iz baze
export async function obrisiProblem(projektId, problemId) {
  const ref = doc(db, 'projekti', projektId, 'problemi', problemId)
  await deleteDoc(ref)
}
