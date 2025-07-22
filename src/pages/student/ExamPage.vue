<template>
 <div ref="examContainer" class="exam-container">
  <div class="exam-page">
    <!-- 标题卡 -->
    <el-card class="header-card">
      <div class="header-content">
       <h2>{{ paperDetail.paperName }}</h2>
      </div>
    </el-card>
    
    <div class="content-container">
      <!-- 左侧题目列表 -->
      <div class="question-list">
        <!-- 动态生成题型分类 -->
        <template v-for="(typeGroup, typeIndex) in filteredQuestionGroups" :key="typeGroup.type">
          <el-card class="question-type-header">
            <h3>{{ getChineseNumber(typeIndex + 1) }}、{{ typeGroup.title }}</h3>
          </el-card>
          
          <!-- 该题型下的题目列表 -->
          <el-card 
            v-for="(q, qIndex) in typeGroup.questions" 
            :key="q.questionId" 
            class="question-card"
            :ref="el => questionRefs[q.questionId] = el"
          >
            <div class="question-header">
              <span class="question-number">{{ getGlobalIndex(q.questionId) }}.</span>
              <span class="question-content" v-html="q.content"></span>
              <span class="question-score">（{{ q.score }}分）</span>
            </div>
            <div class="question-body">
              <template v-if="q.type === 1">
                <el-radio-group 
                  v-model="answers[q.questionId]" 
                  class="option-row" 
                  @change="() => autoSaveAnswer()"
                >
                  <el-radio
                    v-for="opt in parseOptions(q.options)"
                    :key="opt.label"
                    :label="opt.label"
                    class="option-item"
                  >
                    <span>{{ opt.label }}. {{ opt.text }}</span>
                  </el-radio>
                </el-radio-group>
              </template>
              <template v-else-if="q.type === 2">
                <el-checkbox-group 
                  v-model="answers[q.questionId]" 
                  @change="() => autoSaveAnswer()"
                >
                  <div class="option-row">
                    <el-checkbox
                      v-for="opt in parseOptions(q.options)"
                      :key="opt.label"
                      :label="opt.label"
                    >
                      <span>{{ opt.label }}. {{ opt.text }}</span>
                    </el-checkbox>
                  </div>
                </el-checkbox-group>
              </template>
              <template v-else-if="q.type === 3">
                <el-radio-group 
                  v-model="answers[q.questionId]" 
                  @change="() => autoSaveAnswer()"
                >
                  <div class="option-row">
                    <el-radio label="A">正确</el-radio>
                    <el-radio label="B">错误</el-radio>
                  </div>
                </el-radio-group>
              </template>
              <template v-else-if="q.type === 4">
                <el-input
                  type="textarea"
                  v-model="answers[q.questionId]"
                  placeholder="请输入答案"
                  :rows="4"
                  @blur="autoSaveAnswer()"
                />
              </template>
            </div>
          </el-card>
        </template>
      </div>

      
      <!-- 右侧答题卡 -->
      <div class="answer-card">
        <!-- 考试信息卡（计时器+总分+保存状态） -->
        <el-card class="exam-info-card">
    <div class="exam-info-container">
    <!-- 考试信息行 -->
    <div class="info-row">
      <!-- 计时器部分 -->
      <div class="info-item timer-box">
        <el-icon class="icon"><Clock /></el-icon>
        <div class="timer-content">
          <span class="label">剩余时间</span>
          <span class="value time-text">
            {{ remainingTime.hours }}时{{ remainingTime.minutes }}分{{ remainingTime.seconds }}秒
          </span>
        </div>
      </div>
        <!-- 总分部分 -->
      <div class="info-item score-box">
        <el-icon class="icon"><Collection /></el-icon>
        <div class="score-content">
          <span class="label">总分</span>
          <span class="value">{{ paperDetail.totalScore }}分</span>
        </div>
      </div>
    </div>
    
    <!-- 保存状态行 -->
    <div class="status-row">
      <div class="status-item" :class="saveStatusClass">
        <el-icon class="status-icon"><component :is="saveStatusIcon" /></el-icon>
        <span class="status-text">{{ lastSaveMessage }}</span>
      </div>
    </div>
    </div>
  </el-card>

        
        <!-- 答题卡内容 -->
        <el-card class="answer-sheet-card">
          <div class="card-header">
            <h3>答题卡</h3>
            <div class="stats-container">
              <el-statistic :value="answeredCount" title="已答题" class="stat-item">
                <template #suffix>/{{ paperDetail.questions.length }}</template>
              </el-statistic>
              <el-statistic 
                :value="unansweredCount" 
                title="未答题" 
                class="stat-item" 
                v-if="unansweredCount > 0"
              />
            </div>
          </div>
          <div class="question-index-panel">
            <!-- 按题型分组显示题号按钮 -->
            <div v-for="(typeGroup, typeIndex) in filteredQuestionGroups" 
                 :key="typeGroup.type" 
                 class="question-type-section">
              <h4>{{ getChineseNumber(typeIndex + 1) }}、{{ typeGroup.title }}</h4>
              <div class="question-index-container">
                <el-button
                  v-for="q in typeGroup.questions"
                  :key="q.questionId"
                  :type="getAnswerStatus(q.questionId)"
                  circle
                  size="small"
                  @click="scrollToQuestion(q.questionId)"
                  class="index-button"
                >
                  {{ getGlobalIndex(q.questionId) }}
                </el-button>
              </div>
            </div>
          </div>
          <!-- 提交按钮 -->
          <div class="card-actions">
            <el-button 
              type="primary" 
              @click="handleConfirmSubmit" 
              size="large"
              style="width: 100%"
              :disabled="examFinished"
            >
              <el-icon><Upload /></el-icon>
              提交考试
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
    
    <!-- 提交确认对话框 -->
    <el-dialog
      v-model="submitDialogVisible"
      title="确认提交"
      width="30%"
    >
      <p>您还有 <span class="unanswered-count">{{ unansweredCount }}</span> 道题未作答</p>
      <p>确定要提交试卷吗？提交后不可修改</p>
      <template #footer>
        <el-button @click="submitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认提交</el-button>
      </template>
    </el-dialog>
    
    <!-- 考试结束自动提交提示 -->
    <el-dialog
      v-model="autoSubmitDialogVisible"
      title="考试结束提示"
      width="30%"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <p>考试时间已结束，系统已自动提交您的答案</p>
      <template #footer>
        <el-button type="primary" @click="navigateToResult">查看成绩</el-button>
      </template>
    </el-dialog>
  </div>
