import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [username, setUsername] = useState(''); // สำหรับเก็บชื่อผู้ใช้ที่ล็อกอิน

  useEffect(() => {
    const loggedInUsername = localStorage.getItem('username'); // ดึงชื่อผู้ใช้จาก localStorage
    if (loggedInUsername) {
      setUsername(loggedInUsername); // ตั้งค่าชื่อผู้ใช้ที่ล็อกอิน
    } else {
      // ถ้าไม่มีข้อมูลผู้ใช้ใน localStorage ให้ส่งกลับไปหน้า login
      router.push('/login');
    }
  }, [router]);

  // Function to play the click sound
  const playClickSound = () => {
    const audio = new Audio('/sounds/click-151673.mp3');
    audio.play();
  };

  const handleIconClick = (page) => {
    playClickSound(); // เล่นเสียงเมื่อคลิก
    router.push(page); // เปลี่ยนเส้นทางไปยังหน้าที่กำหนด
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.welcomeMessage}>ยินดีต้อนรับ, {username}</h2> {/* แสดงชื่อผู้ใช้ */}
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
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#e0f7f9',
  },
  welcomeMessage: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
  },
  iconContainer: {
    display: 'flex',
    gap: '30px',
    marginBottom: '20px',
    padding: '100px',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.15)',
  },
  iconBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#499cae',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
    width: '220px',
    cursor: 'pointer',
    transition: 'transform 0.1s ease-in-out',
  },
  icon: {
    marginBottom: '10px',
  },
  text: {
    fontSize: '18px',
    color: 'white',
    fontWeight: 'bold',
  },
  selected: {
    transform: 'scale(0.95)',
  },
};
