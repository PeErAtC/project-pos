import Cookies from 'js-cookie';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FaEye, FaEyeSlash, FaUser, FaLock, FaUtensils } from 'react-icons/fa';
import config from './config'; // ดึง config.js จาก pages
import Keyboard from './keyboard'; // นำเข้า Keyboard

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeField, setActiveField] = useState('');
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLoginClick = async (e) => {
    e.preventDefault();
    const apiUrl = `https://easyapp.clinic/pos-api/api/login`;

    if (!username || !password) {
      alert('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    if (!apiUrl || !config.slug) {
      console.error('❌ URL หรือ slug ไม่ถูกต้อง:', { apiUrl, slug: config.slug });
      alert('URL หรือ slug ไม่ถูกต้อง กรุณาตรวจสอบการตั้งค่า');
      return;
    }

    console.group('🔍 รายละเอียดคำขอ (Request)');
    console.log('📍 API URL:', apiUrl);
    console.log('📡 วิธีการส่งคำขอ (Request Method): POST');
    console.log('🛠 Headers:', { Accept: 'application/json' });
    console.groupEnd();

    setIsLoading(true);
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const responseText = await response.text();
      // console.group('🔍 รายละเอียดคำตอบ (Response)');
      // console.log('✔️ รหัสสถานะ HTTP:', response.status);
      // console.log('✔️ สถานะข้อความ HTTP:', response.statusText);
      // console.log('✔️ คำตอบดิบ (Raw Response):', responseText);
      // console.groupEnd();

      // if (!response.ok) {
      //   let errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      //   try {
      //     const errorData = JSON.parse(responseText);
      //     errorMessage = errorData.message || errorMessage;
      //   } catch {
      //     console.warn('⚠️ คำตอบไม่ใช่ JSON:', responseText);
      //   }
      //   alert(`การเข้าสู่ระบบล้มเหลว: HTTP ${response.status} - ${errorMessage}`);
      //   return;
      // }

      const result = JSON.parse(responseText);
      if (result.success == true) {
        const authToken = result.data.token.substring((result.data.token.length-40),result.data.token.length);
        localStorage.setItem("token",authToken);
        localStorage.setItem("username",result.data.username);
        localStorage.setItem("name",result.data.name);
        localStorage.setItem("email",result.data.email);
        localStorage.setItem("userId",result.data.userId);
        localStorage.setItem("slug",result.data.slug);
        localStorage.setItem("owner",result.data.owner);
        localStorage.setItem("url_api",result.data.url_api);
        localStorage.setItem("store",result.data.store);
        localStorage.setItem("package",result.data.package);
        localStorage.setItem("live_date",result.data.live_date);
        localStorage.setItem("expiry_date",result.data.expiry_date);

        alert('เข้าสู่ระบบสำเร็จ');
        // onLogin();
        router.push('/TablePage');
      } else {
        alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองอีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert('Token หมดอายุหรือไม่พบ Token กรุณาเข้าสู่ระบบอีกครั้ง');
      router.push('/login');
      return;
    }

    const headers = {
      ...options.headers,
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };

    return fetch(url, { ...options, headers });
  };

  const fetchUserData = async () => {
    try {
      const response = await fetchWithAuth(`${config.api_url}/${config.slug}/userdata`);
      if (!response.success) {
        handleApiError(response);
        return;
      }
      const data = await response.json();
      console.log('ข้อมูลผู้ใช้:', data);
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
    }
  };

  const handleApiError = (response) => {
    if (response.status === 401) {
      alert('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
      Cookies.remove('authToken');
      router.push('/login');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert('กรุณาเข้าสู่ระบบก่อนใช้งาน');
      router.push('/login');
    } else {
      fetchUserData();
    }
  }, []);

  const handleInputFocus = (field) => {
    setActiveField(field);
    setShowKeyboard(true);
  };

  const handleKeyPress = (key) => {
    if (activeField) {
      const inputElement = document.querySelector(`[name="${activeField}"]`);
      if (inputElement) {
        const { selectionStart, selectionEnd, value } = inputElement;
        if (key === 'DELETE') {
          const newValue =
            value.slice(0, selectionStart) + value.slice(selectionEnd);
          activeField === 'username' ? setUsername(newValue) : setPassword(newValue);
        } else {
          const newValue =
            value.slice(0, selectionStart) + key + value.slice(selectionEnd);
          activeField === 'username' ? setUsername(newValue) : setPassword(newValue);
        }
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          Easy POS <FaUtensils style={styles.iconShop} />
        </h1>
        {error && <p style={styles.error}>{error}</p>}
        <div style={styles.inputContainer}>
          <FaUser style={styles.icon} />
          <input
            type="text"
            name="username"
            placeholder="ชื่อผู้ใช้"
            value={username}
            onFocus={() => handleInputFocus('username')}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.inputContainer}>
          <FaLock style={styles.icon} />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="รหัสผ่าน"
            value={password}
            onFocus={() => handleInputFocus('password')}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <span onClick={togglePasswordVisibility} style={styles.eyeIcon}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <div style={styles.rememberMeContainer}>
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
          />
          <label htmlFor="rememberMe" style={styles.rememberMeLabel}>
            จำฉัน
          </label>
        </div>
        {isLoading ? (
          <div style={styles.loading}>กำลังโหลด...</div>
        ) : (
          <button style={styles.button} onClick={handleLoginClick}>
            เข้าสู่ระบบ
          </button>
        )}
      </div>
      {showKeyboard && (
        <Keyboard
          onKeyPress={handleKeyPress}
          onClose={() => setShowKeyboard(false)}
        />
      )}
    </div>
  );
}


const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(to right, #e0f7fa, #80deea)',
    animation: 'fadeIn 1s ease, pulseBackground 3s infinite',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
    textAlign: 'center',
    animation: 'fadeIn 1s ease',
  },
  title: {
    fontFamily: '"Pacifico", cursive',
    fontSize: '36px',
    color: '#00796b',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShop: {
    marginLeft: '8px',
    fontSize: '28px',
    color: '#00796b',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: '20px',
  },
  input: {
    width: '80%',
    padding: '12px 40px',
    fontSize: '16px',
    border: '1px solid #b0bec5',
    borderRadius: '5px',
    outline: 'none',
    color: '#333',
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
    margin: '0 auto',
    display: 'block',
  },
  icon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#90a4ae',
    fontSize: '18px',
  },
  eyeIcon: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    cursor: 'pointer',
    color: '#90a4ae',
    fontSize: '18px',
  },
  rememberMeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
  },
  rememberMeLabel: {
    fontSize: '14px',
    color: '#333',
  },
  button: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    color: '#ffffff',
    backgroundColor: '#00796b',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  loading: {
    color: '#00796b',
    fontSize: '16px',
  },
  error: {
    color: 'red',
    fontSize: '14px',
    marginBottom: '10px',
  },
};

// Add global CSS for animations
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes pulseBackground {
      0%, 100% {
        background: linear-gradient(to right, #e0f7fa, #d4f7fc);
      }
      50% {
        background: linear-gradient(to right, #d7faff, #d3f5f9);
      }
    }
  `;
  document.head.appendChild(styleSheet);
}
