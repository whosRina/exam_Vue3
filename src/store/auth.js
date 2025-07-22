import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    // 使用sessionStorage初始化状态
    user: JSON.parse(sessionStorage.getItem("user")) || null,
    token: sessionStorage.getItem("token") || null,
  }),
  actions: {
    // 设置用户信息
    setUser(user) {
      this.user = user;
      sessionStorage.setItem("user", JSON.stringify(user));
    },

    // 设置Token
    setToken(token) {
      this.token = token;
      sessionStorage.setItem("token", token);
    },

    // 登录成功后设置完整认证数据
    setAuthData(authData) {
      this.setUser({
        id: authData.id,
        name: authData.name,
        type: authData.type
      });
      this.setToken(authData.token);
    },

    // 注销功能
    logout() {
      this.user = null;
      this.token = null;
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    },

    initialize() {
      // 从sessionStorage恢复状态
      const storedUser = sessionStorage.getItem("user");
      const storedToken = sessionStorage.getItem("token");

      if (storedUser && storedToken) {
        try {
          this.user = JSON.parse(storedUser);
          this.token = storedToken;
        } catch (error) {
          this.logout();
        }
      }
    }
  }
});
