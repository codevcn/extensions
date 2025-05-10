const LOCAL_USER_ID_KEY = "ipvcns-user-id"

function generateRandomString(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

function generateSecureRandomString(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => characters[byte % characters.length]).join("")
}

const getLocalUserId = () => {
  return localStorage.getItem(LOCAL_USER_ID_KEY) || ""
}

const setLocalUserId = (userId) => {
  localStorage.setItem(LOCAL_USER_ID_KEY, userId)
}

const initLocalUserId = () => {
  const userId = getLocalUserId()
  if (!userId || userId.length === 0) {
    const USER_ID_LENGTH = 24
    if (crypto && crypto.getRandomValues) {
      setLocalUserId(generateSecureRandomString(USER_ID_LENGTH))
    } else {
      setLocalUserId(generateRandomString(USER_ID_LENGTH))
    }
  }
}

const init = () => {
  initLocalUserId()
}
init()
