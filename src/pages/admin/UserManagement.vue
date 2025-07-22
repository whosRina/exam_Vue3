<template>
  <div class="user-management">
    <el-card class="header-card" :key="dialogVisible">
      <h2>用户管理</h2>
    </el-card>

    <el-card class="content-card" :key="users.length">
      <div class="toolbar">
        <el-button type="primary" @click="openUserDialog()">添加用户</el-button>
        <el-input v-model="searchQuery" placeholder="搜索用户..." clearable style="width: 200px;" />
      </div>

      <el-table :data="filteredUsers" stripe style="width: 100%">
        <el-table-column prop="name" label="姓名"></el-table-column>
        <el-table-column prop="username" label="账号"></el-table-column>
        <el-table-column prop="type" label="角色">
          <template #default="{ row }">
            <el-tag :type="roleTag[row.type]">{{ roleMap[row.type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200px">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openUserDialog(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDeleteUser(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="400px" destroy-on-close>
      <el-form :model="currentUser">
        <el-form-item label="名字">
          <el-input v-model="currentUser.name" />
        </el-form-item>
        <el-form-item label="账号">
          <el-input v-model="currentUser.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="currentUser.passwd" type="password" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="currentUser.type" placeholder="请选择角色">
            <el-option v-for="(label, key) in roleMap" :key="key" :label="label" :value="parseInt(key)" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getUserList } from "@/api/user";
import { createUser, updateUser, deleteUser } from "@/api/user";

// 用户列表
const users = ref([]);

// 搜索
const searchQuery = ref("");

// 角色映射
const roleMap = { 0: "管理员", 1: "教师", 2: "学生" };
const roleTag = { 0: "danger", 1: "warning", 2: "success" };

// 计算过滤后的用户列表
const filteredUsers = computed(() => 
  users.value?.filter(user => user.name.includes(searchQuery.value)) || []
);

// 获取用户数据
const fetchUsers = async () => {
  try {
    const response = await getUserList();
    users.value = response.data?.userList || []; // 防止users为空
  } catch (error) {
    ElMessage.error("获取用户列表失败");
    users.value = []; // 失败时防止空白
  }
};

// 对话框状态
const dialogVisible = ref(false);
const dialogTitle = ref("");
const currentUser = ref({ id: null, name: "", username: "", passwd: "", type: 0 });

// 打开添加/编辑用户对话框
const openUserDialog = (user = null) => {
  if (user) {
    dialogTitle.value = "编辑用户";
    currentUser.value = { ...user };
  } else {
    dialogTitle.value = "添加用户";
    currentUser.value = { id: null, name: "", username: "", passwd: "", type: 0 };
  }
  dialogVisible.value = true;
};

const saveUser = async () => {
  try {
    if (currentUser.value.id) {
      // 更新用户
      await updateUser({
        id: currentUser.value.id,
        name: currentUser.value.name,
        username: currentUser.value.username,
        password: currentUser.value.passwd || "", // 如果密码为空，发送空字符串
        type: currentUser.value.type,
      });
      ElMessage.success("用户更新成功");
    } else {
      // 创建用户
      await createUser({
        users: [
          {
            name: currentUser.value.name,
            username: currentUser.value.username,
            password: currentUser.value.passwd ,
            type: currentUser.value.type,
          },
        ],
      });
      ElMessage.success("用户添加成功");
    }

    dialogVisible.value = false; // 关闭对话框
    fetchUsers(); // 重新获取数据
  } catch (error) {
    ElMessage.error("操作失败");
    console.error(error);
  }
};


// 删除用户
const handleDeleteUser = async (id) => {
  try {
    await ElMessageBox.confirm("确定删除该用户吗？", "警告", { type: "warning" });
    await deleteUser({ id }); // 调用API中的deleteUser函数
    ElMessage.success("用户删除成功");
    fetchUsers(); // 重新获取数据
  } catch (error) {
    ElMessage.error("删除失败");
    console.error(error);
  }
};

// 组件加载时获取用户列表
onMounted(fetchUsers);
</script>

<style scoped>
.user-management {
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

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}
</style>