</div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { getPaperForStudent, submitExam, submitAnswer } from '@/api/exam'

// 配置常量
const SAVE_DELAY = 10000 // 自动保存延迟时间(ms)

// 状态管理
const paperDetail = reactive({
  paperName: '',
  totalScore: 0,
  questions: [],
  startTime: '',
  endTime: '', 
  ExamId: -1,
})

const answers = reactive({})
const questionRefs = ref({})
const submitDialogVisible = ref(false)
const autoSubmitDialogVisible = ref(false)
const lastSaveMessage = ref('自动保存准备中')
const examFinished = ref(false)
const canAutoSave = ref(false)


// 保存状态的图标和样式
const saveStatusIcon = computed(() => {
  return {
    '未保存': 'Loading',
    '已保存': 'CircleCheck',
    '保存失败': 'CircleClose',
    '自动保存准备中': 'Loading'
  }[lastSaveMessage.value] || 'Warning'
})

const saveStatusClass = computed(() => {
  return {
    'status-pending': ['未保存', '自动保存准备中'].includes(lastSaveMessage.value),
    'status-success': lastSaveMessage.value === '已保存',
    'status-error': lastSaveMessage.value === '保存失败'
  }
})


// 计时器状态
const remainingTime = reactive({
  hours: 0,
  minutes: 0,
  seconds: 0
})

// 全屏状态
const examContainer = ref(null)
const isFullscreen = ref(false)
const fullscreenWarning = ref(false)

let timer = null
let saveDebounceTimer = null

// 路由和映射表
const route = useRoute()
const router = useRouter()
const questionTypes = {
  1: { title: '单选题' },
  2: { title: '多选题' },
  3: { title: '判断题' },
  4: { title: '简答题' }
}
const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']




// 初始化答案时特殊处理判断题
const initAnswers = (questions) => {
  questions.forEach(q => {
    if (q.type === 2) {
      answers[q.questionId] = q.answer ? (Array.isArray(q.answer) ? q.answer : [q.answer]) : []
    } 
    else if (q.type === 3) {
      answers[q.questionId] = 
        q.answer === true ? 'A' :
        q.answer === false ? 'B' :
        ''
    }
    else {
      answers[q.questionId] = q.answer || ''
    }
  })
}

