import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { onValue, ref, remove, set, update } from 'firebase/database'
import { auth, database, googleProvider, isFirebaseConfigured } from './firebase'

const DEMO_USER = { uid: 'demo-user', displayName: '퍼센티', email: 'demo@percent.today' }
const STORE_KEY = 'today-percent-demo'
const getStore = () => JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
const saveStore = (store) => localStorage.setItem(STORE_KEY, JSON.stringify(store))

export function observeAuth(callback) {
  if (isFirebaseConfigured) return onAuthStateChanged(auth, callback)
  const notify = () => callback(sessionStorage.getItem('today-percent-active') ? DEMO_USER : null)
  notify()
  window.addEventListener('today-percent-auth', notify)
  return () => window.removeEventListener('today-percent-auth', notify)
}

export async function loginEmail(email, password, name) {
  if (!isFirebaseConfigured) {
    sessionStorage.setItem('today-percent-active', 'true')
    window.dispatchEvent(new Event('today-percent-auth'))
    return DEMO_USER
  }
  if (name) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName: name })
    return result.user
  }
  return (await signInWithEmailAndPassword(auth, email, password)).user
}

export async function loginSocial(provider) {
  if (provider !== 'google' && isFirebaseConfigured) {
    throw new Error(`${provider === 'kakao' ? '카카오' : '네이버'} 로그인은 Firebase Custom Token용 서버 설정이 필요합니다.`)
  }
  if (!isFirebaseConfigured) {
    sessionStorage.setItem('today-percent-active', 'true')
    window.dispatchEvent(new Event('today-percent-auth'))
    return DEMO_USER
  }
  return (await signInWithPopup(auth, googleProvider)).user
}

export async function logout() {
  if (isFirebaseConfigured) return signOut(auth)
  sessionStorage.removeItem('today-percent-active')
  window.dispatchEvent(new Event('today-percent-auth'))
}

export function observeUserData(uid, callback) {
  if (isFirebaseConfigured) {
    return onValue(ref(database, `users/${uid}`), (snapshot) => callback(snapshot.val() || {}))
  }
  callback(getStore()[uid] || {})
  const handler = () => callback(getStore()[uid] || {})
  window.addEventListener('today-percent-update', handler)
  return () => window.removeEventListener('today-percent-update', handler)
}

async function write(uid, path, value, shouldRemove = false) {
  if (isFirebaseConfigured) {
    const target = ref(database, `users/${uid}/${path}`)
    return shouldRemove ? remove(target) : set(target, value)
  }
  const store = getStore()
  store[uid] ||= {}
  const [group, key] = path.split('/')
  store[uid][group] ||= {}
  if (shouldRemove) delete store[uid][group][key]
  else store[uid][group][key] = value
  saveStore(store)
  window.dispatchEvent(new Event('today-percent-update'))
}

export const saveRecord = (uid, record) => write(uid, `records/${record.date}`, record)
export const saveTask = (uid, task) => write(uid, `tasks/${task.id}`, task)
export const deleteTask = (uid, id) => write(uid, `tasks/${id}`, null, true)

export async function toggleTask(uid, task) {
  if (isFirebaseConfigured) return update(ref(database, `users/${uid}/tasks/${task.id}`), { completed: !task.completed })
  return write(uid, `tasks/${task.id}`, { ...task, completed: !task.completed })
}
