<template>
  <div class="paper-detail">
    <el-card class="header-card">
      <h2>试卷详情</h2>
    </el-card>

    <el-form label-width="100px" class="paper-info">
      <el-form-item label="试卷名称">
        <el-input v-model="paperDetail.name" placeholder="请输入试卷名称" />
      </el-form-item>
      <el-form-item label="总分">
        <el-input
          v-model.number="paperDetail.totalScore"
          placeholder="请输入总分"
          type="number"
        />
      </el-form-item>
    </el-form>

    <el-table
      :data="paperDetail.questions"
      stripe
      style="width: 100%; margin-bottom: 20px;"
    >
      <el-table-column prop="questionId" label="题目ID" width="80" />
      <el-table-column prop="content" label="题目内容" />
      <el-table-column
        prop="type"
        label="题型"
        :formatter="formatType"
        width="100"
      />
      <el-table-column prop="score" label="分值" width="80" />
      <el-table-column label="操作" width="100">
        <template #default="scope">
          <el-button
            type="danger"
            size="small"
            @click="removeQuestion(scope.$index)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="actions">
      <el-button 
        type="info" 
        :disabled="paperDetail.questions.length === 0"
        @click="handlePreview"
      >预览试卷</el-button>
      <el-button type="primary" @click="openAddQuestionDialog">添加题目</el-button>
      <el-button type="success" @click="handleUpdatePaper">保存修改</el-button>
    </div>

    <!-- 添加题目对话框 -->
    <el-dialog v-model="addQuestionDialogVisible" title="添加题目" width="80%">
      <el-form label-width="100px">
        <el-form-item label="选择题库">
          <el-select v-model="selectedQuestionBankId" placeholder="请选择题库">
            <el-option
              v-for="bank in banks"
              :key="bank.id"
              :label="bank.name"
              :value="bank.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择题型">
          <el-select
            v-model="selectedQuestionType"
            placeholder="请选择题型"
            @change="fetchAvailableQuestions"
          >
            <el-option label="单选题" :value="1" />
            <el-option label="多选题" :value="2" />
            <el-option label="判断题" :value="3" />
            <el-option label="简答题" :value="4" />
          </el-select>
        </el-form-item>
        <el-table
          :data="availableQuestions"
          stripe
          style="width: 100%"
          @selection-change="handleAvailableSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="content" label="题目内容" />
          <el-table-column
            prop="type"
            label="题型"
            :formatter="formatType"
            width="100"
          />
          <el-table-column label="分值" width="120">
            <template #default="{ row }">
              <el-input
                v-model.number="row.score"
                placeholder="分值"
                type="number"
                min="0"
                style="width: 90px;"
              />
            </template>
          </el-table-column>
          <el-table-column label="选项预览">
            <template #default="{ row }">
              <div class="preview-options">
                <div v-for="opt in parsedOptions(row)" :key="opt.label" class="option-tag">
                  <span class="option-label">{{ opt.label }}.</span>
                  <span class="option-text">{{ opt.text }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="availableQuestionsPage"
          :page-size="availableQuestionsPageSize"
          :total="availableQuestionsTotal"
          layout="prev, pager, next"
          @current-change="fetchAvailableQuestions"
        />
      </el-form>
      <template #footer>
        <el-button @click="addQuestionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addSelectedQuestions">确定添加</el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog 
      v-model="previewDialogVisible" 
      title="试卷预览" 
      width="80%"
      class="preview-dialog"
    >
      <div class="preview-content">
        <template v-for="(group, groupIndex) in validGroups" :key="group.type">
            <h3 class="question-type-title">{{ getTypeTitle(group.type, groupIndex) }}</h3>
            <div 
              v-for="(question, qIndex) in group.questions"
              :key="question.questionId"
              class="question-item"
            >
            <div class="question-header">
              <span class="question-number">{{ getGlobalIndex(groupIndex, qIndex) + 1 }}.</span>
              <div class="question-content">
                <span v-html="question.content"></span>
                <span class="score-display">（{{ question.score }}分）</span>
              </div>
            </div>
            <div v-if="[1, 2, 3].includes(question.type)" class="options-grid">
              <div 
                v-for="option in parsedOptions(question)" 
                :key="option.label"
                class="option-item"
              >
                <span class="option-label">{{ option.label }}.</span>
                <span class="option-text">{{ option.text }}</span>
              </div>
            </div>
            <div class="answer-section">
              <span class="answer-label">答案：</span>
              <span class="answer-content">{{ formatAnswer(question) }}</span>
            </div>
          </div>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { getPaperWithAnswers, updatePaper } from '@/api/paper'
import { getQuestionList, getBankList } from '@/api/questionBank'

const route = useRoute()
const paperId = parseInt(route.params.paperId, 10)

// 试卷数据结构
const paperDetail = reactive({
  name: '',
  totalScore: 0,
  questions: []
})

// 安全解析方法
const safeParseJSON = (value) => {
  try {
    if (typeof value !== 'string') return value
    const cleaned = value
      .replace(/(^"+|"+$)/g, '')
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
    return JSON.parse(cleaned)
  } catch (e) {
    try {
      const fixed = value
        .replace(/(\w+):/g, '"$1":')
        .replace(/'/g, '"')
      return JSON.parse(fixed)
    } catch (err) {
      return value
    }
  }
}

// 答案格式化方法
const formatAnswer = (question) => {
  const { type, answer } = question
  try {
    switch (type) {
      case 1: // 单选题
        return handleSingleChoice(answer)
      case 2: // 多选题
        return handleMultipleChoice(answer)
      case 3: // 判断题
        return handleTrueFalse(answer)
      case 4: // 简答题
        return handleShortAnswer(answer)
      default:
        return answer
    }
  } catch (e) {
    console.error('答案解析失败:', e)
    return answer
  }
}

const parsedOptions = (question) => {
  if (question.type === 3) {
    return [
      { label: 'A', text: '正确' },
      { label: 'B', text: '错误' }
    ]
  }
  // 如果已经解析过就直接返回
  if (Array.isArray(question.options)) return question.options
  
  // 处理文本存储的JSON格式
  try {
    if (typeof question.options === 'string') {
      return JSON.parse(question.options.replace(/'/g, '"'))
    }
    return []
  } catch {
    return []
  }
}

const getGlobalIndex = (groupIndex, qIndex) => {
  let total = 0
  // 累加前序所有分组的题目数量
  for (let i = 0; i < groupIndex; i++) {
    total += validGroups.value[i].questions.length
  }
  return total + qIndex
}

// 更新validGroups计算属性
const validGroups = computed(() => {
  return Object.entries(groupedQuestions.value)
    .filter(([_, questions]) => questions.length > 0)
    .map(([type, questions]) => ({
      type: parseInt(type, 10),
      questions
    }))
})

// ========= 答案解析增强方法 =========
const handleMultipleChoice = (answer) => {
  try {
    let parsed = answer
    if (typeof answer === 'string') {
      parsed = JSON.parse(answer.replace(/'/g, '"'))
    }
    if (Array.isArray(parsed)) {
      return parsed.join('、')
    }
    // 处理未规范存储的答案（如"ABC"）
    const letters = answer.match(/[A-Z]/g)
    return letters ? letters.join('、') : answer
  } catch {
    return answer
  }
}

const handleSingleChoice = (answer) => {
  const cleaned = String(answer).replace(/[^A-Za-z]/g, '')
  return cleaned.charAt(0).toUpperCase()
}

const handleTrueFalse = (answer) => {
  const boolValue = String(answer).toLowerCase() === 'true' 
    || answer === true 
    || answer === 1
  return boolValue ? 'A' : 'B'
}

const handleShortAnswer = (answer) => {
  return String(answer).replace(/["']/g, '').trim()
}

// ========= 动态题型标题 =========
const groupedQuestions = computed(() => {
  return paperDetail.questions.reduce((groups, question) => {
    groups[question.type]?.push(question)
    return groups
  }, { 1: [], 2: [], 3: [], 4: [] })
})




const getTypeTitle = (type, index) => {
  const typeTitles = { 
    1: '单选题', 
    2: '多选题', 
    3: '判断题',
    4: '简答题' 
  }
  const chineseNumbers = ['一', '二', '三', '四']
  return `${chineseNumbers[index]}、${typeTitles[type]}`
}

// 加载试卷详情
const fetchPaperDetail = async () => {
  try {
    const res = await getPaperWithAnswers({ paperId })
    paperDetail.name = res.data.name
    paperDetail.totalScore = res.data.totalScore
    paperDetail.questions = (res.data.questions || []).map(q => ({
      ...q,
      options: safeParseJSON(q.options),
      answer: safeParseJSON(q.answer)
    }))
  } catch (error) {
    ElMessage.error('获取试卷详情失败')
  }
}

// 题库相关
const banks = ref([])
const fetchBanks = async () => {
  try {
    const res = await getBankList()
    banks.value = res.data?.bankList || []
  } catch (error) {
    ElMessage.error('题库加载失败')
  }
}

// 添加题目逻辑
const addQuestionDialogVisible = ref(false)
const selectedQuestionBankId = ref(null)
const selectedQuestionType = ref(null)
const availableQuestions = ref([])
const availableQuestionsPage = ref(1)
const availableQuestionsPageSize = ref(10)
const availableQuestionsTotal = ref(0)
const selectedAvailableQuestions = ref([])

const openAddQuestionDialog = () => {
  addQuestionDialogVisible.value = true
  fetchBanks()
}

const fetchAvailableQuestions = async () => {
  try {
    const res = await getQuestionList({
      bankId: selectedQuestionBankId.value,
      type: selectedQuestionType.value,
      page: availableQuestionsPage.value,
      size: availableQuestionsPageSize.value
    })
    availableQuestions.value = (res.data?.questions || []).map(q => ({
      ...q,
      score: q.score || 0,
      options: safeParseJSON(q.options),
      answer: safeParseJSON(q.answer)
    }))
    availableQuestionsTotal.value = res.data?.total || 0
  } catch (error) {
    ElMessage.error('题目加载失败')
  }
}

const handleAvailableSelectionChange = (selected) => {
  selectedAvailableQuestions.value = selected
}

const addSelectedQuestions = () => {
  selectedAvailableQuestions.value.forEach(q => {
    if (!paperDetail.questions.some(item => item.questionId === q.id)) {
      paperDetail.questions.push({
        questionId: q.id,
        content: q.content,
        type: q.type,
        options: q.options,
        answer: q.answer,
        score: q.score || 0
      })
    }
  })
  addQuestionDialogVisible.value = false
}

// 其他功能
const formatType = (_, __, cellValue) => {
  const typeMap = { 1: '单选题', 2: '多选题', 3: '判断题', 4: '简答题' }
  return typeMap[cellValue]
}

const removeQuestion = (index) => {
  paperDetail.questions.splice(index, 1)
}

// 预览逻辑
const previewDialogVisible = ref(false)
const handlePreview = () => {
  if (paperDetail.questions.length === 0) {
    ElMessage.warning('请先添加题目')
    return
  }
  const totalScore = paperDetail.questions.reduce((sum, q) => sum + (q.score || 0), 0)
  if (totalScore !== paperDetail.totalScore) {
    ElMessage.warning(`题目总分与试卷总分不一致（当前：${totalScore}分）`)
  }
  previewDialogVisible.value = true
}

// 保存试卷
const handleUpdatePaper = async () => {
  if (!paperDetail.name.trim()) {
    return ElMessage.error('试卷名称不能为空')
  }
  if (paperDetail.totalScore <= 0) {
    return ElMessage.error('试卷总分必须大于0')
  }

  // 确保总分数一致
  const total = paperDetail.questions.reduce((sum, q) => sum + (q.score || 0), 0)
  if (total !== paperDetail.totalScore) {
    return ElMessage.error(`题目总分必须等于试卷总分（当前题目总分：${total}分）`)
  }

  try {
    await updatePaper({
      paperId,
      name: paperDetail.name,
      totalScore: paperDetail.totalScore,
      questions: JSON.stringify(
        paperDetail.questions.map(q => ({
          id: q.questionId,
          score: q.score
        }))
      )
    })
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
    console.error('保存错误:', error)
  }
}

onMounted(() => {
  fetchPaperDetail()
  fetchBanks()
})
</script>

<style scoped>
/* 基础容器 */
.paper-detail {
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

/* 试卷信息表单 */
.paper-info {
  margin: 30px 0;
  padding: 25px;
}

/* 操作按钮 */
.actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
}

/* 预览对话框核心布局 */
.preview-dialog {
  /* 题目项 */
  .question-item {
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 1px solid #ddd;

    &:last-child {
      border-bottom: none;
    }

    .question-header {
      display: flex;
      margin-bottom: 15px;

      .question-number {
        margin-right: 10px;
        min-width: 24px;
      }

      .score-display {
        margin-left: 15px;
      }
    }
  }

  /* 选项网格 */
  .options-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px 30px;
    margin: 15px 0 20px 30px;

    .option-item {
      display: flex;
      align-items: center;

      .option-label {
        width: 20px;
        flex-shrink: 0;
      }
    }

    @media (max-width: 768px) {
      gap: 8px 20px;
      margin-left: 20px;
    }
  }

  /* 题型标题 */
  .question-type-title {
    margin: 25px 0;
    padding-left: 10px;
    border-left: 3px solid #333;
  }
}
</style>
