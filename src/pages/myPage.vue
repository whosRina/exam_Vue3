<template>
    <div class="my-profile">
      <el-card class="header-card">
        <h2>我的信息</h2>
      </el-card>
  
      <el-card class="content-card">
        <el-descriptions title="基本信息" :column="1" border>
          <el-descriptions-item label="姓名">{{ user.name }}</el-descriptions-item>
          <el-descriptions-item label="账号">{{ user.username }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="roleTag[user.userType]">{{ roleMap[user.userType] }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <div style="margin-top: 20px; text-align: right;">
          <el-button type="primary" @click="dialogVisible = true">修改密码</el-button>
        </div>
      </el-card>
  
      <!-- 修改密码弹窗 -->
      <el-dialog v-model="dialogVisible" title="修改密码" width="400px" destroy-on-close>
        <el-form :model="pwdForm" label-width="80px">
          <el-form-item label="原密码">
            <el-input v-model="pwdForm.oldPassword" type="password" />
          </el-form-item>
          <el-form-item label="新密码">
            <el-input v-model="pwdForm.newPassword" type="password" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleUpdatePassword">提交</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from "vue";
  import { ElMessage } from "element-plus";
  import { getUserDetail, updatePassword } from "@/api/user";
  
  // 用户信息
  const user = ref({
    username: "",
    name: "",
    userType: 0,
  });
  
  // 获取用户信息
  const fetchUserDetail = async () => {
    try {
      const res = await getUserDetail();
      Object.assign(user.value, res.data || {});
    } catch (err) {
      ElMessage.error("获取用户信息失败");
    }
  };
  
  // 显示修改密码对话框
  const dialogVisible = ref(false);
  
  // 修改密码表单
  const pwdForm = ref({
    oldPassword: "",
    newPassword: "",
  });
  
  // 修改密码处理
  const handleUpdatePassword = async () => {
    try {
      await updatePassword(pwdForm.value);
      ElMessage.success("密码修改成功");
      dialogVisible.value = false;
      pwdForm.value.oldPassword = "";
      pwdForm.value.newPassword = "";
    } catch (err) {
      ElMessage.error(err.response?.data?.message || "密码修改失败");
    }
  };
  
  // 角色标签
  const roleMap = { 0: "管理员", 1: "教师", 2: "学生" };
  const roleTag = { 0: "danger", 1: "warning", 2: "success" };
  
  // 页面加载时获取用户信息
  onMounted(fetchUserDetail);
  </script>
  
  <style scoped>
  .my-profile {
    padding: 20px;
    background-color: #f5f5f5;
    min-height: 100vh;
  }
  
  .header-card {
    margin-bottom: 20px;
    background-color: #409eff;
    color: white;
    text-align: center;
    font-size: 18px;
    font-weight: bold;
  }
  
  .content-card {
    padding: 20px;
  }
  </style>
  