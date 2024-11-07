// pages/login.js
import { useState } from 'react';
import { useRouter } from 'next/router'; // นำเข้า useRouter
import { FaEye, FaEyeSlash, FaUser, FaLock, FaUtensils } from 'react-icons/fa';

export default function LoginPage({ onLogin }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter(); // กำหนด useRouter

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLoginClick = () => {
    // เมื่อกดเข้าสู่ระบบ ให้บันทึกสถานะล็อกอินใน Local Storage
    localStorage.setItem('isLoggedIn', 'true');
    onLogin(); // เรียก onLogin เพื่ออัปเดตสถานะการล็อกอินในแอปหลัก
    router.push('/products'); // เปลี่ยนเส้นทางไปที่หน้า /products
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          PÖSSHÖP <FaUtensils style={styles.iconShop} />
        </h1>
        <div style={styles.inputContainer}>
          <FaUser style={styles.icon} />
          <input type="text" placeholder="ชื่อผู้ใช้" style={styles.input} />
        </div>
        <div style={styles.inputContainer}>
          <FaLock style={styles.icon} />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <span onClick={togglePasswordVisibility} style={styles.eyeIcon}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <button style={styles.button} onClick={handleLoginClick}>เข้าสู่ระบบ</button>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#e0f7f9' },
  card: { width: '100%', maxWidth: '400px', padding: '40px', backgroundColor: '#ffffff', borderRadius: '15px', boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.15)', textAlign: 'center' },
  title: { fontFamily: '"Pacifico", cursive', fontSize: '36px', color: '#499cae', fontWeight: 'bold', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  iconShop: { marginLeft: '10px', color: '#499cae', fontSize: '30px' },
  icon: { position: 'absolute', left: '15px', color: '#499cae', fontSize: '20px' },
  inputContainer: { position: 'relative', marginBottom: '20px', display: 'flex', alignItems: 'center' },
  input: { width: '100%', padding: '12px 40px 12px 40px', fontSize: '16px', border: '1px solid #b2dfdb', borderRadius: '5px', outline: 'none', color: '#499cae', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' },
  eyeIcon: { position: 'absolute', right: '10px', cursor: 'pointer', color: '#499cae' },
  button: { width: '100%', padding: '12px', fontSize: '16px', color: '#ffffff', backgroundColor: '#499cae', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px', fontWeight: 'bold' },
};
