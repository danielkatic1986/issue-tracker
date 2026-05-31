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

const CLOUD_NAME     = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET  = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`

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
  return data.secure_url  // javni URL slike/datoteke
}

export async function dodajKomentar(projektId, problemId, { tekst, korisnikUid, datoteka = null }) {
  let privitak = false
  let privitekNaziv = null
  let privitekUrl = null

  if (datoteka) {
    privitekUrl   = await uploadNaCloudinary(datoteka)
    privitekNaziv = datoteka.name
    privitak = true
  }

  const ref = await addDoc(
    collection(db, 'projekti', projektId, 'problemi', problemId, 'komentari'),
    {
      tekst,
      korisnikUid,
      privitak,
      privitekNaziv,
      privitekUrl,
      datumVrijeme: serverTimestamp()
    }
  )
  return ref.id
}

export async function dohvatiKomentare(projektId, problemId) {
  const snap = await getDocs(
    collection(db, 'projekti', projektId, 'problemi', problemId, 'komentari')
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function dohvatiKomentar(projektId, problemId, komentarId) {
  const snap = await getDoc(
    doc(db, 'projekti', projektId, 'problemi', problemId, 'komentari', komentarId)
  )
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function azurirajKomentar(projektId, problemId, komentarId, { tekst }) {
  await updateDoc(
    doc(db, 'projekti', projektId, 'problemi', problemId, 'komentari', komentarId),
    { tekst }
  )
}

export async function obrisiKomentar(projektId, problemId, komentarId) {
  // Cloudinary brisanje zahtijeva server-side API secret — preskačemo, fajl ostaje na Cloudinary
  await deleteDoc(
    doc(db, 'projekti', projektId, 'problemi', problemId, 'komentari', komentarId)
  )
}

// Stubs
export async function dodajPrivitak() {}
export async function dohvatiPrivitke() { return [] }
export async function obrisiPrivitak() {}
