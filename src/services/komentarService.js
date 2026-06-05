// Sve operacije vezane uz komentare i privitke na problemima.
// Komentari su podkolekcija problema: projekti/{projektId}/problemi/{problemId}/komentari
// Privitci se ne pohranjuju u Firestore nego na Cloudinary — u bazi ostaje samo URL.

import { db } from '@/firebase'
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore'

// Cloudinary pristupni podaci — čitaju se iz .env datoteke kako ne bi bili vidljivi u kodu
const CLOUD_NAME     = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET  = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`

// Uploada datoteku na Cloudinary i vraća javni URL.
// Koristimo "unsigned upload preset" što znači da upload ne zahtijeva tajni API ključ —
// sigurno je za frontend jer preset kontrolira što je dozvoljeno uploadati.
async function uploadNaCloudinary(datoteka) {
  const formData = new FormData()
  formData.append('file', datoteka)
  formData.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Upload nije uspio')
  }
  const data = await res.json()
  return data.secure_url // javni HTTPS link na uploadanu datoteku
}

// Dodaj novi komentar na problem. Ako je priložena datoteka, prvo je uploadamo na Cloudinary,
// a zatim u Firestore spremamo samo URL i naziv datoteke (ne samu datoteku).
export async function dodajKomentar(projektId, problemId, { tekst, korisnikUid, datoteka = null }) {
  let privitak = false
  let privitakNaziv = null
  let privitakUrl = null

  if (datoteka) {
    privitakUrl   = await uploadNaCloudinary(datoteka)
    privitakNaziv = datoteka.name
    privitak = true
  }

  const ref = await addDoc(
    collection(db, 'projekti', projektId, 'problemi', problemId, 'komentari'),
    {
      tekst,
      korisnikUid,
      privitak,       // boolean — ima li komentar privitak
      privitakNaziv,  // originalni naziv datoteke za prikaz
      privitakUrl,    // Cloudinary URL za preuzimanje
      datumVrijeme: serverTimestamp()
    }
  )
  return ref.id
}

// Dohvati sve komentare za zadani problem
export async function dohvatiKomentare(projektId, problemId) {
  const snap = await getDocs(
    collection(db, 'projekti', projektId, 'problemi', problemId, 'komentari')
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// Dohvati jedan komentar po ID-u
export async function dohvatiKomentar(projektId, problemId, komentarId) {
  const snap = await getDoc(
    doc(db, 'projekti', projektId, 'problemi', problemId, 'komentari', komentarId)
  )
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// Ažuriraj tekst komentara
export async function azurirajKomentar(projektId, problemId, komentarId, { tekst }) {
  await updateDoc(
    doc(db, 'projekti', projektId, 'problemi', problemId, 'komentari', komentarId),
    { tekst }
  )
}

// Briše komentar iz Firestore baze.
// Napomena: datoteka priložena uz komentar ostaje na Cloudinaryu jer brisanje s Cloudinaryja
// zahtijeva tajni API ključ koji ne smije biti na frontendu — to bi bio sigurnosni propust.
export async function obrisiKomentar(projektId, problemId, komentarId) {
  await deleteDoc(
    doc(db, 'projekti', projektId, 'problemi', problemId, 'komentari', komentarId)
  )
}

// Stub funkcije — implementacija nije dovršena, ali postoje kako store ne bi pucao pri pozivu
export async function dodajPrivitak() {}
export async function dohvatiPrivitke() { return [] }
export async function obrisiPrivitak() {}
