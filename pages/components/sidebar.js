import { useState, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function Sidebar() {
  const [categories, setCategories] = useState([]);
  const [isCategoryPopupOpen, setIsCategoryPopupOpen] = useState(false);
  const [isSettingsPopupOpen, setIsSettingsPopupOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // สถานะสำหรับพับ/กาง Sidebar
  const [activeMenu, setActiveMenu] = useState(null); // เพิ่มสถานะ activeMenu เพื่อติดตามเมนูที่เลือก
  const router = useRouter();

  useEffect(() => {
    axios.get('https://easyapp.clinic/pos-api/api/category', {
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
      },
    })
      .then(response => setCategories(response.data))
      .catch(error => {
        console.error('Error fetching categories:', error.response ? error.response.data : error.message);
      });
  }, []);

  const toggleCategoryPopup = () => {
    setIsCategoryPopupOpen(!isCategoryPopupOpen);
  };

  const toggleSettingsPopup = () => {
    setIsSettingsPopupOpen(!isSettingsPopupOpen);
  };

  const handleBackToTablePage = () => {
    router.push('/TablePage');
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded); // เปลี่ยนสถานะพับ/กาง
  };

  // ฟังก์ชันสำหรับการคลิกเมนู
  const handleMenuClick = (menu) => {
    setActiveMenu(menu); // ตั้งค่าหมายเลขเมนูที่ถูกเลือกเป็น active
    if (isExpanded) {
      setIsExpanded(false); // ถ้า Sidebar กางอยู่ให้พับกลับ
    }
    router.push(menu); // เปลี่ยนหน้าเมื่อเลือกเมนู
  };

  return (
    <div style={{ ...styles.sidebar, width: isExpanded ? '200px' : '90px' }}>
      {/* Toggle Button */}
      <div style={styles.toggleButton} onClick={toggleSidebar}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" style={{ ...styles.arrow, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>

      {/* Icons Section */}
      <div style={styles.iconContainer(isExpanded)}>
        {/* Store Icon with White Border and Store Name */}
        <div style={styles.iconWrapper} className="icon">
          <Image src="/images/store.png" alt="Store" width={40} height={40} />
          {isExpanded && (
            <>
              <span style={styles.storeName}>Easy POS</span> {/* เพิ่มข้อความ "Easy POS" ข้างไอคอน */}
            </>
          )}
        </div>
        {/* เมนู Food */}
        <div
          style={styles.icon}
        >
          <Image src="/images/food.png" alt="Food" width={40} height={40} />
          {isExpanded && <span style={styles.iconLabel}>Food</span>}
        </div>

        {/* เมนู Categories */}
        <div
          style={styles.icon}
          className={activeMenu === '/categories' ? 'active' : ''}
          onClick={() => handleMenuClick('/categories')}
        >
          <Image src="/images/list.png" alt="List" width={40} height={40} />
          {isExpanded && <span style={styles.iconLabel}>Categories</span>}
        </div>

        {/* เมนู Settings */}
        <div
          style={styles.icon}
          className={activeMenu === '/settings' ? 'active' : ''}
          onClick={() => handleMenuClick('/settings')}
        >
          <Image src="/images/settings.png" alt="Settings" width={40} height={40} />
          {isExpanded && <span style={styles.iconLabel}>Settings</span>}
        </div>
      </div>

      {/* Styles for active menu */}
      <style jsx>{`
        .active {
          background-color: rgb(12, 62, 95); /* เปลี่ยนสีพื้นหลังเมื่อคลิกเมนู */
          border-radius: 8px; /* ปรับขนาด border-radius */
          color: #fff;
          padding: 8px 12px; /* ลดขนาด padding */
          font-size: 14px; /* ปรับขนาดฟอนต์ */
        }
        .icon:hover {
          background: none;
          transition: background 0.3s ease;
          box-shadow: none;
          padding: 0;
        }
        .icon:active {
          background: none;
          transition: background 0.1s ease;
          box-shadow: none;
          padding: 0;
        }
      `}</style>

      {/* Settings Popup */}
      {isSettingsPopupOpen && (
        <div style={styles.menuPopup} onClick={toggleSettingsPopup}>
          <div style={styles.menuContainer} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.popupTitle}>ตั้งค่า</h2>
            <div
              className="menu-item"
              onClick={handleBackToTablePage}
              style={{ ...styles.circleItem, backgroundColor: '#3498db' }}
            >
              <span style={styles.iconText}>🔙</span>
              <span style={styles.labelText}>ไปที่หน้าโต๊ะ</span>
            </div>
          </div>
        </div>
      )}
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
    fontSize: '14px',
    fontWeight: '500',
    color: '#ffffff',
  },
  menuPopup: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  menuContainer: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '30px',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    alignItems: 'center',
  },
  popupTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
    margin: '0px',
  },
  circleItem: {
    width: '140px',
    height: '140px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    cursor: 'pointer',
  },
  iconText: {
    fontSize: '40px',
    marginBottom: '10px',
  },
  labelText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
  },
};
