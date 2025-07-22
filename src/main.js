import { createApp } from "vue";
import App from "./App.vue";
import router from "./router"; // Vue Router
import { createPinia } from "pinia"; // 引入 Pinia
import i18n from './api/i18n';  // 引入 i18n 配置
import ElementPlus from "element-plus"; // 引入 Element Plus
import "element-plus/dist/index.css"; // 引入 Element Plus 样式
import zhCn from 'element-plus/es/locale/lang/zh-cn'; // 引入中文语言包

const app = createApp(App);
app.use(createPinia()); // 注册 Pinia
app.use(router); // 注册 Vue Router
// 应用 i18n 和 Element Plus
app.use(i18n);
app.use(ElementPlus, {
    locale: zhCn,  // 设置 Element Plus 为中文
  });
app.mount("#app"); // 挂载 Vue 应用
