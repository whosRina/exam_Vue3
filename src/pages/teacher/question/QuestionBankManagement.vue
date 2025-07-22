<template>
  <div class="question-bank">
    <el-card class="header-card">
      <h2>题库管理</h2>
    </el-card>

    <el-card class="content-card">
      <div class="toolbar">
        <el-button type="primary" @click="openAddBankDialog">添加题库</el-button>
        <el-input v-model="searchQuery" placeholder="搜索题库..." clearable style="width: 200px;" />
      </div>

      <el-table :data="filteredBanks" stripe style="width: 100%">
        <el-table-column prop="name" label="题库名称"></el-table-column>
        <el-table-column
          prop="createdAt"
          label="创建时间"
          :formatter="formatDate"
        />
        <el-table-column label="操作" width="220px">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewBankDetails(row)">查看</el-button>
            <el-button type="primary" size="small" @click="openEditBankDialog(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDeleteBank(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加题库弹窗 -->
    <el-dialog v-model="addDialogVisible" title="添加题库" width="500px">
      <el-form label-width="100px">
        <el-form-item label="题库名称">
          <el-input v-model="currentBank.name" placeholder="请输入题库名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveBank">保存</el-button>
      </template>
    </el-dialog>

    <!-- 编辑题库弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑题库" width="500px">
      <el-form label-width="100px">
        <el-form-item label="题库名称">
          <el-input v-model="currentBank.name" placeholder="请输入题库名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveBank">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from "element-plus";
import { getBankList,  createBank, updateBank, deleteBank } from "@/api/questionBank";
const router = useRouter();
// 题库列表数据
const banks = ref([]);
const searchQuery = ref("");

// 计算属性：过滤后的题库列表
const filteredBanks = computed(() =>
  banks.value.filter(bank => bank.name.includes(searchQuery.value))
);

// 当前编辑的题库
const currentBank = ref({ id: null, name: "" });
const addDialogVisible = ref(false);
const editDialogVisible = ref(false);

// 获取题库列表
const fetchBanks = async () => {
  try {
    const response = await getBankList();
    banks.value = response.data?.bankList || [];
  } catch (error) {
    ElMessage.error("获取题库列表失败");
  }
};

// 打开添加题库对话框
const openAddBankDialog = () => {
  currentBank.value = { id: null, name: "" };
  addDialogVisible.value = true;
};

// 打开编辑题库对话框
const openEditBankDialog = (bank) => {
  currentBank.value = { id: bank.id, name: bank.name };
  editDialogVisible.value = true;
};

// 保存题库（添加或编辑）
const handleSaveBank = async () => {
  try {
    if (currentBank.value.id) {
      await updateBank(currentBank.value);
      ElMessage.success("题库信息更新成功");
    } else {
      await createBank(currentBank.value.name);
      ElMessage.success("题库创建成功");
    }
    addDialogVisible.value = false;
    editDialogVisible.value = false;
    fetchBanks();
  } catch (error) {
    ElMessage.error("操作失败");
  }
};

// 删除题库
const handleDeleteBank = async (bank) => {
  ElMessageBox.confirm("确定要删除该题库吗？", "警告", { type: "warning" })
    .then(async () => {
      await deleteBank(bank.id);
      ElMessage.success("题库已删除");
      fetchBanks();
    })
    .catch(() => {});
};

// 查看题库详情（跳转到详情页面）
const viewBankDetails = (bank) => {
  router.push(`/question-bank/details/${bank.id}`);
};
// 格式化日期
const formatDate = (row) => {
  const date = new Date(row.createdAt);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 初始化
onMounted(fetchBanks);
</script>

<style scoped>
.question-bank {
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
  background-color: white;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}
</style>
