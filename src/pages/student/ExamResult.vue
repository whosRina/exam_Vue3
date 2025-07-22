<template>
    <div class="result-container">
      <!-- 考试结果摘要 -->
      <el-card class="result-summary">
        <div class="summary-content">
          <h2>{{ examResult.paperName }} 考试结果</h2>
          <el-row :gutter="40" class="score-row">
            <el-col :span="8">
              <div class="score-item total">
                <div class="label">总分</div>
                <div class="value">{{ examResult.totalScore }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="score-item obtained">
                <div class="label">得分</div>
                <div class="value">{{ examResult.examScore }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="score-item status" :class="examResult.gradingStatus">
                <div class="label">状态</div>
                <div class="value">{{ getStatusText(examResult.gradingStatus) }}</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
      <!-- 主体内容 -->
      <div class="main-content">
        <!-- 题目列表 -->
        <el-card class="result-list">
          <!-- 动态生成题型分类 -->
          <template v-for="(typeGroup, typeIndex) in filteredQuestionGroups" :key="typeGroup.type">
            <div class="question-type-header">
              <h3>{{ getChineseNumber(typeIndex + 1) }}、{{ typeGroup.title }}</h3>
            </div>
            
            <template v-for="(q, qIndex) in typeGroup.questions" :key="q.questionId">
              <div class="question-item" :class="getQuestionClass(q)" :id="`q-${q.questionId}`">
                <div class="question-header">
                  <span class="question-index">{{ getGlobalIndex(q.questionId) }}.</span>
                  <span class="question-content" v-html="q.content"></span>
                  <span class="question-score" :class="getScoreClass(q)">
                    {{ q.studentScore }}/{{ q.totalScore }}
                  </span>
                </div>
                <div class="question-body">
                  <!-- 多选题 -->
                  <template v-if="q.type === 2">
                    <div class="options-container">
                      <div class="option-row" v-for="opt in parseOptions(q.options)" :key="opt.label">
                        <div class="option-tag" :class="getOptionClass(q, opt.label)">
                          {{ opt.label }}.
                        </div>
                        <div class="option-content">{{ opt.text }}</div>
                      </div>
                    </div>
                    <div class="answer-info">
                      <div class="correct-answer">
                        正确答案: <span>{{ formatArrayAnswer(q.answer) }}</span>
                      </div>
                      <div class="student-answer" v-if="q.studentAnswer">
                        你的答案: <span>{{ formatArrayAnswer(q.studentAnswer) }}</span>
                      </div>
                      <div class="student-answer empty" v-else>未作答</div>
                    </div>
                  </template>
                  <!-- 单选题 -->
                  <template v-else-if="q.type === 1">
                    <div class="options-container">
                      <div class="option-row" v-for="opt in parseOptions(q.options)" :key="opt.label">
                        <div class="option-tag" :class="getOptionClass(q, opt.label)">
                          {{ opt.label }}.
                        </div>
                        <div class="option-content">{{ opt.text }}</div>
                      </div>
                    </div>
                    <div class="answer-info">
                      <div class="correct-answer">
                        正确答案: <span>{{ q.answer }}</span>
                      </div>
                      <div class="student-answer" v-if="q.studentAnswer">
                        你的答案: <span>{{ q.studentAnswer }}</span>
                      </div>
                      <div class="student-answer empty" v-else>未作答</div>
                    </div>
                  </template>
                  <!-- 判断题 -->
                  <template v-else-if="q.type === 3">
                    <div class="options-container">
                      <div class="option-row">
                        <div class="option-tag" :class="getOptionClass(q, 'A')">A.</div>
                        <div class="option-content">正确</div>
                      </div>
                      <div class="option-row">
                        <div class="option-tag" :class="getOptionClass(q, 'B')">B.</div>
                        <div class="option-content">错误</div>
                      </div>
                    </div>
                    <div class="answer-info">
                      <div class="correct-answer">
                        正确答案: <span>{{q.answer === 'true' ? '正确' : '错误' }}</span>
                      </div>
                      <div class="student-answer" v-if="q.studentAnswer !== undefined && q.studentAnswer !== null">
                      你的答案: 
                      <span>{{ q.studentAnswer === true ? '正确' : '错误' }}</span>
                    </div>
                    <div class="student-answer empty" v-else>
                      未作答
                    </div>
                    </div>
                  </template>
                  <!-- 简答题 -->
                  <template v-else-if="q.type === 4">
                    <div class="answer-info">
                      <div class="correct-answer">
                        参考答案: <span>{{ q.answer }}</span>
                      </div>
                      <div class="student-answer-block" v-if="q.studentAnswer">
                        你的答案: 
                        <div class="student-answer-text">{{ q.studentAnswer }}</div>
                      </div>
                      <div class="student-answer empty" v-else>未作答</div>
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </template>
        </el-card>
        <!-- 右侧分类答题卡 -->
        <el-card class="answer-sheet">
          <div class="sheet-header">
            <h3>答题卡</h3>
            <div class="legend">
              <div class="legend-item">
                <span class="color-dot correct"></span>
                <span>正确</span>
              </div>
              <div class="legend-item">
                <span class="color-dot incorrect"></span>
                <span>错误</span>
              </div>
              <div class="legend-item">
                <span class="color-dot partial"></span>
                <span>部分</span>
              </div>
              <div class="legend-item">
                <span class="color-dot no-answer"></span>
                <span>未答</span>
              </div>
            </div>
          </div>
          
          <!-- 分类答题卡内容 -->
          <div class="classified-sheet-body">
            <div 
              v-for="(typeGroup, typeIndex) in filteredQuestionGroups" 
              :key="typeGroup.type" 
              class="question-type-section"
            >
              <h4>{{ getChineseNumber(typeIndex + 1) }}、{{ typeGroup.title }}</h4>
              <div class="question-index-container">
                <div 
                  v-for="q in typeGroup.questions" 
                  :key="q.questionId"
                  class="sheet-item"
                  :class="getSheetItemClass(q)"
                  @click="scrollToQuestion(q.questionId)"
                >
                  {{ getGlobalIndex(q.questionId) }}
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </template>
  <script setup>
  import { ref, computed, onMounted,reactive } from 'vue'
  import { useRoute } from 'vue-router'
  import { getExamResult } from '@/api/exam'
  import { ElMessage } from 'element-plus'
  const route = useRoute()
  const examResult = ref({
    paperName: '',
    totalScore: 0,
    examScore: 0,
    gradingStatus: '',
    questions: []
  })
  // 题目类型映射
  const questionTypes = {
    1: { title: '单选题' },
    2: { title: '多选题' },
    3: { title: '判断题' },
    4: { title: '简答题' }
  }
  // 中文数字
  const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  // 加载考试结果
  const fetchExamResult = async (examId) => {
    try {
      const res = await getExamResult(examId)
      examResult.value = res.data
    } catch (error) {
      ElMessage.error('获取考试结果失败')
      console.error('获取考试结果失败:', error)
    }
  }
  onMounted(async () => {
    const examId = Number(route.params.id)
    await fetchExamResult(examId)
  })
  

// 在setup顶部定义响应式Map
const globalIndexMap = reactive(new Map())

const filteredQuestionGroups = computed(() => {
  const sortedQuestions = [...examResult.value.questions].sort((a, b) => a.type - b.type)
  
  // 清空并重新填充Map
  globalIndexMap.clear()
  sortedQuestions.forEach((q, index) => {
    globalIndexMap.set(q.questionId, index + 1)
  })

  const existingTypes = [...new Set(sortedQuestions.map(q => q.type))]
  return existingTypes.map(type => ({
    type,
    title: questionTypes[type]?.title || `题型${type}`,
    questions: sortedQuestions.filter(q => q.type === type)
  }))
})


const getGlobalIndex = (questionId) => {
  return globalIndexMap.get(questionId) || 0
}





  // 工具方法
  const parseOptions = (options) => {
    try {
      return typeof options === 'string' ? JSON.parse(options) : options
    } catch {
      return []
    }
  }
  const formatArrayAnswer = (answer) => {
    try {
      const arr = typeof answer === 'string' ? JSON.parse(answer) : answer
      return Array.isArray(arr) ? arr.join('、') : arr
    } catch {
      return answer
    }
  }
  const getStatusText = (status) => {
    const statusMap = {
      'graded': '已批改',
      'pending': '待批改',
    }
    return statusMap[status] || status
  }
  const getChineseNumber = (num) => chineseNumbers[num - 1] || num

  // 题目样式类
  const getQuestionClass = (q) => {
    if (q.studentScore === q.totalScore) return 'correct'
    if (q.studentScore > 0) return 'partially-correct'
    if (q.studentAnswer && !q.studentAnswer.length) return 'wrong'
    return 'no-answer'
  }
  const getScoreClass = (q) => {
    if (q.studentScore === q.totalScore) return 'full'
    if (q.studentScore > 0) return 'partial'
    return 'zero'
  }
  const getOptionClass = (q, option) => {
    const correctAnswer = q.type === 2 ? 
      (Array.isArray(q.answer) ? q.answer : JSON.parse(q.answer || '[]')) : 
      q.answer
    const studentAnswer = q.type === 2 ? 
      (Array.isArray(q.studentAnswer) ? q.studentAnswer : JSON.parse(q.studentAnswer || '[]')) : 
      q.studentAnswer
    const isCorrect = q.type === 2 ? 
      correctAnswer.includes(option) : 
      correctAnswer === option
    
    const isSelected = studentAnswer ? 
      (q.type === 2 ? studentAnswer.includes(option) : studentAnswer === option) : 
      false
    return {
      'correct': isCorrect,
      'incorrect': isSelected && !isCorrect,
      'missed': isCorrect && !isSelected
    }
  }
  const getSheetItemClass = (q) => {
    if (q.studentScore === q.totalScore) return 'correct'
    if (q.studentScore > 0 && q.studentScore < q.totalScore) return 'partial'
    if (q.studentAnswer && q.studentAnswer.length > 0) return 'incorrect'
    return 'no-answer'
  }
  const scrollToQuestion = (questionId) => {
    const el = document.getElementById(`q-${questionId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  </script>
  
  <style scoped>
.result-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.result-summary {
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.summary-content {
  padding: 20px;
}

.summary-content h2 {
  margin: 0 0 20px;
  color: #303133;
  font-size: 22px;
  font-weight: 600;
}

.score-row {
  margin-top: 20px;
  display: flex;
}

.score-item {
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.score-item .label {
  font-size: 16px;
  color: #666;
}

.score-item .value {
  font-size: 24px;
  font-weight: bold;
  margin-top: 5px;
}

.score-item.total {
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
  color: #67c23a;
}

.score-item.obtained {
  background-color: #ecf5ff;
  border: 1px solid #d9ecff;
  color: #409eff;
}

.score-item.status {
  background-color: #fdf6ec;
  border: 1px solid #faecd8;
  color: #e6a23c;
}

.score-item.status.graded {
  background-color: #f0f9eb;
  border-color: #e1f3d8;
  color: #67c23a;
}

.score-item.status.pending {
  background-color: #fdf6ec;
  border-color: #faecd8;
  color: #e6a23c;
}

.main-content {
  display: flex;
  gap: 20px;
}

.result-list {
  flex: 1;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.question-type-header {
  margin: 20px 0 15px;
  padding: 10px 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.question-type-header h3 {
  margin: 0;
  font-size: 18px;
  color: #606266;
  font-weight: 500;
}

.question-item {
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 4px;
  transition: all 0.3s;
  position: relative;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.question-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.question-item.correct {
  border-left: 4px solid #67c23a;
  background-color: rgba(103, 194, 58, 0.05);
}

.question-item.partially-correct {
  border-left: 4px solid #e6a23c;
  background-color: rgba(230, 162, 60, 0.05);
}

.question-item.wrong {
  border-left: 4px solid #f56c6c;
  background-color: rgba(245, 108, 108, 0.05);
}

.question-item.no-answer {
  border-left: 4px solid #909399;
  background-color: rgba(144, 147, 153, 0.05);
}

.question-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
}

.question-index {
  margin-right: 8px;
  font-weight: bold;
  color: #606266;
  min-width: 20px;
}

.question-content {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  color: #303133;
  line-height: 1.5;
}

.question-content :deep(){img {
  max-width: 100%;
  height: auto;
}}

.question-score {
  margin-left: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 14px;
}

.question-score.full {
  color: #67c23a;
  background-color: rgba(103, 194, 58, 0.1);
}

.question-score.partial {
  color: #e6a23c;
  background-color: rgba(230, 162, 60, 0.1);
}

.question-score.zero {
  color: #f56c6c;
  background-color: rgba(245, 108, 108, 0.1);
}

.options-container {
  margin: 10px 0;
  padding-left: 15px;
}

.option-row {
  display: flex;
  align-items: center;
  margin: 5px 0;
}

.option-tag {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-right: 8px;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
}

.option-tag.correct {
  background-color: #67c23a;
  color: white;
}

.option-tag.incorrect {
  background-color: #f56c6c;
  color: white;
}

.option-tag.missed {
  background-color: #409eff;
  color: white;
}

.option-content {
  font-size: 15px;
  color: #606266;
  line-height: 1.4;
}

.answer-info {
  margin-top: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.correct-answer {
  margin-bottom: 5px;
  font-size: 14px;
  color: #606266;
}

.correct-answer span {
  font-weight: 500;
  color: #67c23a;
}

.student-answer,
.student-answer-block {
  font-size: 14px;
  color: #606266;
}

.student-answer span {
  font-weight: 500;
  color: #409eff;
}

.student-answer.empty {
  color: #909399;
  font-style: italic;
}

.student-answer-text {
  white-space: pre-wrap;
  padding: 5px;
  background-color: white;
  border-radius: 4px;
  margin-top: 5px;
  border: 1px solid #ebeef5;
}

.answer-sheet {
  width: 280px;
  position: sticky;
  top: 20px;
  height: fit-content;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.sheet-header {
  margin-bottom: 15px;
}

.sheet-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #606266;
}

.color-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 5px;
}

.color-dot.correct {
  background-color: #67c23a;
}

.color-dot.incorrect {
  background-color: #f56c6c;
}

.color-dot.partial {
  background-color: #e6a23c;
}

.color-dot.no-answer {
  background-color: #909399;
}

.classified-sheet-body {
  margin-top: 10px;
  max-height: 70vh;
  overflow-y: auto;
}

.question-type-section {
  margin-bottom: 15px;
}

.question-type-section h4 {
  margin: 0 0 8px;
  font-size: 15px;
  color: #606266;
  font-weight: 500;
}

.question-index-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sheet-item {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background-color: #f5f7fa;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #606266;
}

.sheet-item:hover {
  transform: scale(1.1);
}

.sheet-item.correct {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.sheet-item.incorrect {
  background-color: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.sheet-item.partial {
  background-color: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.sheet-item.no-answer {
  background-color: rgba(144, 147, 153, 0.1);
  color: #909399;
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
  
  .answer-sheet {
    width: 100%;
    position: static;
    margin-top: 20px;
  }
  
  .score-row {
    flex-direction: column;
  }
  
  .score-item {
    margin-bottom: 10px;
  }
  
  .question-item {
    padding: 12px;
  }
}

/* 添加动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-list .question-item {
  animation: fadeIn 0.3s ease-out;
  animation-fill-mode: both;
}

.result-list .question-item:nth-child(1) { animation-delay: 0.1s; }
.result-list .question-item:nth-child(2) { animation-delay: 0.15s; }
.result-list .question-item:nth-child(3) { animation-delay: 0.2s; }
.result-list .question-item:nth-child(4) { animation-delay: 0.25s; }
.result-list .question-item:nth-child(5) { animation-delay: 0.3s; }
.result-list .question-item:nth-child(n+6) { animation-delay: 0.35s; }
</style>
