<template>
  <div class="manual-grading">
    <el-card class="header-card">
      <h2>人工阅卷 <span class="remaining-count" v-if="remainingExams > 0">（剩余{{ remainingExams }}份）</span></h2>
    </el-card>

    <el-card class="content-card">
      <div v-if="gradingData.length > 0">
        <h3 class="grading-status">
          <el-icon><Edit /></el-icon> 正在批阅试卷
        </h3>
        
        <div class="grading-container">
          <!-- 左侧：题目栏 -->
          <div class="question-list">
            <h3 class="section-title"><el-icon><List /></el-icon> 题目列表</h3>
            <el-divider />
            <div v-for="(question, index) in gradingData" 
                 :key="question.questionId" 
                 class="question-item"
                 :class="{ 'modified': isScoreModified(question.questionId) }">
              <p class="question-number">
                <span class="index-badge">{{ index + 1 }}</span>
                {{ question.content }}
                <span class="score-tag">（{{ question.score }}分）</span>
              </p>
              <div class="answer-container">
                <div class="ref-answer">
                  <el-tag type="info" size="small">参考答案</el-tag>
                  <pre>{{ cleanAnswer(question.answer) }}</pre>
                </div>
                <div class="student-answer">
                  <el-tag type="warning" size="small">考生答案</el-tag>
                  <pre>{{ question.studentAnswer || '未作答' }}</pre>
                </div>
              </div>
              <el-input-number
                v-model="gradingScores[question.questionId]"
                :min="0"
                :max="question.score"
                controls-position="right"
                class="score-input"
              />
            </div>
          </div>

          <!-- 右侧：答题卡 -->
          <div class="answer-sheet">
            <div class="sticky-container">
              <h3 class="section-title"><el-icon><Postcard /></el-icon> 答题卡</h3>
              <el-divider />
              <div class="sheet-info">
                <el-statistic title="剩余试卷" :value="remainingExams" />
                <el-progress 
                  :percentage="progressPercentage" 
                  :stroke-width="12"
                  status="success"
                  class="progress" />
              </div>
              <div class="sheet-grid">
                <div 
                  v-for="(question, index) in gradingData" 
                  :key="question.questionId"
                  class="sheet-item"
                  :class="{ 
                    modified: isScoreModified(question.questionId),
                    current: currentQuestion === index
                  }"
                  @click="scrollToQuestion(index)">
                  <el-badge 
                    :value="gradingScores[question.questionId]" 
                    :max="question.score"
                    type="primary">
                    <el-button circle>{{ index + 1 }}</el-button>
                  </el-badge>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <el-button 
          type="primary" 
          class="submit-btn"
          size="large"
          @click="submitScores">
          <template #icon><Position /></template>
          提交评分
        </el-button>
      </div>
      <div v-else class="empty-state">
        <el-empty description="所有试卷已批阅完毕" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute,useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Edit, List, Postcard, Position } from '@element-plus/icons-vue'
import { listManualGrading, ManualScore, submitManualScore } from '@/api/exam'

const router = useRouter()
const route = useRoute()
const examId = Number(route.params.id)
const gradingData = ref([])
const gradingScores = ref({})
const originalScores = ref({})
const attemptList = ref([])
const currentQuestion = ref(0)
const currentAttemptId = ref(null) 

// 计算属性
const remainingExams = computed(() => attemptList.value.length)
const progressPercentage = computed(() => {
  return attemptList.value.length > 0 
    ? 100 - (attemptList.value.length / (attemptList.value.length + 1) * 100) 
    : 100
})

onMounted(async () => {
  await loadNextExam()
})


const loadNextExam = async () => {
  try {
    const res = await listManualGrading({ examId })
    attemptList.value = res.data.attemptList
    if (attemptList.value.length === 0) {
      gradingData.value = [] // 清空当前试卷数据
      return
    }
    
    // 提取并保存当前试卷ID
    currentAttemptId.value = attemptList.value[0]
    await fetchExamDetails(currentAttemptId.value)
    
    // 移动获取后立即从队列移除（但保留currentAttemptId）
    attemptList.value.shift()
  } catch (error) {
    ElMessage.error('加载待批阅试卷失败')
  }
}

