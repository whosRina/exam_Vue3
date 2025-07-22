import { createRouter, createWebHistory } from "vue-router";
import Login from "@/pages/Login.vue";
import Index from "@/pages/Index.vue"; // 确保 Index.vue 存在
import UserManagement from "@/pages/admin/UserManagement.vue"; // 用户管理页面
import UploadXlsx from "@/pages/admin/uploadXlsx.vue";
import ClassManagement from "@/pages/teacher/class/ClassManagement.vue"; //班级管理页面
import MyClass from "@/pages/student/MyClass.vue"  ;              //我的班级页面
import QuestionBankManagement from "@/pages/teacher/question/QuestionBankManagement.vue";
import QuestionBankDetails from "@/pages/teacher/question/QuestionBankDetails.vue";
import QuestionList from "@/pages/teacher/question/QuestionList.vue";
import UploadWord from "@/pages/teacher/question/uploadWord.vue";
import NotFound from "@/pages/404.vue";
import { useAuthStore } from "@/store/auth";
import PaperManagement from "@/pages/teacher/paper/PaperManagement.vue"; // 试卷管理
import PaperRuleManagement from "@/pages/teacher/paper/PaperRuleManagement.vue"; // 规则管理
import ViewPaper from "@/pages/teacher/paper/ViewPaper.vue"; // 规则管理
import examRepulic from "@/pages/teacher/exam/examRepulic.vue"; //考试发布
import ExamManagement from "@/pages/teacher/exam/ExamManagement.vue"; //考试管理
import Detail from "@/pages/teacher/exam/ExamDetail.vue"; //考试详情
import examScores from "@/pages/teacher/exam/examScores.vue"; //成绩分析
import manualGrading from "@/pages/teacher/exam/manualGrading.vue"; //人工评分
import MyExam from "@/pages/student/MyExam.vue"; 
import ExamDetail from "@/pages/student/ExamDetail.vue"; 
import ExamPage from "@/pages/student/ExamPage.vue"; 
import ExamResult from "@/pages/student/ExamResult.vue"; 
import MyPage from "@/pages/myPage.vue"; 



const routes = [
  { path: "/login", component: Login },  // 登录页面
  {
    path: "/",
    component: Index,
    redirect:"/myPage",
    children: [
      { path: "user-management", component: UserManagement }, //用户管理页面
      {path: "class-management",component: ClassManagement}, // 班级管理页面
      {path: "my-classes",component:MyClass}, // 我的班级页面
      {path: "question-bank",component:QuestionBankManagement}, //题库管理页面
      { path: "exam-management/paper-management", component: PaperManagement }, // 试卷管理
      { path: "exam-management/paper-rule-management", component: PaperRuleManagement },
      { path: "exam-management/examRepulic", component: examRepulic },
      { path: "exam-management/ExamManagement", component: ExamManagement },
      { path: "my-exams", component: MyExam },
      { path: "uploadWord", component: UploadWord},
      { path: "uploadXlsx", component:UploadXlsx},
      { path: "myPage", component:MyPage},
      { path: "question-bank/details/:id", component: QuestionBankDetails }, // 题库详细信息页面
      { path: "question-list/:bankId/:type", component: QuestionList }, // 题目列表页面
      { path: "exam-management/ViewPaper/:paperId", name: "ViewPaper", component: ViewPaper },
      { path: "exam-management/detail/:id", component: Detail },
      { path: "exam-management/scores/:id", component: examScores },
      { path: "exam-management/grading/:id", component:  manualGrading},
      { path: "my-exams/detail/:id", component: ExamDetail },
      { path: "my-exams/onging/:id", component: ExamPage },
      { path: "my-exams/result/:id", component: ExamResult},
      { path: "my-exams/detail/:id", component: ExamDetail },
    ]
    },
   
  //{ path: "/", redirect: "/dashboard" },  // 确保首页正确跳转
  { path: "/:pathMatch(.*)*", component: NotFound }, // 404 页面处理
];

const router = createRouter({
  history:  createWebHistory(),
  routes,
});

// 使用 Pinia 安全访问
router.beforeEach((to,from, next) => {
  const authStore = useAuthStore();
  if (!authStore.token && to.path !== "/login") {
    next("/login");
  } else {
    next();
  }
});

export default router;
