<template>
    <div class="my-class">
      <el-card class="header-card">
        <h2>我的班级</h2>
      </el-card>
  
      <!-- 只有当showDetails为false时才显示班级列表 -->
      <el-card v-if="!showDetails" class="content-card">
        <div class="toolbar">
          <el-button type="primary" @click="openJoinClassDialog" class="join-class-btn">加入班级</el-button>
          <el-input v-model="searchQuery" placeholder="搜索班级..." clearable style="width: 200px;" />
        </div>
  
        <el-table :data="filteredClasses" stripe style="width: 100%">
          <el-table-column prop="className" label="班级名称"></el-table-column>
          <el-table-column prop="teacherName" label="班级创建人"></el-table-column>
          <el-table-column label="操作" width="220px">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewClassDetails(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
  
      <!-- 班级详情展示 -->
      <el-card v-if="showDetails" class="details-card">
        <div>
          <el-button type="primary" @click="showDetails = false">返回列表</el-button>
        </div>
  
        <!-- 上方班级基本信息 -->
        <h3>班级详细信息</h3>
        <p><strong>班级名称：</strong>{{ classDetails.classInfo?.className }}</p>
        <p><strong>班级邀请码：</strong>{{ classDetails.classInfo?.classCode }}</p>
        <p><strong>班级创建人：</strong>{{ classDetails.classInfo?.teacherName }}</p>
        <p><strong>是否允许加入：</strong>
          <el-tag :type="joinableTag[classDetails.classInfo?.isJoinable]">
            {{ classDetails.classInfo?.isJoinable === 1 ? '允许加入' : '禁止加入' }}
          </el-tag>
        </p>
  
        <!-- 下方班级成员列表 -->
        <h3>班级成员</h3>
        <el-table :data="classDetails.classMembers" stripe>
          <el-table-column prop="name" label="成员名称"></el-table-column>
          <el-table-column prop="username" label="用户名"></el-table-column>
        </el-table>
      </el-card>
  
      <!-- 加入班级弹窗 -->
      <el-dialog v-model="joinDialogVisible" title="输入班级邀请码" width="400px">
        <el-form label-width="100px">
          <el-form-item label="班级邀请码">
            <el-input v-model="classCode" placeholder="请输入班级邀请码" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="joinDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleJoinClass">加入班级</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from "vue";
  import { ElMessage } from "element-plus";
  import { getClassList, getClassDetail, joinClass } from "@/api/class";
  
  const classes = ref([]);
  const searchQuery = ref("");
  const joinableTag = { 1: "success", 0: "danger" };
  const showDetails = ref(false);
  const classDetails = ref(null);
  const joinDialogVisible = ref(false);
  const classCode = ref("");
  
  // 计算属性：过滤后的班级列表
  const filteredClasses = computed(() =>
    classes.value.filter(cls => cls.className.includes(searchQuery.value))
  );
  
  // 获取班级数据
  const fetchClasses = async () => {
    try {
      const response = await getClassList();
      classes.value = response.data?.classList || [];
    } catch (error) {
      ElMessage.error("获取班级列表失败");
    }
  };
  
  // 查看班级详情
  const viewClassDetails = async (cls) => {
    try {
      const response = await getClassDetail(cls.classId);
      classDetails.value = {
        classInfo: response.data.classInfo || {},
        classMembers: response.data.classMembers || []
      };
      showDetails.value = true;
    } catch (error) {
      ElMessage.error("获取班级详细信息失败");
    }
  };
  
  // 打开加入班级弹窗
  const openJoinClassDialog = () => {
    classCode.value = "";  // 清空班级码
    joinDialogVisible.value = true;  // 打开弹窗
  };
  
  // 通过邀请码加入班级
  const handleJoinClass = async () => {
    try {
      await joinClass(classCode.value);
      ElMessage.success("成功加入班级");
      joinDialogVisible.value = false;
      fetchClasses();
    } catch (error) {
      ElMessage.error("加入班级失败，请检查邀请码");
    }
  };
  
  onMounted(fetchClasses);
  </script>
  
  <style scoped>
  .my-class {
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
  .toolbar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
  }
  .details-card {
    background-color: #f9f9f9;
    border-radius: 8px;
  }
  </style>
  