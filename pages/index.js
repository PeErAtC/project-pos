import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [clicked, setClicked] = useState(null); // เก็บสถานะการคลิกของการ์ด
  const soundRef = useRef(null); // ใช้ useRef สำหรับจัดการเสียง

  // โหลดเสียงเมื่อ Component ถูก Mount
  useEffect(() => {
    soundRef.current = new Audio('/sounds/click-151673.mp3');
  }, []);

  // ตรวจสอบสถานะการเข้าสู่ระบบ
  useEffect(() => {
    const authToken = localStorage.getItem('token');
    const loggedInUsername = localStorage.getItem('username');

    if (!authToken || !loggedInUsername) {
      Swal.fire({
        title: 'กรุณาเข้าสู่ระบบ',
        text: 'คุณยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อนใช้งาน',
        icon: 'warning',
        confirmButtonText: 'เข้าสู่ระบบ',
      }).then(() => {
        router.push('/login');
      });
      return;
    }

    // ตั้งค่าชื่อผู้ใช้
    setUsername(loggedInUsername);
  }, [router]);

  // ฟังก์ชันเล่นเสียงคลิก
  const playClickSound = () => {
    if (soundRef.current) {
      soundRef.current.play();
    }
  };

  // ฟังก์ชันจัดการการคลิกไอคอน
  const handleIconClick = (page, cardName) => {
    playClickSound();
    setClicked(cardName); // ตั้งค่าการคลิก
    setTimeout(() => {
      setClicked(null); // รีเซ็ตการคลิก
      router.push(page);
    }, 200); // ดีเลย์เล็กน้อยเพื่อให้เห็นเอฟเฟกต์
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.welcomeMessage}>ยินดีต้อนรับ: {username}</h2>
      <div style={styles.cardContainer}>
        <div
          style={{
            ...styles.card,
            ...(clicked === 'sell' ? styles.clicked : {}),
          }}
          onMouseDown={() => setClicked('sell')}
          onMouseUp={() => setClicked(null)}
          onClick={() => handleIconClick('/TablePage', 'sell')}
        >
          <div style={styles.emojiContainer}>
            <Image
              src="/images/store.png"
              alt="หน้าขาย"
              width={70}
              height={70}
            />
          </div>
          <p style={styles.cardTitle}>หน้าขาย</p>
          <p style={styles.cardSubtitle}>เริ่มต้นการขายสินค้าของคุณที่นี่</p>
        </div>
        <div
          style={{
            ...styles.card,
            ...(clicked === 'backend' ? styles.clicked : {}),
          }}
          onMouseDown={() => setClicked('backend')}
          onMouseUp={() => setClicked(null)}
          onClick={() => handleIconClick('/backendpage', 'backend')}
        >
          <div style={styles.emojiContainer}>
            <Image
              src="/images/folder.png"
              alt="หลังบ้าน"
              width={70}
              height={70}
            />
          </div>
          <p style={styles.cardTitle}>หลังบ้าน</p>
          <p style={styles.cardSubtitle}>จัดการข้อมูลและการตั้งค่าต่างๆ</p>
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
    background: 'linear-gradient(to right,rgb(196, 240, 246), #499cae)',
  },
  welcomeMessage: {
    fontFamily: '"Montserrat", sans-serif',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#000',
    marginBottom: '20px',
  },
  cardContainer: {
    display: 'flex',
    gap: '20px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '280px',
    height: '350px',
    backgroundColor: '#ffffff',
    borderRadius: '15px',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  clicked: {
    transform: 'scale(0.95)', // เอฟเฟกต์การกด ยุบลงเล็กน้อย
    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)', // เงาลดลง
  },
  emojiContainer: {
    backgroundColor: '#e0f7fa',
    borderRadius: '50%',
    width: '150px',
    height: '150px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '15px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px',
  },
  cardSubtitle: {
    fontSize: '14px',
    color: '#777',
    textAlign: 'center',
  },
};
