import Cookies from 'js-cookie';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FaEye, FaEyeSlash, FaUser, FaLock, FaUtensils } from 'react-icons/fa';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // ดึงข้อมูลการตั้งค่าจาก API
    const fetchConfig = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/abc/cfg_data');
        console.log('Response status:', response.status); // แสดงสถานะการตอบกลับ
        if (!response.ok) {
          throw new Error(`Failed to fetch config: ${response.status}`);
        }
        const configData = await response.json();
        console.log('Config data:', configData); // แสดงข้อมูลที่ดึงมา
        if (configData.length > 0) {
          setApiUrl(configData[0].api_url); // ตั้งค่า api_url จากข้อมูลการตั้งค่า
        }
      } catch (error) {
        console.error('Error fetching configuration:', error);
        alert(`Error fetching configuration: ${error.message}`);
      }
    };

    if (!apiUrl) {
      fetchConfig();
    }
  }, [apiUrl]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLoginClick = async (e) => {
    e.preventDefault();

    if (!apiUrl) {
      alert('API URL not configured');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (result.success) {
        // เก็บ token และข้อมูลผู้ใช้ลงใน Cookies พร้อมตั้งค่าอายุ
        Cookies.set('token', result.data.token, { expires: 2, secure: true, sameSite: 'Strict' }); // หมดอายุใน 2 วัน
        Cookies.set('userName', result.data.name, { expires: 2, secure: true, sameSite: 'Strict' });
        Cookies.set('userId', result.data.userId, { expires: 2, secure: true, sameSite: 'Strict' });

        onLogin(); // อัปเดตสถานะการล็อกอินในแอปหลัก
        router.push('/products'); // เปลี่ยนเส้นทางไปที่หน้า /products
      } else {
        alert('Login failed: ' + result.message);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert('An error occurred while logging in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Easy POS <FaUtensils style={styles.iconShop} /></h1>
        <div style={styles.inputContainer}>
          <FaUser style={styles.icon} />
          <input
            type="text"
            placeholder="ชื่อผู้ใช้"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
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
        {isLoading ? <div>Loading...</div> : (
          <button style={styles.button} onClick={handleLoginClick}>เข้าสู่ระบบ</button>
        )}
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
