import Cookies from 'js-cookie';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { FaEye, FaEyeSlash, FaUser, FaLock, FaUtensils } from 'react-icons/fa';
import config from './config'; // ดึง config.js จาก pages

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
        router.push('/products');
      } else {
        alert(`Login failed: ${result.message}`);
      }
    } catch (error) {
      alert('An error occurred while logging in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          Easy POS <FaUtensils style={styles.iconShop} />
        </h1>
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
        {isLoading ? (
          <div style={styles.loading}>กำลังโหลด...</div>
        ) : (
          <button style={styles.button} onClick={handleLoginClick}>
            เข้าสู่ระบบ
          </button>
        )}
      </div>
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
    margin: '0 auto', // จัดให้อยู่ตรงกลาง
    display: 'block', // เพื่อให้การจัดวางเป็น Block
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
