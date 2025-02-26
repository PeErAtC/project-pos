// api.js
import axios from 'axios';
import config from '../lib/config';  // ใช้ config ในไฟล์ที่ต้องการ


const API_HEADERS = {
  'Accept': 'application/json',
  'Authorization': 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
};

export const fetchCategories = async () => {
  const response = await axios.get('https://easyapp.clinic/pos-api/api/category', { headers: API_HEADERS });
  return response.data;
};

export const fetchProducts = async () => {
  const response = await axios.get('https://easyapp.clinic/pos-api/api/products', { headers: API_HEADERS });
  return response.data;
};
