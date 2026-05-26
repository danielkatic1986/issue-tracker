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

/**
 * Kreira profil korisnika u Firestore-u nakon registracije.
 * Lozinka se NE sprema ovdje — to radi Firebase Auth.
 */
export async function kreirajKorisnika(uid, { ime, prezime, email, uloga = ULOGE.DEVELOPER }) {
  const ref = doc(db, 'korisnici', uid)
  await setDoc(ref, {
    ime,
    prezime,
    email,
    uloga,
    aktivan: true,
    datumStvaranja: serverTimestamp()
  })
}

/**
 * Dohvaća profil jednog korisnika po UID-u.
 * Vraća { id, ...data } ili null ako ne postoji.
 */
export async function dohvatiKorisnika(uid) {
  const ref = doc(db, 'korisnici', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

/**
 * Dohvaća sve korisnike iz Firestore-a.
 */
export async function dohvatiSveKorisnike() {
  const snap = await getDocs(collection(db, 'korisnici'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Dohvaća sve korisnike određene uloge.
 */
export async function dohvatiKorisniciPoUlozi(uloga) {
  const q = query(collection(db, 'korisnici'), where('uloga', '==', uloga))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Ažurira podatke korisnika (ime, prezime, uloga, aktivan).
 */
export async function azurirajKorisnika(uid, podaci) {
  const ref = doc(db, 'korisnici', uid)
  await updateDoc(ref, podaci)
}

/**
 * Deaktivira korisnika (soft delete).
 */
export async function deaktivirajKorisnika(uid) {
  await azurirajKorisnika(uid, { aktivan: false })
}
