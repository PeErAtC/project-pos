import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [clicked, setClicked] = useState(null); // เก็บสถานะการคลิกของการ์ด

  useEffect(() => {
    const loggedInUsername = localStorage.getItem('username');
    if (loggedInUsername) {
      setUsername(loggedInUsername);
    } else {
      router.push('/login');
    }
  }, [router]);

  const playClickSound = () => {
    const audio = new Audio('/sounds/click-151673.mp3');
    audio.play();
  };

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
