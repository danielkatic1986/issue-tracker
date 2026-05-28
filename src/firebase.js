import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

export const firebaseConfig = {
  apiKey: "AIzaSyCa1uq8eXzxqIQNJqWq3V6XZewgYxbflVQ",
  authDomain: "issue-tracker-2c456.firebaseapp.com",
  projectId: "issue-tracker-2c456",
  storageBucket: "issue-tracker-2c456.firebasestorage.app",
  messagingSenderId: "835495655149",
  appId: "1:835495655149:web:0431abae6e2fd5cd46fee4"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
