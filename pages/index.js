import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
  }, []);

  const handleIconClick = (page) => {
    if (!isLoggedIn) {
      alert("กรุณาเข้าสู่ระบบก่อนเข้าถึงหน้านี้");
      router.push('/login');
    } else {
      router.push(page);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.iconContainer}>
        <div
          style={{
            ...styles.iconBox,
            ...(selected === 'sell' ? styles.selected : {}),
          }}
          onMouseDown={() => setSelected('sell')}
          onMouseUp={() => setSelected(null)}
          onClick={() => handleIconClick('/TablePage')} // เปลี่ยนเส้นทางไปที่ TablePage แทน
        >
          <Image src="/images/store.png" alt="หน้าขาย" width={80} height={80} style={styles.icon} />
          <p style={styles.text}>หน้าขาย</p>
        </div>
        <div
          style={{
            ...styles.iconBox,
            ...(selected === 'backend' ? styles.selected : {}),
          }}
          onMouseDown={() => setSelected('backend')}
          onMouseUp={() => setSelected(null)}
          onClick={() => handleIconClick('/backendpage')}
        >
          <Image src="/images/folder.png" alt="หลังบ้าน" width={80} height={80} style={styles.icon} />
          <p style={styles.text}>หลังบ้าน</p>
        </div>
      </div>
      {!isLoggedIn && (
        <div style={styles.loginButtonContainer}>
          <button style={styles.loginButton} onClick={() => router.push('/login')}>
            ล็อกอิน
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#e0f7f9' },
  iconContainer: { display: 'flex', gap: '30px', marginBottom: '20px', padding: '100px', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.15)' },
  iconBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#499cae', padding: '20px', borderRadius: '10px', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)', width: '220px', cursor: 'pointer', transition: 'transform 0.1s ease-in-out' },
  icon: { marginBottom: '10px' },
  text: { fontSize: '18px', color: 'white', fontWeight: 'bold' },
  selected: { transform: 'scale(0.95)' },
  loginButtonContainer: { marginTop: '20px' },
  loginButton: { padding: '10px 20px', fontSize: '16px', color: '#fff', backgroundColor: '#499cae', border: 'none', borderRadius: '5px', cursor: 'pointer' },
};
