import { useState, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';

export default function Sidebar({ onCategorySelect }) {
  const [categories, setCategories] = useState([]);
  const [isCategoryPopupOpen, setIsCategoryPopupOpen] = useState(false);

  useEffect(() => {
    axios.get('https://easyapp.clinic/pos-api/api/category', {
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
      },
    })
    .then(response => setCategories(response.data))
    .catch(error => console.error('Error fetching categories:', error));
  }, []);

  const toggleCategoryPopup = () => {
    setIsCategoryPopupOpen(!isCategoryPopupOpen);
  };

  return (
    <>
      <div style={styles.sidebar}>
        <div style={{ ...styles.icon, ...styles.iconWithBackground }} className="icon">
          <Image src="/images/store.png" alt="Store" width={40} height={40} style={styles.iconImage} />
        </div>
        <div style={styles.icon} className="icon">
          <Image src="/images/food.png" alt="Food" width={40} height={40} style={styles.iconImage} />
        </div>
        <div style={styles.icon} onClick={toggleCategoryPopup} className="icon">
          <Image src="/images/list.png" alt="List" width={40} height={40} style={styles.iconImage} />
        </div>
        {isCategoryPopupOpen && (
          <div style={styles.menuPopup} onClick={toggleCategoryPopup}>
            <div style={styles.menuContainer} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.popupTitle}>หมวดหมู่อาหาร</h2>
              <ul className="menu">
                <li
                  className="menu-item"
                  onClick={() => { onCategorySelect(null); setIsCategoryPopupOpen(false); }}
                  style={{ ...styles.circleItem, backgroundColor: '#27ae60' }}
                >
                  <span style={styles.iconText}>🍽️</span>
                  <span style={styles.labelText}>ทั้งหมด</span>
                </li>
                <li
                  className="menu-item"
                  onClick={() => { onCategorySelect(1); setIsCategoryPopupOpen(false); }}
                  style={{ ...styles.circleItem, backgroundColor: '#e74c3c' }}
                >
                  <span style={styles.iconText}>🍛</span>
                  <span style={styles.labelText}>เมนูผัด</span>
                </li>
                <li
                  className="menu-item"
                  onClick={() => { onCategorySelect(2); setIsCategoryPopupOpen(false); }}
                  style={{ ...styles.circleItem, backgroundColor: '#f1c40f' }}
                >
                  <span style={styles.iconText}>🍚</span>
                  <span style={styles.labelText}>ข้าวผัด</span>
                </li>
                <li
                  className="menu-item"
                  onClick={() => { onCategorySelect(3); setIsCategoryPopupOpen(false); }}
                  style={{ ...styles.circleItem, backgroundColor: '#2980b9' }}
                >
                  <span style={styles.iconText}>🥗</span>
                  <span style={styles.labelText}>เมนูยำ</span>
                </li>
                <li
                  className="menu-item"
                  onClick={() => { onCategorySelect(4); setIsCategoryPopupOpen(false); }}
                  style={{ ...styles.circleItem, backgroundColor: '#1abc9c' }}
                >
                  <span style={styles.iconText}>🍲</span>
                  <span style={styles.labelText}>ข้าวต้ม</span>
                </li>
                <li
                  className="menu-item"
                  onClick={() => { onCategorySelect(5); setIsCategoryPopupOpen(false); }}
                  style={{ ...styles.circleItem, backgroundColor: '#8e44ad' }}
                >
                  <span style={styles.iconText}>🍹</span>
                  <span style={styles.labelText}>เครื่องดื่ม</span>
                </li>
              </ul>
            </div>
          </div>
        )}
        <div style={styles.icon} className="icon">
          <Image src="/images/settings.png" alt="Settings" width={40} height={40} style={styles.iconImage} />
        </div>
      </div>

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
          font-weight: bold;
          text-align: center;
          cursor: pointer;
          transition: transform 0.3s, box-shadow 0.3s, background-color 0.3s;
        }
        .menu-item:hover {
          transform: scale(1.15);
          box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.3);
          background-color: rgba(255, 255, 255, 0.2);
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
  sidebar: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    backgroundColor: '#499cae', 
    padding: '20px 0', 
    width: '90px', 
    height: '630px', 
    borderRadius: '20px', 
    position: 'fixed', 
    top: '20px', 
    left: '20px', 
    zIndex: 1000, 
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)' 
  },
  icon: {
    margin: '20px 0',
    cursor: 'pointer',
    borderRadius: '12px',
    padding: '5px',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.3s ease',
  },
  iconWithBackground: { 
    backgroundColor: '#ffffff', 
    borderRadius: '12px', 
    padding: '5px', 
    width: '50px', 
    height: '50px', 
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
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
  }
};