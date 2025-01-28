import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [username, setUsername] = useState(''); // State to store the username
  const router = useRouter();

  useEffect(() => {
    const loggedInUsername = localStorage.getItem('username');
    if (loggedInUsername) {
      setUsername(loggedInUsername);
    }
  }, []);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    router.push(menu);
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

  return (
    <div style={{ ...styles.sidebar, width: isExpanded ? '200px' : '90px' }}>
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

      <div style={styles.iconContainer(isExpanded)}>
        <div
          style={{
            ...styles.iconWrapper,
            width: isExpanded ? '160px' : '40px',
          }}
        >
          <div style={styles.storeInfo}>
            <Image src="/images/store.png" alt="Store" width={40} height={40} />
            {isExpanded && (
              <span style={styles.storeName}>
                Easy POS
                {username && <span style={styles.userName}>ผู้ใช้: {username}</span>}
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            ...styles.icon,
            ...(activeMenu === '/' ? styles.activeIcon : {}),
          }}
        >
          <Image src="/images/menu.png" alt="Homepage" width={35} height={35} />
          {isExpanded && <span style={styles.iconLabel}>หน้าหลัก</span>}
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
            ...(activeMenu === 'logout' ? styles.activeIcon : {}),
          }}
          onClick={() => {
            setActiveMenu('logout');
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
  sidebar: {
    height: '87vh',
    backgroundColor: '#499cae',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 0',
    borderRadius: '20px',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
    transition: 'width 0.3s ease',
    position: 'fixed',
    top: '20px',
    left: '20px',
    zIndex: 1000,
  },
  toggleButton: {
    cursor: 'pointer',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    backgroundColor: '#494cba',
    color: '#499cae',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    position: 'absolute',
    top: '20px',
    right: '-15px',
    zIndex: 1100,
  },
  arrow: {
    fontSize: '20px',
    color: '#fff',
  },
  iconContainer: (isExpanded) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: isExpanded ? 'flex-start' : 'center',
    gap: '20px',
    width: '100%',
    paddingLeft: isExpanded ? '20px' : '0',
  }),
  iconWrapper: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    marginTop: '30px',
  },
  storeInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  storeName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#499cae',
    padding:'5px',
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '14px',
    fontWeight: 'normal',
    color: '#777',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '13px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'normal',
  },
  activeIcon: {
    backgroundColor: 'rgb(12, 62, 95)',
    color: '#ffffff',
    borderRadius: '10px',
    padding: '15px',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
  },
  iconLabel: {
    fontSize: '16px',
    fontWeight: 'normal',
    color: '#ffffff',
  },
};