const prepareAnswersForSubmit = () => {
  const processed = { ...answers }
  paperDetail.questions.forEach(q => {
    if (q.type === 3) { // 判断题
      const answer = answers[q.questionId]
      // 处理后端需要的布尔值，同时处理所有可能的前端值
      processed[q.questionId] = 
        answer === 'A' ? true :    // 前端选择"正确"
        answer === 'B' ? false :   // 前端选择"错误"
        answer === true ? true :   // 兼容直接传布尔值的情况
        answer === false ? false : // 兼容直接传布尔值的情况
        null                       // 未作答状态
    }
  })
  return processed
}

// 解析题目选项
const parseOptions = (options) => {
  try {
    return typeof options === 'string' ? JSON.parse(options) : options
  } catch {
    return []
  }
}

// 获取试卷数据
const fetchExamData = async () => {
  try {
    const res = await getPaperForStudent({ attemptId: Number(route.params.id) })
    
    initAnswers(res.data.questions)
    Object.assign(paperDetail, {
      ExamId: res.data.examId,
      paperName: res.data.paperName,
      totalScore: res.data.totalScore,
      questions: res.data.questions,
      startTime: res.data.startTime,
      endTime: res.data.endTime
    })
    
    setTimeout(() => {
      canAutoSave.value = true
      lastSaveMessage.value = '自动保存已启用'
    }, SAVE_DELAY)
    
    initExamTimer()
  } catch (error) {
    ElMessage.error('加载考试数据失败')
    console.error('考试数据加载错误:', error)
  }
}


const globalIndexMap = reactive(new Map())

const filteredQuestionGroups = computed(() => {
  // 1. 按原始顺序建立题目ID到索引的映射
  const originalIndices = new Map(
    paperDetail.questions.map((q, index) => [q.questionId, index])
  )

  // 2. 清空并重新填充序号Map
  globalIndexMap.clear()
  let currentIndex = 0

  // 3. 生成分组数据
  const existingTypes = [...new Set(paperDetail.questions.map(q => q.type))]
    .sort((a, b) => a - b)

  return existingTypes.map(type => {
    const questions = paperDetail.questions
      .filter(q => q.type === type)
      .sort((a, b) => {
        // 安全获取索引，如果不存在则返回0（或其他默认值）
        const indexA = originalIndices.get(a.questionId) || 0
        const indexB = originalIndices.get(b.questionId) || 0
        return indexA - indexB
      })

    // 填充全局序号
    questions.forEach(q => {
      currentIndex += 1
      globalIndexMap.set(q.questionId, currentIndex)
    })

    return {
      type,
      title: questionTypes[type]?.title || `题型${type}`,
      questions
    }
  })
})



// 通过.value访问计算属性返回的Map

const getGlobalIndex = (questionId) => {
  return globalIndexMap.get(questionId) || 0
}

const answeredCount = computed(() => {
  return paperDetail.questions.filter(q => {
    const answer = answers[q.questionId]
    return q.type === 2 ? answer?.length > 0 : answer?.trim() !== ''
  }).length
})

const unansweredCount = computed(() => paperDetail.questions.length - answeredCount.value)

// 工具方法

const getChineseNumber = (num) => chineseNumbers[num - 1] || num

const getAnswerStatus = (questionId) => {
  const answer = answers[questionId]
  const question = paperDetail.questions.find(q => q.questionId === questionId)
  return (question?.type === 2 ? answer?.length > 0 : answer?.trim() !== '') 
    ? 'primary' : 'info'
}

