import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';

export default function BackendSidebar() {
  const [isExpanded, setIsExpanded] = useState(false); // สถานะสำหรับพับ/กาง Sidebar
  const [activeMenu, setActiveMenu] = useState(null); // สำหรับตรวจสอบเมนูที่ถูกเลือก
  const router = useRouter();

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded); // เปลี่ยนสถานะพับ/กาง
  };

  // ตรวจสอบเส้นทางที่เลือกจาก router.pathname และตั้งค่าหมวดหมู่ที่ถูกเลือก
  useEffect(() => {
    const currentPath = router.pathname;
    setActiveMenu(currentPath);
  }, [router.pathname]);

  const handleMenuClick = (menu) => {
    if (menu === '/logout') {
      // แสดงข้อความยืนยันก่อน Logout พร้อมเพิ่มเอฟเฟกต์
      Swal.fire({
        title: 'ยืนยันการออกจากระบบ',
        text: 'คุณต้องการออกจากระบบใช่หรือไม่?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ใช่, ออกจากระบบ',
        cancelButtonText: 'cancel',
        customClass: {
          confirmButton: 'hover-effect-button',
          cancelButton: 'hover-effect-cancel',
        },
      }).then((result) => {
        if (result.isConfirmed) {
          // ลบข้อมูลใน localStorage และเปลี่ยนเส้นทางไปยังหน้า Login
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          localStorage.removeItem('url_api');
          localStorage.removeItem('slug');
          router.push('/login');
        }
      });
      return;
    }

    setActiveMenu(menu); // ตั้งค่าเมนูที่คลิกให้เป็น active
    if (isExpanded) {
      setIsExpanded(false); // ถ้า Sidebar กางอยู่ให้พับกลับ
    }
    router.push(menu); // เปลี่ยนหน้าเมื่อเลือกเมนู
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

      {/* Icons Section */}
      <div style={styles.iconContainer(isExpanded)}>
        <div style={styles.iconWrapper} className="icon">
          <Image src="/images/folder.png" alt="Store" width={40} height={40} />
          {isExpanded && <span style={styles.storeName}>Easy POS</span>}
        </div>

        <div
          style={styles.icon}
          className={activeMenu === '/backendpage' ? 'active' : ''}
          onClick={() => handleMenuClick('/backendpage')}
        >
          <Image src="/images/menu.png" alt="Food" width={35} height={35} />
          {isExpanded && <span style={styles.iconLabel}>รายการอาหาร</span>}
        </div>

        <div
          style={styles.icon}
          className={activeMenu === '/SalesReport' ? 'active' : ''}
          onClick={() => handleMenuClick('/SalesReport')}
        >
          <Image src="/images/file.png" alt="Report" width={36} height={36} />
          {isExpanded && <span style={styles.iconLabel}>รายงานการขาย</span>}
        </div>

        <div
          style={styles.icon}
          className={activeMenu === '/PaymentSummary' ? 'active' : ''}
          onClick={() => handleMenuClick('/PaymentSummary')}
        >
          <Image src="/images/growth.png" alt="Report" width={40} height={40} />
          {isExpanded && <span style={styles.iconLabel}>ยอดขาย</span>}
        </div>

        <div
          style={styles.icon}
          className={activeMenu === '/TableManagement' ? 'active' : ''}
          onClick={() => handleMenuClick('/TableManagement')}
        >
          <Image src="/images/dinner-table.png" alt="Report" width={35} height={35} />
          {isExpanded && <span style={styles.iconLabel}>จัดการโต๊ะ</span>}
        </div>

        <div
          style={styles.icon}
          className={activeMenu === '/EmployeeManagement' ? 'active' : ''}
          onClick={() => handleMenuClick('/EmployeeManagement')}
        >
          <Image src="/images/add-user.png" alt="Report" width={35} height={35} />
          {isExpanded && <span style={styles.iconLabel}>จัดการผู้ใช้</span>}
        </div>

        <div
          style={styles.icon}
          className={activeMenu === '/' ? 'active' : ''}
          onClick={() => handleMenuClick('/')}
        >
          <Image src="/images/left-arrow.png" alt="Settings" width={30} height={30} />
          {isExpanded && <span style={styles.iconLabel}>ย้อนกลับ</span>}
        </div>
        <div
          style={styles.icon}
          className={activeMenu === '/logout' ? 'active' : ''}
          onClick={() => handleMenuClick('/logout')}
        >
          <Image src="/images/logout.png" alt="Logout" width={30} height={30} />
          {isExpanded && <span style={styles.iconLabel}>ออกจากระบบ</span>}
        </div>
      </div>

      {/* SweetAlert2 Custom Style */}
      <style global jsx>{`
        .swal2-confirm.custom-confirm-btn {
          background-color: #3085d6 !important;
          color: white !important;
          font-size: 16px;
          font-weight: bold;
          transition: transform 0.2s ease-in-out;
        }
        .swal2-confirm.custom-confirm-btn:hover {
          background-color: #2b75c4 !important;
          transform: scale(1.05);
        }
        .swal2-cancel.custom-cancel-btn {
          background-color: #d33 !important;
          color: white !important;
          font-size: 16px;
          font-weight: bold;
          transition: transform 0.2s ease-in-out;
        }
        .swal2-cancel.custom-cancel-btn:hover {
          background-color: #b02a37 !important;
          transform: scale(1.05);
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
    fontFamily: 'Arial, sans-serif',
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
    padding: '15px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '500',
  },
  iconLabel: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#ffffff',
  },
};
