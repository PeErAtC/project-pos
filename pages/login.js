import Swal from 'sweetalert2';
import Cookies from 'js-cookie';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FaEye, FaEyeSlash, FaUser, FaLock, FaUtensils } from 'react-icons/fa';
import config from './config';
import Keyboard from './keyboard';

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
      Swal.fire({
        icon: 'error',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน',
      });
      return;
    }

    if (!apiUrl || !config.slug) {
      console.error('❌ URL หรือ slug ไม่ถูกต้อง:', { apiUrl, slug: config.slug });
      Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาด',
        text: 'URL หรือ slug ไม่ถูกต้อง กรุณาตรวจสอบการตั้งค่า',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ',
          text: 'กำลังเปลี่ยนเส้นทาง...',
          timer: 2000,
          showConfirmButton: false,
        });

        localStorage.setItem('token', result.data.token);
        localStorage.setItem('username', result.data.username);
        localStorage.setItem('name', result.data.name);
        localStorage.setItem('email', result.data.email);
        localStorage.setItem('userId', result.data.userId);
        localStorage.setItem('slug', result.data.slug);
        localStorage.setItem('owner', result.data.owner);
        localStorage.setItem('url_api', result.data.url_api);
        localStorage.setItem('store', result.data.store);
        localStorage.setItem('package', result.data.package);
        localStorage.setItem('live_date', result.data.live_date);
        localStorage.setItem('expiry_date', result.data.expiry_date);

        router.push('/');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'เข้าสู่ระบบล้มเหลว',
          text: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
        });
      }
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ:', error);
      Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาด',
        text: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองอีกครั้ง',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputFocus = (field) => {
    setActiveField(field);
    setShowKeyboard(true);
  };

  const handleKeyPress = (key) => {
    if (key === 'DELETE') {
      if (activeField === 'username') {
        setUsername((prev) => prev.slice(0, -1));
      } else if (activeField === 'password') {
        setPassword((prev) => prev.slice(0, -1));
      }
    } else {
      if (activeField === 'username') {
        setUsername((prev) => prev + key);
      } else if (activeField === 'password') {
        setPassword((prev) => prev + key);
      }
    }
  };
  
  return (
    <div style={styles.container}>
      <div style={styles.card}>
      <h1 style={styles.title}>
        <span style={styles.titleEasy}>Easy</span>{' '}
        <span style={styles.titlePos}>POS</span>
      </h1>
        <p style={styles.subtitle}>จัดการธุรกิจของคุณอย่างง่ายดาย</p>
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
        <div style={styles.footer}>
          หากมีปัญหา ติดต่อเราได้ที่{' '}
          <span style={styles.contactLink}>support@example.com</span>
        </div>
      </div>
          {showKeyboard && (
      <div style={styles.keyboardContainer}>
        <Keyboard
          onKeyPress={handleKeyPress}
          onClose={() => setShowKeyboard(false)}
        />
      </div>
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
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
    textAlign: 'center',
  },
  title: {
    fontFamily: '"Montserrat", sans-serif', // ใช้ฟอนต์ Montserrat
    fontSize: '36px',
    fontWeight: '700', // เพิ่มน้ำหนักให้ตัวหนาขึ้น
    color: '#34495e', // สีเริ่มต้น
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleEasy: {
    color: '#34495e', // สีคำว่า "Easy"
  },
  titlePos: {
    color: '#499cae', // สีคำว่า "POS"
  },
  subtitle: {
    fontSize: '14px',
    color: '#7f8c8d',
    marginBottom: '20px',
  },
  iconShop: {
    marginLeft: '8px',
    fontSize: '28px',
    color: '#499cae',
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
    backgroundColor: '#499cae',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  loading: {
    color: '#499cae',
    fontSize: '16px',
  },
  error: {
    color: 'red',
    fontSize: '14px',
    marginBottom: '10px',
  },
  footer: {
    marginTop: '20px', // เพิ่มระยะห่างด้านบน
    fontSize: '12px',
    color: '#7f8c8d',
    textAlign: 'center', // จัดข้อความให้อยู่กลาง
  },
  contactLink: {
    color: '#3498db',
    padding:'5px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  keyboardContainer: {
    position: 'absolute',
    top:'380px'
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
