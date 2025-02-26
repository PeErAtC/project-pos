import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';

export default function BackendSidebar() {
  const [isExpanded, setIsExpanded] = useState(false); // สถานะสำหรับพับ/กาง Sidebar
  const [activeMenu, setActiveMenu] = useState(null); // สำหรับตรวจสอบเมนูที่ถูกเลือก
  const [username, setUsername] = useState(''); // สถานะสำหรับเก็บชื่อผู้ใช้
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
    const currentPath = router.pathname;
    setActiveMenu(currentPath);
  }, [router.pathname]);

  

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded); // เปลี่ยนสถานะพับ/กาง
  };

  const handleMenuClick = (menu) => {
    if (menu === '/logout') {
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
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          localStorage.removeItem('url_api');
          localStorage.removeItem('slug');

          Swal.fire({
            title: 'ออกจากระบบสำเร็จ',
            text: 'คุณได้ออกจากระบบเรียบร้อยแล้ว',
            icon: 'success',
            confirmButtonText: 'ตกลง',
          }).then(() => {
            router.push('/login');
          });
        }
      });
      return;
    }
    setActiveMenu(menu); // ตั้งค่าเมนูที่คลิกให้เป็น active
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

      {/* Store and Username */}
      <div style={{ ...styles.iconWrapper, width: isExpanded ? '160px' : '40px' }}>
        <Image src="/images/folder.png" alt="Store" width={40} height={40} />
        {isExpanded && (

<<<<<<< HEAD
=======

>>>>>>> e9d1c757fb1b0db91d3863a464e3f66c9d150d5a
          <div style={styles.storeInfo}>
        <div style={styles.marqueeContainer}>
          <div style={styles.marqueeContent}>
            <span>{storeName}&nbsp;&nbsp;&nbsp;&nbsp;</span>
              </div>
            </div>
            {username && <span style={styles.userName}>ผู้ใช้: {username}</span>}
          </div>
        )}
      </div>

      {/* Icons Section */}
      <div style={styles.iconContainer(isExpanded)}>
        <div
          style={{ ...styles.icon, ...(activeMenu === '/backendpage' ? styles.activeIcon : {}) }}
          onClick={() => handleMenuClick('/backendpage')}
        >
          <Image src="/images/menu.png" alt="Food" width={35} height={35} />
          {isExpanded && <span style={styles.iconLabel}>หน้าหลัก</span>}
        </div>

        <div
          style={{ ...styles.icon, ...(activeMenu === '/SalesReport' ? styles.activeIcon : {}) }}
          onClick={() => handleMenuClick('/SalesReport')}
        >
          <Image src="/images/file.png" alt="Report" width={36} height={36} />
          {isExpanded && <span style={styles.iconLabel}>รายงานการขาย</span>}
        </div>

        <div
          style={{ ...styles.icon, ...(activeMenu === '/PaymentSummary' ? styles.activeIcon : {}) }}
          onClick={() => handleMenuClick('/PaymentSummary')}
        >
          <Image src="/images/growth.png" alt="Report" width={40} height={40} />
          {isExpanded && <span style={styles.iconLabel}>ยอดขาย</span>}
        </div>

        <div
          style={{ ...styles.icon, ...(activeMenu === '/TableManagement' ? styles.activeIcon : {}) }}
          onClick={() => handleMenuClick('/TableManagement')}
        >
          <Image src="/images/dinner-table.png" alt="Table" width={40} height={40} />
          {isExpanded && <span style={styles.iconLabel}>จัดการโต๊ะ</span>}
        </div>

        <div
          style={{ ...styles.icon, ...(activeMenu === '/EmployeeManagement' ? styles.activeIcon : {}) }}
          onClick={() => handleMenuClick('/EmployeeManagement')}
        >
          <Image src="/images/add-user.png" alt="Employee" width={35} height={35} />
          {isExpanded && <span style={styles.iconLabel}>จัดการผู้ใช้</span>}
        </div>

        <div
          style={{ ...styles.icon, ...(activeMenu === '/' ? styles.activeIcon : {}) }}
          onClick={() => handleMenuClick('/')}
        >
          <Image src="/images/left-arrow.png" alt="Back" width={30} height={30} />
          {isExpanded && <span style={styles.iconLabel}>ย้อนกลับ</span>}
        </div>

        <div
          style={{ ...styles.icon, ...(activeMenu === '/logout' ? styles.activeIcon : {}) }}
          onClick={() => handleMenuClick('/logout')}
        >
          <Image src="/images/logout.png" alt="Logout" width={30} height={30} />
          {isExpanded && <span style={styles.iconLabel}>ออกจากระบบ</span>}
        </div>
      </div>
    </div>
  );
}
const styles = {
  sidebar: { height: '87vh', background: 'linear-gradient(to bottom, #499cae,rgb(13, 135, 175))', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', borderRadius: '20px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)', transition: 'width 0.3s ease', position: 'fixed', top: '20px', left: '20px', zIndex: 1000 },
  toggleButton: { cursor: 'pointer', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', backgroundColor: '#494cba', color: '#499cae', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', position: 'absolute', top: '20px', right: '-15px', zIndex: 1100 },
  arrow: { fontSize: '20px', color: '#fff' },
  iconWrapper: { backgroundColor: '#fff', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)', flexDirection: 'row', marginTop: '30px', marginBottom: '20px', width: '100%' },
  storeInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' },
  marqueeContainer: { display: 'flex', overflow: 'hidden', width: '120px', whiteSpace: 'nowrap', position: 'relative' },
<<<<<<< HEAD
  marqueeContent: { display: 'inline-block', whiteSpace: 'nowrap', animation: 'marquee 5s linear infinite', color: '#499cae', fontSize: '14px', fontWeight: 'bold' },
  storeName: { fontSize: '14px', fontWeight: 'bold', color: '#499cae', padding: '5px', display: 'flex', flexDirection: 'column' },
=======
  marqueeContent: { display: 'inline-block', whiteSpace: 'nowrap', animation: 'marquee 5s linear infinite', color: '#499cae', fontSize: '16px', fontWeight: 'bold' },
  storeName: { fontSize: '18px', fontWeight: 'bold', color: '#499cae', padding: '5px', display: 'flex', flexDirection: 'column' },
>>>>>>> e9d1c757fb1b0db91d3863a464e3f66c9d150d5a
  userName: { fontSize: '14px', fontWeight: 'bold', color: '#444' },
  iconContainer: (isExpanded) => ({ display: 'flex', flexDirection: 'column', alignItems: isExpanded ? 'flex-start' : 'center', gap: '20px', width: '100%', paddingLeft: isExpanded ? '20px' : '0' }),
  icon: { display: 'flex', alignItems: 'center', gap: '10px', padding: '13px', cursor: 'pointer', transition: 'background 0.3s ease', color: '#fff', fontSize: '16px', fontWeight: 'normal' },
  activeIcon: { backgroundColor: 'rgb(12, 62, 95)', color: '#ffffff', borderRadius: '10px', padding: '15px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)' },
  iconLabel: { fontSize: '16px', fontWeight: '500', color: '#ffffff' },
};
