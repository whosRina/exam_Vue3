// src/i18n.js
import { createI18n } from 'vue-i18n';
import zhCn from 'element-plus/es/locale/lang/zh-cn'; // 引入Element Plus中文语言包

// 创建i18n实例
const i18n = createI18n({
  locale: 'zh-cn', // 默认语言
  messages: {
    'zh-cn': {
      ...zhCn, // 合并Element Plus中文语言包
    },
  },
});

export default i18n;
