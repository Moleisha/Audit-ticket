import { reactive } from 'vue'

const STORAGE_KEY = 'audit_current_user'

/** 演示用的发起人清单，后端会记录任务的实际发起人 */
export const USERS = ['张明', '李静', '王涛', '赵敏']

function readStored() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return USERS.indexOf(value) >= 0 ? value : USERS[0]
  } catch (error) {
    return USERS[0]
  }
}

const currentUser = reactive({ name: readStored() })

export function useCurrentUser() {
  function setUser(name) {
    currentUser.name = name
    try {
      window.localStorage.setItem(STORAGE_KEY, name)
    } catch (error) {
      /* 隐私模式下忽略持久化失败 */
    }
  }

  return { currentUser, users: USERS, setUser }
}
