<template>
    <div class="question-list">
      <el-card class="header-card">
        <h2>题目列表</h2>
      </el-card>
  
      <!-- 题目列表 -->
      <el-card v-if="selectedType !== null" class="question-list">
        <h3>{{ getTypeName(selectedType) }}</h3>
        <el-table :data="questions" border style="width: 100%">
          <el-table-column label="题目内容" width="500">
            <template #default="scope">
              <div class="question-content">
                <div class="question-text">{{ scope.row.content }}</div>
                <div v-if="[1, 2].includes(scope.row.type)" class="options">
                  <div class="options-row">
                    <div v-for="(option, idx) in parseOptions(scope.row.options)" 
                         :key="idx" class="option-item">
                      {{ option.label }}. {{ option.text }} 
                    </div>
                  </div>
                </div>
                <div class="correct-answer">
                  正确答案：{{ formatAnswer(scope.row) }}
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="400" align="center">
            <template #default="scope">
              <el-button type="warning" size="small" @click="editQuestion(scope.row)">修改</el-button>
              <el-button type="danger" size="small" @click="deleteQuestionHandle(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页控件 -->
        <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalCount"
            @current-change="fetchQuestions(selectedType.value)"
            layout="total, prev, pager, next, jumper"
            :locale="{
                total: '总数',
                page: '页',
                perPage: '每页',
                goTo: '跳转到'
            }">
        </el-pagination>
    </el-card>
  
      <!-- 题目编辑对话框 -->
      <el-dialog v-model="dialogVisible" title="修改题目" width="50%">
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
              :key="index" 
              :label="`选项 ${option.label}`">
              <el-input v-model="option.text" style="width: 80%"/>
              <el-button @click="removeOption(index)" v-if="form.options.length > 1">删除</el-button>
            </el-form-item>
            <el-button @click="addOption">+ 添加选项</el-button>
          </template>
  
          <el-form-item label="正确答案">
            <template v-if="form.type === 3">
                <el-radio-group v-model="form.answer">
                    <el-radio :value="true">正确</el-radio>
                    <el-radio :value="false">错误</el-radio>
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
  import { ref, reactive,onMounted} from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { ElMessage, ElMessageBox } from "element-plus";
  import {getQuestionList, deleteQuestion, updateQuestion } from "@/api/questionBank";
  
  const router = useRouter();
  const route = useRoute();
  const questions = ref([]);
  const selectedType = ref(route.params.type);  // 获取路由参数中的题目类型
  const bankId = route.params.bankId;  // 获取题库ID

  const questionTypes = [
  { type: 1, name: "单选题" },
  { type: 2, name: "多选题" },
  { type: 3, name: "判断题" },
  { type: 4, name: "简答题" },
];

  const getTypeName = (type) => {
    const typeMap = {
        1: "单选题",
        2: "多选题",
        3: "判断题",
        4: "简答题",
    };
    return typeMap[type] || "未知类型";
  };

  
  const dialogVisible = ref(false);
  const currentQuestionId = ref(null);
  
  const form = reactive({
    type: 1,
    content: '',
    options: [{ label: 'A', text: '' }],
    answer: []
  });

  // 分页相关的状态
  const currentPage = ref(1);  // 当前页码
  const pageSize = 10;  // 每页显示条数
  const totalCount = ref(0);  // 总题目数
  
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
  
  // 提交修改
  const submitQuestion = async () => {
    try {
      const params = {
        content: form.content,
        type: form.type,
        options: [1, 2].includes(form.type) ? JSON.stringify(form.options) : "[]",
        answer: JSON.stringify(form.answer)
      };
      params.questionId = currentQuestionId.value;
      await updateQuestion(params);
      ElMessage.success('修改成功');
      dialogVisible.value = false;
      fetchQuestions(selectedType.value);
    } catch (error) {
      ElMessage.error('操作失败');
    }
  };
  
  // 编辑题目
  const editQuestion = (question) => {
    currentQuestionId.value = question.id;
    form.type = question.type;
    form.content = question.content;
    
    // 解析 options，确保不会为空
    const parsedOptions = parseOptions(question.options);
    form.options = parsedOptions.length > 0 ? parsedOptions : [{ label: 'A', text: '' }];

    try {
        form.answer = JSON.parse(question.answer);
    } catch {
        form.answer = question.answer;
    }

    dialogVisible.value = true;
};
  
  const parseOptions = (options) => {
    try {
      return options ? JSON.parse(options) : [];
    } catch (error) {
      console.error("选项解析失败:", error);
      return [];
    }
  };
  
  const formatAnswer = (question) => {
    try {
      const answer = JSON.parse(question.answer);
      return Array.isArray(answer) ? answer.join(", ") : answer;
    } catch (error) {
      return question.answer; // 解析失败就直接返回原值
    }
  };
  
  // 获取题目列表
  const fetchQuestions = async (type = selectedType.value) => {
  try {
    const response = await getQuestionList({
      bankId: parseInt(bankId),
      type: Number(type),
      page: currentPage.value,
      size: pageSize
    });
    questions.value = response.data?.questions || [];
    totalCount.value = response.data?.total || 0;  
  } catch (error) {
    ElMessage.error("获取题目列表失败");
    console.error("Error fetching questions:", error);
  }
};
  
  // 删除题目
  const deleteQuestionHandle = async (id) => {
    try {
      await ElMessageBox.confirm("确定要删除该题目吗？", "警告", { type: "warning" });
      await deleteQuestion(id);
      ElMessage.success("题目删除成功");
      fetchQuestions(selectedType.value);
    } catch (error) {
      ElMessage.error("删除失败");
    }
  };
  
  onMounted(() => {
    fetchQuestions(selectedType.value);  // 获取当前类型的题目列表
  });
  </script>
  
  <style scoped>
  .question-list {
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
