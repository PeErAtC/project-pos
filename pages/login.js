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
  const [showKeyboard, setShowKeyboard] = useState(false); // จัดการแสดง Keyboard
  const [activeField, setActiveField] = useState(''); // ช่องกรอกที่กำลังใช้งาน
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLoginClick = async (e) => {
    e.preventDefault();
    const apiUrl = `${config.api_url}/${config.slug}`;

    if (!apiUrl || !config.slug) {
      alert('API URL or slug is missing. Please check your configuration.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const message = `Login failed: HTTP ${response.status} ${response.statusText}`;
        alert(message);
        setIsLoading(false);
        return;
      }

      const result = await response.json();

      if (result.success) {
        Cookies.set('token', result.data.token, { expires: 2 });
        Cookies.set('userName', result.data.name, { expires: 2 });
        Cookies.set('userId', result.data.userId, { expires: 2 });
        Cookies.set('slug', result.data.slug, { expires: 2 });

        onLogin();
        router.push('/TablePage'); // เปลี่ยนเส้นทางไปหน้า TablePage.js
      } else {
        alert(`Login failed: ${result.message}`);
      }
    } catch (error) {
      alert('An error occurred while logging in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputFocus = (field) => {
    setActiveField(field);
    setShowKeyboard(true); // แสดง Keyboard
  };

  const handleKeyPress = (key) => {
    if (activeField) {
      const inputElement = document.querySelector(`[name="${activeField}"]`);
      if (inputElement) {
        const { selectionStart, selectionEnd, value } = inputElement;
        if (key === 'DELETE') {
          if (selectionStart !== selectionEnd) {
            // ลบส่วนที่ครอบอยู่
            const newValue =
              value.slice(0, selectionStart) + value.slice(selectionEnd);
            if (activeField === 'username') {
              setUsername(newValue);
            } else if (activeField === 'password') {
              setPassword(newValue);
            }
            inputElement.setSelectionRange(selectionStart, selectionStart);
          } else {
            // ลบทีละตัวก่อนตำแหน่งเคอร์เซอร์
            const newValue =
              value.slice(0, selectionStart - 1) + value.slice(selectionEnd);
            if (activeField === 'username') {
              setUsername(newValue);
            } else if (activeField === 'password') {
              setPassword(newValue);
            }
            inputElement.setSelectionRange(selectionStart - 1, selectionStart - 1);
          }
        } else {
          if (selectionStart !== selectionEnd) {
            // แทนที่ส่วนที่ครอบอยู่ด้วยตัวอักษรที่พิมพ์
            const newValue =
              value.slice(0, selectionStart) + key + value.slice(selectionEnd);
            if (activeField === 'username') {
              setUsername(newValue);
            } else if (activeField === 'password') {
              setPassword(newValue);
            }
            inputElement.setSelectionRange(selectionStart + 1, selectionStart + 1);
          } else {
            // เพิ่มตัวอักษรหลังตำแหน่งเคอร์เซอร์
            const newValue =
              value.slice(0, selectionStart) + key + value.slice(selectionStart);
            if (activeField === 'username') {
              setUsername(newValue);
            } else if (activeField === 'password') {
              setPassword(newValue);
            }
            inputElement.setSelectionRange(selectionStart + 1, selectionStart + 1);
          }
        }
        inputElement.focus(); // Keep focus to ensure caret stays visible
      }
    }
  };

  useEffect(() => {
    const handlePhysicalKeyPress = (event) => {
      if (event.ctrlKey || event.metaKey) return; // Ignore Ctrl/Cmd key combinations

      if (activeField === 'username' || activeField === 'password') {
        const key = event.key;
        if (key === 'Backspace') {
          handleKeyPress('DELETE');
          event.preventDefault();
        } else if (key.length === 1 && !event.ctrlKey && !event.metaKey) {
          handleKeyPress(key);
          event.preventDefault();
        }
      }
    };

    const handleClickOutside = (event) => {
      const keyboardElement = document.querySelector('.keyboard-container');
      if (keyboardElement && !keyboardElement.contains(event.target)) {
        setShowKeyboard(false);
      }
    };

    window.addEventListener('keydown', handlePhysicalKeyPress);
    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handlePhysicalKeyPress);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeField]);

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
