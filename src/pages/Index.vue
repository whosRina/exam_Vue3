<template>
  <el-container class="layout-container">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <span>欢迎，{{ user?.name || '游客' }}</span>
      <el-button type="danger" @click="logout">退出登录</el-button>
    </el-header>

    <el-container>
      <!-- 侧边导航栏 -->
      <el-aside width="200px" class="sidebar">
        <el-menu
          router
          :default-active="defaultActive"
          :default-openeds="defaultOpeneds"
        >
          <template v-for="item in menuItems" :key="item.path">
            <!-- 子菜单 -->
            <el-sub-menu v-if="item.children" :index="item.path">
              <template #title>{{ item.label }}</template>
              <el-menu-item
                v-for="subItem in item.children"
                :key="subItem.path"
                :index="subItem.path"
              >
                {{ subItem.label }}
              </el-menu-item>
            </el-sub-menu>

            <!-- 普通菜单项 -->
            <el-menu-item v-else :index="item.path">
              {{ item.label }}
            </el-menu-item>
          </template>
        </el-menu>
      </el-aside>

      <!-- 右侧内容区 -->
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '@/store/auth';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const user = computed(() => authStore.user);

// 控制默认选中项和展开项
const defaultActive = ref('');
const defaultOpeneds = ref([]);

// 菜单项
const menuItems = computed(() => {
  if (!user.value) return [];
  switch (user.value.type) {
    case 0:
      return [
        { path: '/user-management', label: '用户管理' },
        { path: '/uploadXlsx', label: '批量处理' },
        { path: '/myPage', label: '我的信息' }
      ];
    case 1:
      return [
        { path: '/class-management', label: '班级管理' },
        { path: '/question-bank', label: '题库管理' },
        {
          path: '/exam-management',
          label: '考试管理',
          children: [
            { path: '/exam-management/paper-management', label: '试卷管理' },
            { path: '/exam-management/paper-rule-management', label: '规则管理' },
            { path: '/exam-management/examRepulic', label: '考试发布' },
            { path: '/exam-management/ExamManagement', label: '考试过程与成绩管理' }
          ]
        },
        { path: '/uploadWord', label: '批量处理' },
        { path: '/myPage', label: '我的信息' }
      ];
    case 2:
      return [
        { path: '/my-classes', label: '我的班级' },
        { path: '/my-exams', label: '我的考试' },
        { path: '/myPage', label: '我的信息' }
      ];
    default:
      return [];
  }
});

// 设置菜单高亮和展开逻辑
watch(
  () => route.path, // 监听路由变化
  (newPath) => {
    if (!user.value) return;

    // 提取一级路径
    const firstLevelPath = `/${newPath.split('/')[1]}`;
    const path = newPath;

    // 根据用户类型设置高亮和展开
    switch (user.value.type) {
      case 0: // 管理员
        defaultActive.value = firstLevelPath;
        defaultOpeneds.value = [];
        break;
      case 1: // 教师
        
        // 如果匹配的是考试管理相关路径，需要展开考试管理菜单
        if (firstLevelPath === '/exam-management') {
          defaultOpeneds.value = ['/exam-management'];
          defaultActive.value = path;
        }
        else{
          defaultActive.value = firstLevelPath;
          defaultOpeneds.value = [];
        }
        break;
      case 2: // 学生
        defaultActive.value = firstLevelPath;
        defaultOpeneds.value = [];
        break;
    }
  },
  { immediate: true }
);


// 退出登录
const logout = () => {
  authStore.logout();
  ElMessage.success('退出成功');
  router.push('/login');
};
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: #409eff;
  color: white;
}
.sidebar {
  background-color: #f5f5f5;
}


</style>
