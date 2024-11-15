import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function BackendSidebar() {
  const [isReportPopupOpen, setIsReportPopupOpen] = useState(false);
  const [isSettingsPopupOpen, setIsSettingsPopupOpen] = useState(false);
  const router = useRouter();

  const toggleReportPopup = () => {
    setIsReportPopupOpen(!isReportPopupOpen);
  };

  const toggleSettingsPopup = () => {
    setIsSettingsPopupOpen(!isSettingsPopupOpen);
  };

  const handleBackToTablePage = () => {
    router.push('/');
  };

  return (
    <>
      <div style={styles.sidebar}>
        <div style={{ ...styles.icon, ...styles.iconWithBackground }} className="icon">
          <Image src="/images/folder.png" alt="Store" width={40} height={40} style={styles.iconImage} />
        </div>
        <div style={styles.icon} onClick={toggleReportPopup} className="icon">
          <Image src="/images/report-icon.png" alt="report-icon" width={40} height={40} priority loading="eager" />
        </div>
        <div style={styles.icon} onClick={toggleSettingsPopup} className="icon">
          <Image src="/images/settings.png" alt="Settings" width={40} height={40} style={styles.iconImage} />
        </div>
      </div>

      {isReportPopupOpen && (
        <div style={styles.menuPopup} onClick={toggleReportPopup}>
          <div style={styles.menuContainer} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.popupTitle}>รายงาน</h2>
            <ul className="menu">
              <li className="menu-item" onClick={() => router.push('/SalesReport')} style={{ backgroundColor: '#1abc9c' }}>
                <span style={styles.iconText}>💰</span>
                <span style={styles.labelText}>การชำระ</span>
              </li>
              <li className="menu-item" onClick={() => router.push('/PaymentSummary')} style={{ backgroundColor: '#3498db' }}>
                <span style={styles.iconText}>💳</span>
                <span style={styles.labelText}>ยอดขาย</span>
              </li>
              <li className="menu-item" onClick={() => router.push('/EmployeeSales')} style={{ backgroundColor: '#e67e22' }}>
                <span style={styles.iconText}>👤</span>
                <span style={styles.labelText}>ยอดขายพนักงาน</span>
              </li>
            </ul>
          </div>
        </div>
      )}

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
              <span style={styles.labelText}>ไปที่หน้าหลัก</span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .icon:hover {
          background: linear-gradient(45deg, #6dd5ed, #2193b0);
          transition: background 0.3s ease;
        }
        .icon:active {
          background: linear-gradient(45deg, #ff7e5f, #feb47b);
          transition: background 0.1s ease;
        }
        
        .menu {
          display: flex;
          justify-content: center;
          gap: 40px;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .menu-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          color: #fff;
          font-size: 22px;
          text-align: center;
          cursor: pointer;
          transition: transform 0.3s, box-shadow 0.3s, background-color 0.3s;
        }
        .menu-item:hover {
          transform: scale(1.15);
          box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.3);
        }
        .menu-item:active {
          transform: scale(1.05);
          box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </>
  );
}

const styles = { 
  sidebar: { display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#499cae', padding: '20px 0', width: '90px', height: '630px', borderRadius: '20px', position: 'fixed', top: '20px', left: '20px', zIndex: 1000, boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)' }, 
  icon: { margin: '20px 0', cursor: 'pointer', borderRadius: '12px', padding: '5px', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s ease' }, 
  iconWithBackground: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '5px', width: '50px', height: '50px', boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }, 
  menuPopup: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }, 
  menuContainer: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '30px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center' }, 
  popupTitle: { fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', color: '#333', textAlign: 'center', margin: '0px', padding: '10px' }, 
  circleItem: { width: '140px', height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer' }, 
  iconText: { fontSize: '40px', marginBottom: '10px' }, 
  labelText: { fontSize: '18px', fontWeight: 'bold', color: '#fff' } 
};
