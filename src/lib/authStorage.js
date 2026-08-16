const ACCESS_TOKEN_KEY = 'admin_access_token'
const USER_KEY = 'admin_user'
const SESSION_EVENT = 'admin-auth:session-changed'

function notifySessionChanged() {
  window.dispatchEvent(new Event(SESSION_EVENT))
}

export const authStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),

  getUser: () => {
    const storedUser = localStorage.getItem(USER_KEY)

    if (!storedUser) return null

    try {
      return JSON.parse(storedUser)
    } catch {
      localStorage.removeItem(USER_KEY)
      return null
    }
  },

  setSession: ({ accessToken, user }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)

    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_KEY)
    }

    notifySessionChanged()
  },

  clearSession: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    notifySessionChanged()
  },
}
