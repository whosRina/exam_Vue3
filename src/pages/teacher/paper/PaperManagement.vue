<template>
    <div class="add-paper">
    <el-card class="header-card">
      <h2>试卷管理</h2>
    </el-card>

    <el-card class="content-card">
      <div class="toolbar">
        <el-button type="primary" @click="openAddPaperDialog">添加试卷</el-button>
        <el-input v-model="searchQuery" placeholder="搜索规则..." clearable style="width: 200px;" />
      </div>

    <!-- 试卷列表 -->
    <el-table :data="papers" stripe style="width: 100%; margin-top: 20px;">
      <el-table-column prop="name" label="试卷名称" />
      <el-table-column prop="totalScore" label="总分" width="100" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <!-- 编辑按钮可跳转到查看/编辑页面 -->
          <el-button type="primary" size="small" @click="goToViewPaper(row)">编辑</el-button>
          <el-button type="danger" size="small" @click="deletePaperHandle(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
    <!-- 添加试卷对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="80%">
      <el-form label-width="100px">
        <!-- 试卷名称 -->
        <el-form-item label="试卷名称">
          <el-input v-model="currentPaper.name" placeholder="请输入试卷名称" />
        </el-form-item>

        <!-- 总分 -->
        <el-form-item label="总分">
          <el-input v-model.number="currentPaper.totalScore" placeholder="请输入总分" type="number" />
        </el-form-item>

        <!-- 选择题库 -->
        <el-form-item label="选择题库">
          <el-select v-model="selectedBankId" placeholder="请选择题库" @change="resetQuestionData">
            <el-option
              v-for="bank in banks"
              :key="bank.id"
              :label="bank.name"
              :value="bank.id"
            />
          </el-select>
        </el-form-item>

        <!-- 使用折叠面板分别加载各类型题目 -->
        <el-collapse v-model="activePanels" @change="handleCollapseChange">
          <!-- 单选题 -->
          <el-collapse-item title="单选题" name="1">
            <el-table
              :data="questionsByType[1].data"
              stripe
              style="width: 100%"
              @selection-change="handleSelectionChange(1, $event)"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="content" label="题目" />
              <el-table-column prop="type" label="类型" :formatter="formatType" />
              <el-table-column label="分值">
                <template #default="{ row }">
                  <el-input
                    v-model.number="row.score"
                    placeholder="分值"
                    type="number"
                    style="width: 80px;"
                  />
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              v-model:current-page="questionsByType[1].currentPage"
              :page-size="pageSize"
              :total="questionsByType[1].totalCount"
              layout="prev, pager, next"
              @current-change="fetchQuestionsByType(1)"
            />
          </el-collapse-item>

          <!-- 多选题 -->
          <el-collapse-item title="多选题" name="2">
            <el-table
              :data="questionsByType[2].data"
              stripe
              style="width: 100%"
              @selection-change="handleSelectionChange(2, $event)"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="content" label="题目" />
              <el-table-column prop="type" label="类型" :formatter="formatType" />
              <el-table-column label="分值">
                <template #default="{ row }">
                  <el-input
                    v-model.number="row.score"
                    placeholder="分值"
                    type="number"
                    style="width: 80px;"
                  />
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              v-model:current-page="questionsByType[2].currentPage"
              :page-size="pageSize"
              :total="questionsByType[2].totalCount"
              layout="prev, pager, next"
              @current-change="fetchQuestionsByType(2)"
            />
          </el-collapse-item>

          <!-- 判断题 -->
          <el-collapse-item title="判断题" name="3">
            <el-table
              :data="questionsByType[3].data"
              stripe
              style="width: 100%"
              @selection-change="handleSelectionChange(3, $event)"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="content" label="题目" />
              <el-table-column prop="type" label="类型" :formatter="formatType" />
              <el-table-column label="分值">
                <template #default="{ row }">
                  <el-input
                    v-model.number="row.score"
                    placeholder="分值"
                    type="number"
                    style="width: 80px;"
                  />
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              v-model:current-page="questionsByType[3].currentPage"
              :page-size="pageSize"
              :total="questionsByType[3].totalCount"
              layout="prev, pager, next"
              @current-change="fetchQuestionsByType(3)"
            />
          </el-collapse-item>

          <!-- 简答题 -->
          <el-collapse-item title="简答题" name="4">
            <el-table
              :data="questionsByType[4].data"
              stripe
              style="width: 100%"
              @selection-change="handleSelectionChange(4, $event)"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="content" label="题目" />
              <el-table-column prop="type" label="类型" :formatter="formatType" />
              <el-table-column label="分值">
                <template #default="{ row }">
                  <el-input
                    v-model.number="row.score"
                    placeholder="分值"
                    type="number"
                    style="width: 80px;"
                  />
                </template>
              </el-table-column>
            </el-table>
            <el-pagination
              v-model:current-page="questionsByType[4].currentPage"
              :page-size="pageSize"
              :total="questionsByType[4].totalCount"
              layout="prev, pager, next"
              @current-change="fetchQuestionsByType(4)"
            />
          </el-collapse-item>
        </el-collapse>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePaper">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage,ElMessageBox } from 'element-plus'
