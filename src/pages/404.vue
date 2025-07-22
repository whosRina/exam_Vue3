<template>
    <div class="not-found">
      <h1>404</h1>
      <p>页面未找到</p>
      <p>您将被自动跳转到首页...</p>
    </div>
  </template>
  
  <script setup>
  import { onMounted } from "vue";
  import { useRouter } from "vue-router";
  
  const router = useRouter();
  
  onMounted(() => {
    // 5秒后跳转到首页
    setTimeout(() => {
      router.push("/");
    }, 5000);
  });
  </script>
  
  <style scoped>
  .not-found {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg,  #409eff, #7badfe); /* 渐变背景 */
    color: white;
    text-align: center;
    font-family: 'Arial', sans-serif;
    animation: fadeIn 1s ease-in-out; /* 文字渐显动画 */
  }
  
  h1 {
    font-size: 100px;
    font-weight: bold;
    margin: 0;
    animation: bounce 1.5s ease-in-out infinite; /* 弹跳动画 */
  }
  
  p {
    font-size: 24px;
    margin-top: 10px;
    opacity: 0.9;
    animation: fadeIn 1.5s ease-in-out;
  }
  
  @keyframes fadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
  </style>
  