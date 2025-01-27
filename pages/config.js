const config = {
  api_url: "https://easyapp.clinic/pos-api/api",
  get slug() {
    return localStorage.getItem('slug') || 'default-slug'; // ตั้งค่า slug เริ่มต้น
  },
};
export default config;
  
