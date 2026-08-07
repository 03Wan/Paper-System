import { defineStore } from "pinia";
import { getSessionApi, logoutApi } from "../api/auth";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    initialized: false,
    initializePromise: null
  }),
  getters: {
    isLogin: (state) => Boolean(state.user?.id),
    role: (state) => state.user?.role || "USER"
  },
  actions: {
    setAuth(user) {
      this.user = user;
      this.initialized = true;
    },
    async initialize() {
      if (this.initialized) return this.user;
      if (this.initializePromise) return this.initializePromise;
      this.initializePromise = getSessionApi()
        .then((response) => {
          this.user = response?.data?.user || null;
          return this.user;
        })
        .catch(() => {
          this.user = null;
          return null;
        })
        .finally(() => {
          this.initialized = true;
          this.initializePromise = null;
        });
      return this.initializePromise;
    },
    async logout() {
      try {
        await logoutApi();
      } finally {
        this.user = null;
        this.initialized = true;
      }
    },
    clearSession() {
      this.user = null;
      this.initialized = true;
    }
  }
});