// 题目导航
const scrollToQuestion = (questionId) => {
  const el = questionRefs.value[questionId]?.$el || questionRefs.value[questionId]
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 自动保存逻辑
const autoSaveAnswer = async () => {
  if (!canAutoSave.value || examFinished.value) return

  clearTimeout(saveDebounceTimer)
  lastSaveMessage.value = '保存中...'

  saveDebounceTimer = setTimeout(async () => {

    
    try {
      await submitAnswer({
        attemptId: Number(route.params.id),
        answer: JSON.stringify(prepareAnswersForSubmit())
      })
      lastSaveMessage.value = '已保存'
    } catch (error) {
      console.error('保存失败:', error)
      lastSaveMessage.value = '保存失败'
    }
  }, 3000)
}

watch(answers, () => autoSaveAnswer(), { deep: true })

// 考试计时器
const initExamTimer = () => {
  clearInterval(timer)
  
  timer = setInterval(() => {
    const now = dayjs()
    const endTime = dayjs(paperDetail.endTime)
    const diff = endTime.diff(now, 'second')

    if (diff <= 0) {
      clearInterval(timer)
      examFinished.value = true
      Object.assign(remainingTime, { hours: 0, minutes: 0, seconds: 0 })
      handleAutoSubmit()
      return
    }

    Object.assign(remainingTime, {
      hours: Math.floor(diff / 3600),
      minutes: Math.floor((diff % 3600) / 60),
      seconds: diff % 60
    })

    if (diff <= 300 && diff > 0 && diff % 60 === 0) {
      ElMessage.warning(`考试剩余${Math.ceil(diff / 60)}分钟`)
    }
  }, 1000)
}

// 自动提交处理
const handleAutoSubmit = async () => {
  autoSubmitDialogVisible.value = true
  try {
    
    await submitExam({
      attemptId: Number(route.params.id),
      answer: JSON.stringify(prepareAnswersForSubmit())
    })
    ElMessage.success('系统已自动提交')
    examFinished.value = true
    router.push(`/my-exams/result/${paperDetail.ExamId}`)
  } catch (error) {
    console.error('自动提交失败:', error)
    ElMessage.error('自动提交失败')
  }
}

// 手动提交处理
const handleConfirmSubmit = () => {
  submitDialogVisible.value = true
}

const handleSubmit = async () => {
  submitDialogVisible.value = false
  
  try {
    
    // 先提交答案
    await submitExam({
      attemptId: Number(route.params.id),
      answer: JSON.stringify(prepareAnswersForSubmit())
    })

    // 标记考试已完成（防止自动保存再次触发）
    examFinished.value = true
    
    // 退出全屏模式
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch (error) {
        console.error('退出全屏失败:', error)
      }
    }

    // 移除全屏监控事件（避免后续误判）
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    
    // 跳转结果页
    ElMessage.success('提交成功')
    router.push(`/my-exams/result/${paperDetail.ExamId}`)
    
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error(error.response?.data?.message || '提交失败')
  }
}


// 全屏控制
const handleFullscreenChange = async () => {
  isFullscreen.value = Boolean(document.fullscreenElement)
  
  // 如果用户尝试退出全屏并且考试未完成
  if (!isFullscreen.value && !examFinished.value) {
    // 先阻止退出
    try {
      await examContainer.value?.requestFullscreen?.() || 
            document.documentElement.requestFullscreen()
    } catch (error) {
      console.error('重新进入全屏失败:', error)
    }
    
    // 显示警告并强制提交
    ElMessageBox.confirm(
      '退出全屏模式将自动提交试卷，是否确定退出？',
      '警告',
      {
        confirmButtonText: '确定提交',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(async () => {
      await handleAutoSubmit()
    }).catch(() => {
      // 用户取消，保持全屏状态
      examContainer.value?.requestFullscreen?.() || 
      document.documentElement.requestFullscreen()
    })
  }
}

// 页面离开警告
const handleBeforeUnload = (e) => {
  if (!examFinished.value) {
    e.preventDefault()
    e.returnValue = '考试尚未提交，确定离开吗？'
    return e.returnValue
  }
}

// 生命周期
onMounted(async () => {
  await fetchExamData()
  
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  if (document.fullscreenEnabled) {
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    try {
      await (examContainer.value?.requestFullscreen?.() || document.documentElement.requestFullscreen())
      isFullscreen.value = true
    } catch (error) {
      console.error('初始化全屏失败:', error)
    }
  }
})

onBeforeUnmount(() => {
  clearInterval(timer)
  clearTimeout(saveDebounceTimer)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
})
</script>



<style scoped>
/* 基础布局  */
.exam-container {
  position: relative;
  height: 100vh;        /* 固定视口高度 */
  overflow: hidden;     /* 禁止外层滚动 */
}
.exam-page {
  padding: 20px;
  background-color: #f5f5f5;
  height: calc(100vh - 40px);  /* 动态高度 */
  display: flex;
  flex-direction: column;
}
/* 头部卡片样式 */
.header-card {
  margin-bottom: 20px;
  background-color: var(--el-color-primary);
  color: white;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  border-radius: 8px;
  padding: 15px;
}

/* 题目列表区域 */
.question-list {
  flex: 2;
}
/*  内容区域 */
.content-container {
  display: flex;
  gap: 20px;
  flex: 1;              /* 占满剩余空间 */
  overflow: hidden;     /* 禁止中间层滚动 */
}
/* 题目列表（仅此处允许滚动） */
.question-list {
  flex: 2;
  height: 100%;         /* 继承父级高度 */
  overflow-y: auto;     /* 核心修复：允许滚动 */
  padding-right: 8px;   /* 防滚动条遮挡 */
}

/*全屏模式特殊处理  */
:fullscreen .exam-page {
  height: 100vh;        /* 全屏时高度重置 */
}
:fullscreen .content-container {
  min-height: 0;       
}



.question-type-header {
  font-size: 18px;
  margin-bottom: 16px;
  color: #333;
}
.question-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.question-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.question-header {
  display: flex;
  align-items: baseline;
  margin-bottom: 15px;
}

.question-number {
  font-weight: bold;
  margin-right: 6px;
  min-width: 24px;
}

.question-content {
  flex: 1;
}

.question-score {
  color: var(--el-color-danger);
  margin-left: 8px;
  font-weight: bold;
}

.question-body {
  padding-left: 30px;
}

/* 选项样式 */
.option-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(45%, 1fr));
  gap: 10px 20px;
}

