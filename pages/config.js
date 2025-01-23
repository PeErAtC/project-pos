const config = {
    api_url: "https://easyapp.clinic/pos-api/api",
    get slug() {
      return localStorage.getItem('slug') || ''; // ดึง slug จาก localStorage
    },
  };
  
  export default config;
  
