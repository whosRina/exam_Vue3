import axios from "axios";

const API_PREFIX = "http:///127.0.0.1:8889/user"; // 后端IP

export const login = (data) => {
  return axios({
    method: "post",
    url: `${API_PREFIX}/login`,
    data: JSON.stringify(data),  // 确保数据是JSON格式
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const logout = () => axios.get(`${API_PREFIX}/loginOut`); // 修正反引号