.option-item {
  margin: 4px 0;
}

/* 答题卡区域 */
.answer-card {
  flex: 0 0 280px;
  height: 100%;               /* 改为固定高度 */
  overflow-y: auto;           /* 确保启用滚动 */
  position: sticky;           /* 保持粘性定位 */
  top: 20px;
  max-height: calc(100vh - 60px); /* 限制最大高度（视口-顶部间距） */
}
@media (max-width: 1200px) {
  .answer-card {
    height: auto;             /* 移动端恢复自动高度 */
    max-height: none;
    position: static;
  }

}

/* 考试信息卡样式 */
/* 考试信息卡 */
.exam-info-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 40px rgba(0, 0, 0, 0.08);
  border: none;

}

/* 信息容器 */
.exam-info-container {
  display: flex;
  flex-direction: column;
  gap:20px;
}

/* 信息行 */
.info-row {
  display: flex;
  justify-content: space-between;
  gap: 40px;
}

/* 信息项通用样式 */
.info-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  flex: 1;
  min-width: 0;
  
  .icon {
    font-size: 20px;
    margin-right: 10px;
    flex-shrink: 0;
    color: var(--el-color-primary);
  }
  
  .label {
    font-size: 12px;
    color: #8898aa;
    display: block;
    margin-bottom: 2px;
  }
  
  .value {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* 计时器特殊样式 */
.timer-box {
  display: flex;
  align-items: center;
  padding: 10px 12px 10px 0 !important; /* 减少左侧padding */
  border-left: 3px solid var(--el-color-primary);
  flex: 1;
  min-width: 0;
  
  .value-container {
    display: flex;
    flex-direction: column;
    min-width: 0;
    width: 100%;
  }
  
  .time-text {
    font-family: 'Roboto Mono', monospace;
    text-align: left;
    margin-left: -2px; /* 微调数字间距 */
    letter-spacing: -0.3px;
  }
  
  &.time-danger {
    .icon, .time-text {
      color: var(--el-color-danger);
    }
    animation: pulse 1.5s infinite;
  }
}

/* 总分样式 */
.score-box {
  border-left: 3px solid var(--el-color-success);
  flex-shrink: 0; /* 防止被挤压 */
}

/* 状态行 */
.status-row {
  display: flex;
  justify-content: flex-end;
}

.status-item {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 16px;
  font-size: 12px;
  
  .status-icon {
    margin-right: 6px;
    font-size: 14px;
  }
  
  &.status-success {
    color: var(--el-color-success);
    background-color: rgba(var(--el-color-success-rgb), 0.1);
  }
  
  &.status-error {
    color: var(--el-color-danger);
    background-color: rgba(var(--el-color-danger-rgb), 0.1);
  }
  
  &.status-pending {
    color: var(--el-color-warning);
    background-color: rgba(var(--el-color-warning-rgb), 0.1);
  }
}

/* 呼吸动画 */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}


/* 答题卡内容 */
.answer-sheet-card {
  padding: 15px;
}

.card-header {
  margin-bottom: 15px;
}

.stats-container {
  display: flex;
  justify-content: space-around;
  margin-bottom: 15px;
}

.stat-item {
  text-align: center;
}

.question-index-panel {
  padding: 10px;
}

.question-type-section {
  margin-bottom: 20px;
}

.question-type-section h4 {
  margin-bottom: 10px;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.question-index-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.index-button {
  margin: 0 !important;
  min-width: 32px;
  height: 32px;
}

.card-actions {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

/* 对话框样式 */
.unanswered-count {
  color: var(--el-color-danger);
  font-weight: bold;
}

/* 特殊处理 */
:deep(.el-tabs__content) {
  padding: 12px;
}




</style>