const fetchExamDetails = async (attemptId) => {
  try {
    const res = await ManualScore({ attemptId })
    
    // 情况1：空数据自动完成批阅
    if (!res.data?.questions) {
      await submitManualScore({
        attemptId,
        manualScores: JSON.stringify({}) // 空评分
      })
      ElMessage.success(`试卷 ${attemptId} 无题目数据自动完成`)
      await loadNextExam() // 立即加载下一份
      return
    }

    // 情况2：正常数据走人工批阅流程
    gradingData.value = res.data.questions
    initScores()
  } catch (error) {
    ElMessage.error(`处理试卷 ${attemptId} 失败`)
    console.error('Error:', error)
  }
}

const submitScores = async () => {
  try {
    // 空数据防护
    if (!currentAttemptId.value || Object.keys(gradingScores.value).length === 0) {
      return await autoCompleteEmptyExam()
    }

    await submitManualScore({ 
      attemptId: currentAttemptId.value,
      manualScores: JSON.stringify(gradingScores.value) 
    })
    ElMessage.success('评分已提交')
    if (attemptList.value.length === 0) {
    router.push(`/exam-management/detail/${examId}`)
  } else {
    await loadNextExam()
  }
  } catch (error) {
    ElMessage.error(error.message || '提交评分失败')
  }
}

// 辅助方法：自动完成无题目试卷
const autoCompleteEmptyExam = async () => {
  await submitManualScore({
    attemptId: currentAttemptId.value,
    manualScores: '{}'
  })
  ElMessage.success('空试卷自动完成批阅')
  
  if (attemptList.value.length === 0) {
    router.push(`/exam-management/detail/${examId}`)
  } else {
    await loadNextExam()
  }
}


const initScores = () => {
  gradingScores.value = {}
  originalScores.value = {}
  gradingData.value.forEach(q => {
    gradingScores.value[q.questionId] = 0
    originalScores.value[q.questionId] = 0
  })
}



const cleanAnswer = (answer) => {
  return answer?.replace(/^"(.*)"$/, '$1') || '未提供答案'
}

const isScoreModified = (questionId) => {
  return gradingScores.value[questionId] !== originalScores.value[questionId]
}

const scrollToQuestion = (index) => {
  currentQuestion.value = index
  const questionEl = document.querySelectorAll('.question-item')[index]
  questionEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>

<style scoped lang="scss">
.manual-grading {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;

  .header-card {
    margin-bottom: 20px;
    background: linear-gradient(135deg, #409eff, #79bbff);
    
    h2 {
      color: white;
      display: flex;
      align-items: center;
      gap: 8px;
      
      .remaining-count {
        font-size: 0.8em;
        opacity: 0.9;
      }
    }
  }

  .grading-status {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #606266;
    margin-bottom: 20px;
  }

  .grading-container {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 24px;
  }

  .question-list {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

    .question-item {
      padding: 20px;
      margin-bottom: 16px;
      border-radius: 8px;
      transition: all 0.3s;
      border: 1px solid #ebeef5;

      &.modified {
        border-color: #409eff;
        background: #f0f7ff;
      }
    }

    .question-number {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      margin-bottom: 12px;

      .index-badge {
        background: #409eff;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }

      .score-tag {
        color: #67c23a;
        font-size: 0.9em;
      }
    }

    .answer-container {
      margin: 12px 0;
      
      pre {
        white-space: pre-wrap;
        background: #f8f9fa;
        padding: 12px;
        border-radius: 4px;
        margin: 8px 0;
      }
    }

    :deep(.el-input-number) {
      width: 120px;
      
      .el-input__inner {
        text-align: center;
      }
    }
  }

  .answer-sheet {
    position: relative;

    .sticky-container {
      position: sticky;
      top: 20px;
    }

    .sheet-info {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

      .progress {
        margin-top: 12px;
      }
    }

    .sheet-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
      gap: 12px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

      .sheet-item {
        position: relative;
        cursor: pointer;
        transition: all 0.3s;

        :deep(.el-badge__content) {
          transform: scale(0.8);
        }

        &.modified {
          .el-button {
            background: #409eff !important;
            border-color: #409eff;
            color: white;
          }
        }

        &.current {
          .el-button {
            transform: scale(1.1);
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
          }
        }

        .el-button {
          transition: all 0.3s;
          width: 40px;
          height: 40px;
        }
      }
    }
  }

  .submit-btn {
    width: 200px;
    margin: 24px auto 0;
    display: block;
  }

  .empty-state {
    padding: 40px 0;
  }
}
</style>
