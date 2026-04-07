import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('edu_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const authSep10 = (publicKey) => api.post('/auth/sep10', { publicKey });
export const authVerify = (signedXdr, publicKey) => api.post('/auth/verify', { signedXdr, publicKey });
export const getBalance = (wallet) => api.get(`/reward/student/${wallet}`);
export const rewardStudent = (data) => api.post('/reward', data);
export const bulkReward = (rewards) => api.post('/reward/bulk', { rewards });
export const redeem = (data) => api.post('/redeem', data);
export const treasuryFund = (data) => api.post('/treasury/fund', data);
export const treasuryApprove = (data) => api.post('/treasury/approve', data);

export default api;
