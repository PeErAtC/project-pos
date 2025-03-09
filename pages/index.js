import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';

export default function HomePage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState(''); // เก็บชื่อร้าน
  const [owner, setOwner] = useState(null);
  const [clicked, setClicked] = useState(null);
  const soundRef = useRef(null);

  useEffect(() => {
    soundRef.current = new Audio('/sounds/click-151673.mp3');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const authToken = localStorage.getItem('token');
    const isOwner = localStorage.getItem('owner');

    // รับชื่อร้านจาก localStorage หรือค่าพื้นฐาน
    const storedStoreName = localStorage.getItem('store');
    if (storedStoreName) {
      setStoreName(storedStoreName);
    } else {
      setStoreName('ร้านเริ่มต้น'); // ค่าเริ่มต้นถ้าไม่มีใน localStorage
    }

    console.log('🔍 Token:', authToken);
    console.log('🏷 Owner:', isOwner);

    if (!authToken) {
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

    setOwner(isOwner);
  }, [router]);

  const playClickSound = () => {
    if (soundRef.current) {
      soundRef.current.currentTime = 0;
      soundRef.current
        .play()
        .catch((error) => console.error('ไม่สามารถเล่นเสียงได้:', error));
    }
  };

  const handleIconClick = (page, cardName) => {
    if (page === '/backendpage' && owner !== 'Y') {
      Swal.fire({
        title: 'สิทธิ์ไม่เพียงพอ',
        text: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
        icon: 'error',
        confirmButtonText: 'ตกลง',
      });
      return;
    }

    playClickSound();
    setClicked(cardName);

    setTimeout(() => {
      router.push(page).then(() => setClicked(null));
    }, 200);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.welcomeMessage}> {storeName}</h2> {/* แสดงชื่อร้าน */}
      <div style={styles.cardContainer}>
        <div
          style={{
            ...styles.card,
            ...(clicked === 'sell' ? styles.clicked : {}),
          }}
          onClick={() => handleIconClick('/TablePage', 'sell')}
        >
          <div style={styles.emojiContainer}>
            <Image src="/images/store.png" alt="หน้าขาย" width={70} height={70} />
          </div>
          <p style={styles.cardTitle}>หน้าขาย</p>
          <p style={styles.cardSubtitle}>เริ่มต้นการขายสินค้าของคุณที่นี่</p>
        </div>

        {owner === 'Y' && ( // แสดงปุ่ม "หลังบ้าน" เฉพาะ Owner เท่านั้น
          <div
            style={{
              ...styles.card,
              ...(clicked === 'backend' ? styles.clicked : {}),
            }}
            onClick={() => handleIconClick('/backendpage', 'backend')}
          >
            <div style={styles.emojiContainer}>
              <Image src="/images/folder.png" alt="หลังบ้าน" width={70} height={70} />
            </div>
            <p style={styles.cardTitle}>หลังบ้าน</p>
            <p style={styles.cardSubtitle}>จัดการข้อมูลและการตั้งค่าต่างๆ</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(to right, rgb(196, 240, 246), #499cae)', padding: '10px' },
  welcomeMessage: { fontFamily: '"Montserrat", sans-serif', fontSize: '30px', fontWeight: 'bold', color: '#000', marginBottom: '20px' },
  cardContainer: { display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' },
  card: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '280px', height: '350px', backgroundColor: '#ffffff', borderRadius: '15px', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
  clicked: { transform: 'scale(0.95)', boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)' },
  emojiContainer: { backgroundColor: '#e0f7fa', borderRadius: '50%', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' },
  cardTitle: { fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '5px' },
  cardSubtitle: { fontSize: '14px', color: '#777', textAlign: 'center' },
  '@media (max-width: 768px)': {
    welcomeMessage: { fontSize: '6vw' },
    card: { width: '100%', height: '300px' }
  },
  '@media (max-width: 480px)': {
    card: { width: '90%', height: '250px' }
  }
};
