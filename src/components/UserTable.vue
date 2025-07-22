<template>
    <el-card>
      <h2>用户管理</h2>
      <el-button type="primary" @click="fetchUsers">刷新</el-button>
      <el-table :data="users">
        <el-table-column prop="id" label="ID" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button type="danger" @click="deleteUser(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </template>
  
  <script setup>
  import { ref, onMounted } from "vue";
  import { getUserList, deleteUser } from "@/api/user";
  import { ElMessage } from "element-plus";
  
  const users = ref([]);
  
  const fetchUsers = async () => {
    try {
      const response = await getUserList();
      users.value = response.data;
    } catch (error) {
      ElMessage.error("获取用户列表失败");
    }
  };
  
  const handleDeleteUser = async (id) => {
    try {
      await deleteUser({ userId: id });
      ElMessage.success("删除成功");
      fetchUsers();
    } catch (error) {
      ElMessage.error("删除失败");
    }
  };
  
  onMounted(fetchUsers);
  </script>
  