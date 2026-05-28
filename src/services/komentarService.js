import { db, storage } from '@/firebase'
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
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'

export async function dodajKomentar(projektId, problemId, { tekst, korisnikUid, privitak = false }) {
  const ref = await addDoc(
    collection(db, 'projekti', projektId, 'problemi', problemId, 'komentari'),
    {
      tekst,
      korisnikUid,
      privitak,
      datumVrijeme: serverTimestamp()
    }
  )
  return ref.id
}

export async function dohvatiKomentare(projektId, problemId) {
  const snap = await getDocs(
    collection(db, 'projekti', projektId, 'problemi', problemId, 'komentari')
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function dohvatiKomentar(projektId, problemId, komentarId) {
  const ref = doc(db, 'projekti', projektId, 'problemi', problemId, 'komentari', komentarId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function azurirajKomentar(projektId, problemId, komentarId, { tekst }) {
  const ref = doc(db, 'projekti', projektId, 'problemi', problemId, 'komentari', komentarId)
  await updateDoc(ref, { tekst })
}

export async function obrisiKomentar(projektId, problemId, komentarId) {
  const ref = doc(db, 'projekti', projektId, 'problemi', problemId, 'komentari', komentarId)
  await deleteDoc(ref)
}

export async function dodajPrivitak(projektId, problemId, komentarId, datoteka) {
  // 1. Upload datoteke u Storage
  const putanja = `privitci/${projektId}/${problemId}/${komentarId}/${Date.now()}_${datoteka.name}`
  const fileRef = storageRef(storage, putanja)
  await uploadBytes(fileRef, datoteka)
  const url = await getDownloadURL(fileRef)

  // 2. Spremi meta-podatke u Firestore
  const fsRef = await addDoc(
    collection(
      db,
      'projekti', projektId,
      'problemi', problemId,
      'komentari', komentarId,
      'privitci'
    ),
    {
      naziv: datoteka.name,
      putanja,
      url,
      tip: datoteka.type,
      datumUploada: serverTimestamp()
    }
  )

  // 3. Označi komentar da ima privitke
  const komentarRef = doc(
    db, 'projekti', projektId, 'problemi', problemId, 'komentari', komentarId
  )
  await updateDoc(komentarRef, { privitak: true })

  return { id: fsRef.id, naziv: datoteka.name, putanja, url, tip: datoteka.type }
}

export async function dohvatiPrivitke(projektId, problemId, komentarId) {
  const snap = await getDocs(
    collection(
      db,
      'projekti', projektId,
      'problemi', problemId,
      'komentari', komentarId,
      'privitci'
    )
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function obrisiPrivitak(projektId, problemId, komentarId, privitkId, putanja) {
  // Briši iz Storage-a
  const fileRef = storageRef(storage, putanja)
  await deleteObject(fileRef)

  // Briši iz Firestore-a
  const ref = doc(
    db,
    'projekti', projektId,
    'problemi', problemId,
    'komentari', komentarId,
    'privitci', privitkId
  )
  await deleteDoc(ref)
}
