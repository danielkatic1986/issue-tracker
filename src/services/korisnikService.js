import { db } from '@/firebase'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore'

// Uloge korisnika
export const ULOGE = {
  ADMINISTRATOR: 'administrator',
  DEVELOPER: 'developer',
  TESTER: 'tester'
}

// Normalizira stari format (uloga: string) i novi (uloge: string[]) u niz
export function normalizirajUloge(profil) {
  if (!profil) return []
  if (Array.isArray(profil.uloge)) return profil.uloge
  if (profil.uloga) return [profil.uloga]
  return []
}

// lozinka se ne sprema ovdje, to je posao Firebase Autha
export async function kreirajKorisnika(uid, { ime, prezime, email, uloga, uloge }) {
  const finalUloge = uloge ?? (uloga ? [uloga] : [ULOGE.DEVELOPER])
  const ref = doc(db, 'korisnici', uid)
  await setDoc(ref, {
    ime,
    prezime,
    email,
    uloge: finalUloge,
    aktivan: true,
    datumStvaranja: serverTimestamp()
  })
}

export async function dohvatiKorisnika(uid) {
  const ref = doc(db, 'korisnici', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function dohvatiSveKorisnike() {
  const snap = await getDocs(collection(db, 'korisnici'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function dohvatiKorisniciPoUlozi(uloga) {
  const q = query(collection(db, 'korisnici'), where('uloge', 'array-contains', uloga))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function azurirajKorisnika(uid, podaci) {
  const ref = doc(db, 'korisnici', uid)
  await updateDoc(ref, podaci)
}

export async function deaktivirajKorisnika(uid) {
  await azurirajKorisnika(uid, { aktivan: false })
}
