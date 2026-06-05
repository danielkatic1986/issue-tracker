// Sve Firestore operacije vezane uz korisnike.
// Napomena: ovaj service upravlja profilima korisnika u Firestore bazi.
// Firebase Authentication (prijava, lozinka) je odvojen sustav — njime upravlja authStore.
// Dakle, svaki korisnik postoji na dva mjesta: u Firebase Authu (email + lozinka)
// i u Firestore kolekciji 'korisnici' (ime, prezime, uloge i sl.).

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

// Sve moguće korisničke uloge u aplikaciji
export const ULOGE = {
  ADMINISTRATOR: 'administrator',
  DEVELOPER: 'developer',
  TESTER: 'tester'
}

// Uloge su u starijoj verziji bile pohranjene kao string (uloga: 'developer'),
// a u novijoj kao niz (uloge: ['developer', 'tester']).
// Ova funkcija normalizira oba formata u niz kako ostatak aplikacije
// ne bi morao brinuti o tome koji format dolazi iz baze.
export function normalizirajUloge(profil) {
  if (!profil) return []
  if (Array.isArray(profil.uloge)) return profil.uloge
  if (profil.uloga) return [profil.uloga]
  return []
}

// Kreira profil korisnika u Firestore bazi nakon što je Firebase Auth stvorio account.
// Koristimo setDoc umjesto addDoc jer UID već znamo (dolazi iz Autha)
// i želimo da ID dokumenta bude točno taj UID — tako ih lako možemo povezati.
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

// Dohvati profil jednog korisnika po UID-u
export async function dohvatiKorisnika(uid) {
  const ref = doc(db, 'korisnici', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// Dohvati sve korisnike — koristi se u admin panelu za prikaz tablice korisnika
export async function dohvatiSveKorisnike() {
  const snap = await getDocs(collection(db, 'korisnici'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Dohvati korisnike koji imaju određenu ulogu.
// array-contains je Firestore operator koji provjerava sadrži li niz određenu vrijednost.
export async function dohvatiKorisniciPoUlozi(uloga) {
  const q = query(collection(db, 'korisnici'), where('uloge', 'array-contains', uloga))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Ažuriraj podatke korisnika — koristi se za promjenu uloga i statusa (aktivan/neaktivan)
export async function azurirajKorisnika(uid, podaci) {
  const ref = doc(db, 'korisnici', uid)
  await updateDoc(ref, podaci)
}

// Deaktiviraj korisnika — ne briše account iz Autha ni profil iz baze,
// samo postavlja aktivan: false što aplikacija koristi za blokiranje pristupa
export async function deaktivirajKorisnika(uid) {
  await azurirajKorisnika(uid, { aktivan: false })
}
