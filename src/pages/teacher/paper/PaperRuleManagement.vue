<template>
  <div class="paper-rule">
    <el-card class="header-card">
      <h2>组卷规则管理</h2>
    </el-card>

    <el-card class="content-card">
      <div class="toolbar">
        <el-button type="primary" @click="openAddRuleDialog">新建规则</el-button>
        <el-input v-model="searchQuery" placeholder="搜索规则..." clearable style="width: 200px;" />
      </div>

      <el-table :data="filteredRules" stripe style="width: 100%">
        <el-table-column prop="name" label="规则名称"></el-table-column>
        <el-table-column prop="totalScore" label="总分"></el-table-column>
        <el-table-column prop="bankName" label="关联题库"></el-table-column>
        <el-table-column
          prop="createdAt"
          label="创建时间"
          :formatter="formatDate"
        />
        <el-table-column label="操作" width="260px">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openEditRuleDialog(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDeleteRule(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑规则弹窗 -->
    <el-dialog 
      v-model="ruleDialogVisible" 
      :title="currentRule.id ? '编辑规则' : '新建规则'" 
      width="600px"
    >
      <el-form label-width="120px">
        <el-form-item label="规则名称" required>
          <el-input v-model="currentRule.name" placeholder="请输入规则名称" />
        </el-form-item>
        
        <el-form-item label="总分" required>
          <el-input-number 
            v-model="currentRule.totalScore" 
            :min="1" 
            :max="500" 
            controls-position="right"
          />
        </el-form-item>

        <el-form-item label="关联题库" required>
          <el-select 
            v-model="currentRule.bankId" 
            placeholder="请选择题库"
            clearable
            filterable
            class="full-width-select"
            :disabled="currentRule.id !== null"  
          >
            <el-option
              v-for="bank in banks"
              :key="bank.id"
              :label="bank.name"
              :value="bank.id"
            />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">题型配置</el-divider>
        
        <div class="type-config" v-for="type in questionTypes" :key="type.value">
          <el-form-item :label="type.label + '数量'">
            <el-input-number 
              v-model.number="currentRule.numQuestions[type.value]"
              :min="0" 
              :max="100"
              size="small"
            />
          </el-form-item>
          
          <el-form-item label="每题分数" label-width="80px">
            <el-input-number 
              v-model.number="currentRule.scoreConfig[type.value]"
              :min="1" 
              :max="100"
              size="small"
            />
          </el-form-item>
        </div>

        <el-alert
          v-if="showScoreError"
          :title="`总分不匹配（当前总分：${computedScore}）`"
          type="error"
          :closable="false"
          show-icon
        />
      </el-form>

      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleSaveRule"
          :disabled="showScoreError"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { 
  listPaperRules,
  createPaperRule,
  updatePaperRule,
  deletePaperRule 
} from "@/api/paper";
import { getBankList } from "@/api/questionBank";

const searchQuery = ref("");
const rules = ref([]);
const banks = ref([]);
const ruleDialogVisible = ref(false);

const questionTypes = [
  { value: 1, label: '单选题' },
  { value: 2, label: '多选题' },
  { value: 3, label: '判断题' },
  { value: 4, label: '简答题' },
];

const currentRule = ref(createEmptyRule());

// 计算属性
const filteredRules = computed(() => {
  return rules.value.filter(rule => 
    rule.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const computedScore = computed(() => {
  return questionTypes.reduce((sum, type) => {
    const count = currentRule.value.numQuestions[type.value] || 0;
    const score = currentRule.value.scoreConfig[type.value] || 0;
    return sum + (count * score);
  }, 0);
});

const showScoreError = computed(() => {
  return currentRule.value.totalScore !== computedScore.value;
});

// 方法
function createEmptyRule() {
  return {
    id: null,
    name: '',
    totalScore: 100,
    bankId: null,
    numQuestions: Object.fromEntries(questionTypes.map(t => [t.value, 0])),
    scoreConfig: Object.fromEntries(questionTypes.map(t => [t.value, 1]))
  };
}



function safeParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return Object.fromEntries(questionTypes.map(t => [t.value, 0]));
  }
}

function validateRule() {
  const errors = [];
  if (!currentRule.value.name.trim()) {
    errors.push('规则名称不能为空');
  }
  if (!currentRule.value.bankId) {
    errors.push('必须选择关联题库');
  }
  if (questionTypes.every(t => currentRule.value.numQuestions[t.value] === 0)) {
    errors.push('至少需要配置一种题型');
  }
  if (showScoreError.value) {
    errors.push(`总分不一致（当前总分：${computedScore.value}）`);
  }
  return errors;
}

const handleSaveRule = async () => {
  const errors = validateRule();
  if (errors.length > 0) return ElMessage.error(errors.join(' / '));

  try {
    const payload = {
      // 保持原有payload结构
      name: currentRule.value.name,
      totalScore: currentRule.value.totalScore,
      bankId: Number(currentRule.value.bankId),
      numQuestions: JSON.stringify(currentRule.value.numQuestions),
      scoreConfig: JSON.stringify(currentRule.value.scoreConfig)
    };

    if (currentRule.value.id) {
      payload.ruleId = currentRule.value.id;
      await updatePaperRule(payload);
    } else {
      await createPaperRule(payload);
    }

    ElMessage.success(`规则${currentRule.value.id ? '更新' : '创建'}成功`);
    ruleDialogVisible.value = false;
    await fetchData();
  } catch {
    ElMessage.error('操作失败，请稍后重试'); // 简化错误提示
  }
};

const fetchData = async () => {
  try {
    const [rulesRes, banksRes] = await Promise.all([
      listPaperRules(),
      getBankList().catch(() => ({ data: { bankList: [] } }))
    ]);

    banks.value = (banksRes.data?.bankList || []).map(bank => ({
      id: Number(bank.id),
      name: bank.name.toString()
    }));

    rules.value = (rulesRes.data?.ruleList || []).map(rule => ({
      ...rule,
      bankId: Number(rule.bankId),
      numQuestions: safeParseJSON(rule.numQuestions),
      scoreConfig: safeParseJSON(rule.scoreConfig),
      bankName: banks.value.find(b => b.id === Number(rule.bankId))?.name || '已删除题库'
    }));
    
  } catch {
    ElMessage.error('数据加载失败');
  }
};

const handleDeleteRule = async (rule) => {
  try {
    await ElMessageBox.confirm(`确定删除规则「${rule.name}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    });
    
    await deletePaperRule({ ruleId: rule.id });
    ElMessage.success('规则已删除');
    await fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除操作失败'); // 简化错误提示
    }
  }
};


const openAddRuleDialog = () => {
  currentRule.value = createEmptyRule();
  ruleDialogVisible.value = true;
};

const openEditRuleDialog = (rule) => {
  currentRule.value = {
    ...rule,
    bankId: Number(rule.bankId),
    numQuestions: { ...rule.numQuestions },
    scoreConfig: { ...rule.scoreConfig }
  };
  ruleDialogVisible.value = true;
};

const formatDate = (row) => {
  return new Date(row.createdAt).toLocaleDateString('zh-CN');
};

onMounted(() => {
  fetchData();
  // 初始化监控总分变化
  watch(() => currentRule.value.totalScore, (newVal, oldVal) => {
    if (isNaN(newVal) || newVal < 1) {
      currentRule.value.totalScore = oldVal || 100;
    }
  });
});
</script>

<style scoped>
.paper-rule {
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

.type-config {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}
</style>