import { getPaperList, createPaper, deletePaper } from '@/api/paper'
import { getBankList, getQuestionList } from '@/api/questionBank'
import { useRouter } from 'vue-router'

const router = useRouter()

// 试卷列表及题库数据
const papers = ref([])
const banks = ref([])

// 选中的题库ID
const selectedBankId = ref(null)

// 分页设置
const pageSize = ref(10)

// 各题型题目数据存储（接口只支持单一类型查询）
const questionsByType = reactive({
  1: { data: [], currentPage: 1, totalCount: 0 },
  2: { data: [], currentPage: 1, totalCount: 0 },
  3: { data: [], currentPage: 1, totalCount: 0 },
  4: { data: [], currentPage: 1, totalCount: 0 }
})

// 保存各题型选中的题目（保存表格中选中行引用）
const selectedQuestionsByType = reactive({
  1: [],
  2: [],
  3: [],
  4: []
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const currentPaper = reactive({ name: '', totalScore: 100, questions: [] })

// 折叠面板激活项（存储题型字符串值，如 ["1","3"]）
const activePanels = ref([])

const fetchPapers = async () => {
  try {
    const response = await getPaperList()
    papers.value = response.data?.paperList || []
  } catch (error) {
    ElMessage.error('获取试卷列表失败')
  }
}

const fetchBanks = async () => {
  try {
    const response = await getBankList()
    banks.value = response.data?.bankList || []
  } catch (error) {
    ElMessage.error('获取题库列表失败')
  }
}

/** 根据题型加载题目 */
const fetchQuestionsByType = async (type) => {
  if (!selectedBankId.value) return
  const currentPage = questionsByType[type].currentPage
  try {
    const response = await getQuestionList({
      bankId: parseInt(selectedBankId.value),
      type: Number(type),
      page: currentPage,
      size: pageSize.value
    })
    questionsByType[type].data = response.data?.questions || []
    questionsByType[type].totalCount = response.data?.total || 0
  } catch (error) {
    ElMessage.error('获取题目列表失败')
    console.error('Error fetching questions for type', type, error)
  }
}

/** 当题库改变时，重置所有题型数据 */
const resetQuestionData = () => {
  for (let type in questionsByType) {
    questionsByType[type].data = []
    questionsByType[type].currentPage = 1
    questionsByType[type].totalCount = 0
    selectedQuestionsByType[type] = []
  }
  activePanels.value = []
}

/** 打开添加试卷对话框 */
const openAddPaperDialog = () => {
  Object.assign(currentPaper, { name: '', totalScore: 100, questions: [] })
  selectedBankId.value = null
  resetQuestionData()
  dialogTitle.value = '添加试卷'
  dialogVisible.value = true
}

/** 当折叠面板变化时，自动加载新展开的题型 */
const handleCollapseChange = (activeNames) => {
  activeNames.forEach(name => {
    const type = Number(name)
    if (selectedBankId.value && questionsByType[type].data.length === 0) {
      fetchQuestionsByType(type)
    }
  })
}

/** 各题型选中题目变化时更新 */
const handleSelectionChange = (type, selectedRows) => {
  selectedQuestionsByType[type] = selectedRows
}

/** 保存试卷时合并各题型选中题目并校验分值 */
const handleSavePaper = async () => {
  currentPaper.questions = []
  for (let type in selectedQuestionsByType) {
    currentPaper.questions = currentPaper.questions.concat(
      selectedQuestionsByType[type].map(q => ({ id: q.id, score: q.score }))
    )
  }
  if (!currentPaper.name) {
    return ElMessage.error('请输入试卷名称')
  }
  if (currentPaper.questions.length === 0) {
    return ElMessage.error('请至少选择一道题目')
  }
  for (const q of currentPaper.questions) {
    if (!q.score || q.score <= 0) {
      return ElMessage.error('所有题目的分值必须大于 0')
    }
  }
  const sum = currentPaper.questions.reduce((acc, cur) => acc + cur.score, 0)
  if (sum !== currentPaper.totalScore) {
    return ElMessage.error('题目分值总和必须等于试卷总分')
  }
  const payload = {
    name: currentPaper.name,
    totalScore: currentPaper.totalScore,
    questions: JSON.stringify(currentPaper.questions)
  }
  try {
    await createPaper(payload)
    ElMessage.success('试卷创建成功')
    dialogVisible.value = false
    fetchPapers()
  } catch (error) {
    ElMessage.error('试卷创建失败')
  }
}
const goToViewPaper = (row) => {
  router.push({ name: 'ViewPaper', params: { paperId: row.id } })
}

const deletePaperHandle = async(row) => {
    try {
      await ElMessageBox.confirm("确定要删除该试卷吗？", "警告", { type: "warning" });
      await deletePaper({paperId:row.id});
      ElMessage.success("试卷删除成功");
      fetchPapers();
    } catch (error) {
      ElMessage.error("删除失败");
    }
};

onMounted(() => {
  fetchPapers()
  fetchBanks()
})
</script>

<style scoped>
.add-paper {
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
