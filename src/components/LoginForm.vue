<template>
  <el-card class="login-card">
    <h2>在线考试系统登录</h2>
    <el-form @submit.prevent="submitLogin">
      <el-form-item>
        <el-input v-model="username" placeholder="用户名" />
      </el-form-item>
      <el-form-item>
        <el-input v-model="password" type="password" placeholder="密码" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitLogin">登录</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/store/auth";
import { login } from "@/api/auth";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

const username = ref("");
const password = ref("");
const authStore = useAuthStore();
const router = useRouter();

const submitLogin = async () => {
  try {
    const response = await login({ username: username.value, password: password.value });

    // 存储用户信息和token
    authStore.setAuthData(response.data);

    ElMessage.success("登录成功！");
    router.push("/");
  } catch (error) {
    ElMessage.error("登录失败,用户名或密码有误！");
  }
};
</script>

<style scoped>
.login-card {
  width: 400px;
  margin: 100px auto;
  padding: 20px;
}
</style>
