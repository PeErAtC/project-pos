  import Image from 'next/image';
  import { useState, useEffect, useMemo } from 'react';
  import { useRouter } from 'next/router';
  import Swal from 'sweetalert2';
  import axios from 'axios';

  export default function Sidebar() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const [username, setUsername] = useState('');
    const [storeName, setStoreName] = useState('Easy POS'); // ค่าเริ่มต้น
    const router = useRouter();

    useEffect(() => {
      const loggedInUsername = localStorage.getItem('username');
      if (loggedInUsername) {
        setUsername(loggedInUsername);
      }

      const storedStoreName = localStorage.getItem('store');
      if (storedStoreName) {
        setStoreName(storedStoreName);
      } else {
        fetchStore(); // ถ้าไม่มีใน localStorage ให้ดึงจาก API
      }
    }, []);

    useEffect(() => {
      if (router.pathname.startsWith('/products')) {
        setActiveMenu('/products');
      } else {
        setActiveMenu(router.pathname);
      }
    }, [router.pathname]);

    const fetchStore = async () => {
      try {
        let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
        const slug = localStorage.getItem('slug') || 'default_slug';
        const authToken = localStorage.getItem('token') || 'default_token';

        if (!api_url.endsWith('/api')) api_url += '/api';

        const response = await axios.get(`${api_url}/${slug}/store`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
        });

        if (response.data.store) {
          setStoreName(response.data.store); // อัปเดตชื่อร้าน
          localStorage.setItem('store', response.data.store); // บันทึกลง localStorage
        }
      } catch (error) {
        console.error('Error fetching store:', error);
      }
    };

    const toggleSidebar = () => {
      setIsExpanded(!isExpanded);
    };

    const handleBack = () => {
      if (router.asPath.includes('/products')) {
        router.push('/TablePage');
      } else if (router.pathname === '/TablePage') {
        router.push('/');
      }
    };

    const handleLogout = () => {
      Swal.fire({
        title: 'ยืนยันการออกจากระบบ',
        text: 'คุณต้องการออกจากระบบใช่หรือไม่?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ใช่, ออกจากระบบ',
        cancelButtonText: 'ยกเลิก',
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          localStorage.removeItem('store');

          Swal.fire({
            title: 'ออกจากระบบสำเร็จ',
            text: 'คุณได้ออกจากระบบเรียบร้อยแล้ว',
            icon: 'success',
            confirmButtonText: 'ตกลง',
            confirmButtonColor: '#3085d6',
          }).then(() => {
            router.push('/login');
          });
        }
      });
    };

    const iconContainerStyle = useMemo(() => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: isExpanded ? 'flex-start' : 'center',
      gap: '20px',
      width: '100%',
      paddingLeft: isExpanded ? '20px' : '0',
    }), [isExpanded]);

    return (
      <div style={{ ...styles.sidebar, width: isExpanded ? '215px' : '90px' }}>
        <div style={styles.toggleButton} onClick={toggleSidebar}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
            style={{ ...styles.arrow, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>


        <div style={iconContainerStyle}>
        <div style={styles.iconWrapper}>
    <div style={styles.storeInfo}>
      <Image src="/images/store.png" alt="Store" width={40} height={40} />
      {isExpanded && (
        <div style={styles.storeNameContainer}>
          <span>{storeName}&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <span style={styles.userName}>ผู้ใช้: <strong>{username}</strong></span>
        </div>
      )}
    </div>
  </div>
          <div style={{
              ...styles.icon,
              ...(activeMenu === '/products' ? styles.activeIcon : {}),
              pointerEvents: 'none',
              cursor: 'default',
            }}
          >
            <Image src="/images/menu.png" alt="Products" width={35} height={35} />
            {isExpanded && <span style={styles.iconLabel}>สินค้า</span>}
          </div>

          <div
            style={{
              ...styles.icon,
              ...(activeMenu === 'back' ? styles.activeIcon : {}),
            }}
            onClick={handleBack}
          >
            <Image src="/images/left-arrow.png" alt="Return" width={30} height={30} />
            {isExpanded && <span style={styles.iconLabel}>ย้อนกลับ</span>}
          </div>

          <div
            style={{
              ...styles.icon,
              ...(activeMenu === '/logout' ? styles.activeIcon : {}),
              animation: activeMenu === '/logout' ? 'pulsing 1s infinite' : 'none',
            }}
            onClick={() => {
              setActiveMenu('/logout');
              handleLogout();
            }}
          >
            <Image src="/images/logout.png" alt="Logout" width={30} height={30} />
            {isExpanded && <span style={styles.iconLabel}>ออกจากระบบ</span>}
          </div>
        </div>
      </div>
    );
  }
  const styles = {
    sidebar: { height: '87vh', background: 'linear-gradient(to bottom, #499cae,rgb(13, 135, 175))', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', borderRadius: '20px', boxShadow: '0px 4px 12px rgba(0, 1, 1, 0.3)', transition: 'width 0.3s ease', position: 'fixed', top: '20px', left: '20px', zIndex: 1000 },
    toggleButton: { cursor: 'pointer', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', backgroundColor: '#494cba', color: '#499cae', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', position: 'absolute', top: '20px', right: '-15px', zIndex: 1100 },
    arrow: { fontSize: '20px', color: '#fff' },
    iconContainer: (isExpanded) => ({ display: 'flex', flexDirection: 'column', alignItems: isExpanded ? 'flex-start' : 'center', gap: '20px', width: '100%', paddingLeft: isExpanded ? '20px' : '0' }),
    iconWrapper: { backgroundColor: '#fff', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', marginTop: '30px' },
    storeInfo: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' },
    marqueeContainer: { display: 'flex', overflow: 'hidden', width: '120px', whiteSpace: 'nowrap', position: 'relative' },
    marqueeContent: { display: 'inline-block', whiteSpace: 'nowrap', animation: 'marquee 5s linear infinite', color: '#499cae', fontSize: '16px', fontWeight: 'bold' },
    storeNameContainer: { display: 'flex', flexDirection: 'column', color: '#499cae', fontWeight: 'bold', fontSize: '16px' },
    storeName: { fontSize: '18px', fontWeight: 'bold', color: '#499cae', padding: '5px' },
    userContainer: { textAlign: 'center', marginLeft: '20px' },
    userName: { fontSize: '14px', fontWeight: 'normal', color: '#444' },
    icon: { display: 'flex', alignItems: 'center', gap: '10px', padding: '13px', cursor: 'pointer', transition: 'all 0.3s ease', color: '#fff', fontSize: '16px', fontWeight: 'normal', borderRadius: '10px' },
    activeIcon: { backgroundColor: 'rgb(12, 62, 95)', color: '#ffffff', borderRadius: '10px', padding: '15px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)' },
    focusedIcon: { animation: 'pulsing 1s infinite', boxShadow: '0px 0px 18px 5px rgba(0, 123, 255, 0.8)', transform: 'scale(1.1)' },
    iconLabel: { fontSize: '16px', fontWeight: 'normal', color: '#ffffff' }
  };
