<template>
  <div class="class-management">
    <el-card class="header-card">
      <h2>班级管理</h2>
    </el-card>

    <!-- 只有当 showDetails 为 false 时才显示班级列表 -->
    <el-card v-if="!showDetails" class="content-card">
      <div class="toolbar">
        <el-button type="primary" @click="openAddClassDialog()">添加班级</el-button>
        <el-input v-model="searchQuery" placeholder="搜索班级..." clearable style="width: 200px;" />
      </div>

      <el-table :data="filteredClasses" stripe style="width: 100%">
        <el-table-column prop="className" label="班级名称"></el-table-column>
        <el-table-column prop="classCode" label="班级邀请码"></el-table-column>
        <el-table-column label="是否允许加入">
          <template #default="{ row }">
            <el-tag :type="joinableTag[row.isJoinable]">{{ row.isJoinable === 1 ? '允许加入' : '禁止加入' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220px">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewClassDetails(row)">查看</el-button>
            <el-button type="primary" size="small" @click="openEditClassDialog(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDeleteClass(row)">删除</el-button>
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
        <el-table-column label="操作" width="120px">
          <template #default="{ row }">
            <el-button type="danger" size="small" @click="handleRemoveMember(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加班级弹窗 -->
    <el-dialog v-model="addDialogVisible" title="添加班级" width="500px">
      <el-form label-width="100px">
        <el-form-item label="班级名称">
          <el-input v-model="currentClass.className" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="是否允许加入">
          <el-switch v-model="currentClass.isJoinable" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveClass">保存</el-button>
      </template>
    </el-dialog>

    <!-- 编辑班级弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑班级" width="500px">
      <el-form label-width="100px">
        <el-form-item label="班级名称">
          <el-input v-model="currentClass.className" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="是否更新邀请码">
          <el-switch v-model="currentClass.refreshCode" :active-value="true" :inactive-value="false" />
        </el-form-item>
        <el-form-item label="是否允许加入">
          <el-switch v-model="currentClass.isJoinable" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveClass">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getClassList, getClassDetail, createClass, updateClass, deleteClass, deleteMember } from "@/api/class";

const classes = ref([]);
const searchQuery = ref("");
const joinableTag = { 1: "success", 0: "danger" };
const showDetails = ref(false);
const classDetails = ref(null);
const addDialogVisible = ref(false);
const editDialogVisible = ref(false);
const currentClass = ref({ id: null, className: "", classCode: "", isJoinable: 1 });

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

// 打开添加班级对话框
const openAddClassDialog = () => {
  currentClass.value = { classId: null, className: "", classCode: "", isJoinable: 1 };
  addDialogVisible.value = true;
};

// 打开编辑班级对话框
const openEditClassDialog = (cls) => {
  currentClass.value = { 
    classId : cls.classId, 
    className: cls.className,  
    isJoinable: cls.isJoinable,  
    refreshCode: false  // 默认不刷新邀请码 
  };
  editDialogVisible.value = true;
};

// 保存班级（添加或编辑）
const handleSaveClass = async () => {
  try {
    if (currentClass.value.classId) {
      await updateClass(currentClass.value);
      ElMessage.success("班级信息更新成功");
    } else {
      await createClass(currentClass.value);
      ElMessage.success("班级创建成功");
    }
    addDialogVisible.value = false;
    editDialogVisible.value = false;
    fetchClasses();
  } catch (error) {
    ElMessage.error("操作失败");
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

// 删除班级
const handleDeleteClass = async (cls) => {
  ElMessageBox.confirm("确定要删除该班级吗？", "警告", { type: "warning" })
    .then(async () => {
      await deleteClass(cls.classId);
      ElMessage.success("班级已删除");
      fetchClasses();
    })
    .catch(() => {});
};

// 删除班级成员
const handleRemoveMember = async (member) => {
  try {
    console.log("即将删除成员：", member);
    await deleteMember(member.classMemberId);
    ElMessage.success(`已删除成员 ${member.name}`);
    viewClassDetails(classDetails.value.classInfo);
  } catch (error) {
    ElMessage.error("删除成员失败");
  }
};

onMounted(fetchClasses);
</script>

<style scoped>
.class-management {
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
