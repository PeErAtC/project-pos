import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false); // สถานะสำหรับพับ/กาง Sidebar
  const [activeMenu, setActiveMenu] = useState(null); // ติดตามเมนูที่เลือก
  const router = useRouter();

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded); // เปลี่ยนสถานะพับ/กาง
  };

  const handleMenuClick = (menu) => {
    if (menu === '/TablePage') {
      // ใช้ SweetAlert2 สำหรับการยืนยันก่อนย้อนกลับ
      Swal.fire({
        title: 'ยืนยันการย้อนกลับ',
        text: 'คุณต้องการย้อนกลับใช่หรือไม่?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ใช่, ย้อนกลับ',
        cancelButtonText: 'ยกเลิก',
      }).then((result) => {
        if (result.isConfirmed) {
          setActiveMenu(menu);
          router.push(menu);
        }
      });
      return; // หยุดการทำงานต่อไป
    }

    setActiveMenu(menu); // ตั้งเมนูที่เลือกเป็น active
    router.push(menu); // เปลี่ยนหน้า
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
        router.push('/login');
      }
    });
  };

  return (
    <div style={{ ...styles.sidebar, width: isExpanded ? '200px' : '90px' }}>
      {/* Toggle Button */}
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

      {/* Sidebar Items */}
      <div style={styles.iconContainer(isExpanded)}>
        {/* Store Icon */}
        <div style={styles.iconWrapper}>
          <Image src="/images/store.png" alt="Store" width={40} height={40} />
          {isExpanded && <span style={styles.storeName}>Easy POS</span>}
        </div>

        {/*Home Page*/}
        <div
          style={styles.icon}
          onClick={() => handleMenuClick('/')}
        >
          <Image src="/images/web.png" alt="Homepage" width={40} height={40} />
          {isExpanded && <span style={styles.iconLabel}>หน้าหลัก</span>}
        </div>

        {/* Return Menu */}
        <div
          style={styles.icon}
          className={activeMenu === '/TablePage' ? 'active' : ''}
          onClick={() => handleMenuClick('/TablePage')}
        >
          <Image src="/images/left-arrow (1).png" alt="Return" width={35} height={35} />
          {isExpanded && <span style={styles.iconLabel}>ย้อนกลับ</span>}
        </div>

        {/* Logout Menu */}
        <div
          style={styles.icon}
          onClick={handleLogout}
        >
          <Image src="/images/logout.png" alt="Logout" width={35} height={35} />
          {isExpanded && <span style={styles.iconLabel}>ออกจากระบบ</span>}
        </div>
      </div>

      {/* Active Menu Styles */}
      <style jsx>{`
        .active {
          background-color: rgb(12, 62, 95);
          border-radius: 8px;
          color: #fff;
          padding: 8px 12px;
          font-size: 14px;
        }
      `}</style>
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
    flexDirection: 'row',
    marginTop: '30px',
  },
  storeName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#499cae',
    marginLeft: '10px',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '13px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    color: '#fff',
  },
  iconLabel: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#ffffff',
  },
};
