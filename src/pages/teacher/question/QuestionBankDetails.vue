<template> 
  <div class="question-bank-details">
    <el-card class="header-card">
      <h2>题库详细信息</h2>
    </el-card>

    <el-card class="details-card">
      <div>
        <el-button type="primary" @click="goBackToList">返回列表</el-button>
        <el-button type="success" @click="showAddQuestionDialog">添加题目</el-button>
      </div>

      <h3>题库名称：{{ bankDetails?.name }}</h3>
      <p><strong>创建者：</strong>{{ bankDetails?.creatorName }}</p>
      <p><strong>创建时间：</strong>{{ bankDetails?.createdAt }}</p>

      <div class="question-type-cards">
        <el-card v-for="(type, index) in questionTypes" :key="index" class="question-type-card" @click="goToQuestionList(type.type)">
          <h4>{{ type.name }}</h4>
          <p>题目数量：{{ type.count }}</p>
        </el-card>
      </div>
    </el-card>


    <!-- 题目编辑对话框 -->
    <el-dialog v-model="dialogVisible" title="添加题目" width="50%">
      <el-form :model="form" label-width="100px">
        <el-form-item label="题目类型">
          <el-select v-model="form.type" @change="handleTypeChange">
            <el-option v-for="t in questionTypes" :key="t.type" 
                       :label="t.name" :value="t.type" />
          </el-select>
        </el-form-item>

        <el-form-item label="题目内容">
          <el-input v-model="form.content" type="textarea" :rows="3" />
        </el-form-item>

        <template v-if="[1, 2].includes(form.type)">
          <el-form-item v-for="(option, index) in form.options" 
                        :key="index" :label="`选项 ${option.label}`">
            <el-input v-model="option.text" style="width: 80%"/>
            <el-button @click="removeOption(index)" v-if="form.options.length > 1">删除</el-button>
          </el-form-item>
          <el-button @click="addOption">+ 添加选项</el-button>
        </template>

        <el-form-item label="正确答案">
          <template v-if="form.type === 3">
            <el-radio-group v-model="form.answer">
              <el-radio :label="true">正确</el-radio>
              <el-radio :label="false">错误</el-radio>
            </el-radio-group>
          </template>
          <template v-else-if="[1, 2].includes(form.type)">
            <el-checkbox-group v-model="form.answer" v-if="form.type === 2">
              <el-checkbox v-for="option in form.options" 
                           :key="option.label" :label="option.label"/>
            </el-checkbox-group>
            <el-radio-group v-model="form.answer" v-else>
              <el-radio v-for="option in form.options" 
                        :key="option.label" :label="option.label"/>
            </el-radio-group>
          </template>
          <el-input v-else v-model="form.answer" type="textarea" :rows="3"/>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitQuestion">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { getBankDetail,  createQuestion } from "@/api/questionBank";

const router = useRouter();
const route = useRoute();
const bankDetails = ref({});
const questionTypes = ref([
  { name: "单选", type: 1, count: 0 },
  { name: "多选", type: 2, count: 0 },
  { name: "判断", type: 3, count: 0 },
  { name: "简答", type: 4, count: 0 }
]);

const dialogVisible = ref(false);


const form = reactive({
  type: 1,
  content: '',
  options: [{ label: 'A', text: '' }],
  answer: []
});

// 处理题目类型变化
const handleTypeChange = (type) => {
  form.options = type === 3 || type === 4 ? [] : [{ label: 'A', text: '' }];
  form.answer = type === 2 ? [] : '';
};

// 添加选项
const addOption = () => {
  const nextLabel = String.fromCharCode(65 + form.options.length);
  form.options.push({ label: nextLabel, text: '' });
};

// 删除选项
const removeOption = (index) => {
  form.options.splice(index, 1);
};

// 提交题目
const submitQuestion = async () => {
  try {
    const params = {
      bankId: parseInt(route.params.id),
      content: form.content,
      type: form.type,
      options: [1, 2].includes(form.type) ? JSON.stringify(form.options) : "[]",
      answer: JSON.stringify(form.answer)
    };
    await createQuestion(params); 
    ElMessage.success('添加成功');
    dialogVisible.value = false;
    fetchBankDetails();
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

// 初始化表单
const resetForm = () => {
  Object.assign(form, {
    type: 1,
    content: '',
    options: [{ label: 'A', text: '' }],
    answer: []
  });
};



// 获取题库详细信息
const fetchBankDetails = async () => {
  try {
    const response = await getBankDetail(parseInt(route.params.id));
    bankDetails.value = response.data.bankInfo || {};
    const typeCounts = response.data.typeCounts || [];
    questionTypes.value.forEach(type => {
      const count = typeCounts.find(item => item.type == type.type);
      type.count = count ? count.count : 0;
    });
  } catch (error) {
    ElMessage.error("获取题库详细信息失败");
  }
};
const goToQuestionList = (type) => {
  // 使用路由跳转到题目列表页面，携带题目类型参数
  router.push(`/question-list/${route.params.id}/${type}`);
};

const goBackToList = () => {
  router.push("/question-bank");
};
const showAddQuestionDialog = () => {
  resetForm();
  dialogVisible.value = true;
};

onMounted(fetchBankDetails);
</script>



<style scoped>
.question-bank-details {
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
.details-card {
  background-color: white;
  padding: 20px;
}
.question-type-cards {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}
.question-type-card {
  width: 23%;
  text-align: center;
  padding: 20px;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: 0.3s;
}
.question-type-card:hover {
  background-color: #d3e3fc;
}
.question-list {
  margin-top: 20px;
  padding: 20px;
}
.question-content {
  max-width: 600px; 
}
.question-text {
  white-space: normal; 
}
.options-row {
  display: flex; 
  flex-wrap: wrap; 
}
.option-item {
  margin-right: 10px; 
}
</style>