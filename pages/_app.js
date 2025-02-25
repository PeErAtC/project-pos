// pages/_app.js
import './styles.css';  // ใช้ path ที่ถูกต้องตามที่ไฟล์ styles.css อยู่

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
