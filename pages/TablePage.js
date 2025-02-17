import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { MdRestaurant } from 'react-icons/md';
import axios from 'axios';
import Keyboard from './keyboard'; // คีย์บอร์ดเสมือนที่คุณสร้างขึ้นมา
import Sidebar from './components/sidebar'; // Sidebar
import config from '../lib/config';  // ใช้ config ในไฟล์ที่ต้องการ
import Image from 'next/image';
import './styles.css';  // เพิ่มไฟล์ CSS ที่คุณสร้างใหม่เข้ามา
import { FaCircle } from 'react-icons/fa';

// Component สำหรับแสดงข้อมูลโต๊ะ
function TableCard({ table, onClick }) {
    const [isPressed, setIsPressed] = useState(false);
    const isAvailable = table.tableFree === 1 && table.status === 'Y'; // ตรวจสอบสถานะโต๊ะ
    const isSpecialTable = table.table_code === 'CT001'; // ตรวจสอบว่าโต๊ะเป็นโต๊ะพิเศษหรือไม่

    return (
        <div
            style={{
                width: '150px',
                height: '200px',
                color: isSpecialTable ? '#333' : '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                backgroundColor: isSpecialTable ? '#ffd700' : isAvailable ? '#499cae' : '#d33',
                boxShadow: isPressed
                    ? '0px 3px 8px rgba(0, 0, 0, 0.2)'
                    : '0px 6px 18px rgba(0, 0, 0, 0.15)',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
                padding: '15px',
                textAlign: 'center',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                transform: isPressed ? 'scale(0.95)' : 'scale(1)',
            }}
            onClick={() => {
                setIsPressed(false);
                onClick(table.id); // เมื่อกดที่โต๊ะให้ไปที่หน้ารายละเอียด
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0px 8px 20px rgba(0, 0, 0, 0.25)';
                e.currentTarget.style.border = `3px solid ${isAvailable ? '#d9ecf1' : '#fce6b6'}`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0px 6px 18px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.border = `3px solid ${isSpecialTable ? '#FFC137' : '#fff'}`;
            }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            aria-label={`Table ${table.table_code}, ${isAvailable ? 'Available' : 'Occupied'}`}
        >
            <Image
                src={isSpecialTable ? "/images/box.png" : "/images/eat.png"} 
                alt="Table Icon"
                width={70}
                height={70}
                style={{ marginBottom: '0px' }}
            />
            <p>{isSpecialTable ? 'หน้าขาย' :table.table_code }</p>
            {!isSpecialTable && (
                <p>{isAvailable ? 'พร้อมให้บริการ' : 'กำลังให้บริการ'}</p>
            )}
        </div>
    );
}

// เพิ่ม component สำหรับแสดงข้อมูลสถิติ
const StatsDisplay = ({ tables }) => {
  const availableTables = tables.filter(table => table.tableFree === 1 && table.status === 'Y');
  const activeTables = tables.filter(table => table.status === 'N');
  const specialTable = tables.find(table => table.table_code === 'CT001');
  
  return (
    <div style={styles.statsContainer}>
      <div style={styles.stat}>
        <FaCircle style={{ ...styles.icon, color: 'yellow' }} />
        <span>โต๊ะพิเศษ: {specialTable ? 1 : 0}</span>
      </div>
      <div style={styles.stat}>
        <FaCircle style={{ ...styles.icon, color: '#499cae' }} />
        <span>โต๊ะพร้อมให้บริการ: {availableTables.length}</span>
      </div>
      <div style={styles.stat}>
        <FaCircle style={{ ...styles.icon, color: 'red' }} />
        <span>โต๊ะกำลังให้บริการ: {activeTables.length}</span>
      </div>
    </div>
  );
};

export default function MainTablePage() {
    const router = useRouter();
    const [tables, setTables] = useState([]);
    const [storeName, setStoreName] = useState(''); // สำหรับเก็บชื่อร้าน
    const [error, setError] = useState(null);
    const { tableCode } = router.query;
    const [searchQuery, setSearchQuery] = useState(''); // ใช้สำหรับการค้นหาตาราง
    const [keyboardVisible, setKeyboardVisible] = useState(false); // ใช้เพื่อควบคุมการแสดงคีย์บอร์ด
    const searchInputRef = useRef(null); // ใช้เพื่ออ้างอิงช่องค้นหา
    const keyboardRef = useRef(null); // ใช้เพื่ออ้างอิงคีย์บอร์ด

  const playClickSound = () => {
    const audio = new Audio('/sounds/click-151673.mp3'); // เสียงเมื่อกด
    audio.play();
  };

  const fetchTables = async () => {
    try {
      const api_url = localStorage.getItem('url_api');
      const slug = localStorage.getItem('slug');
      const authToken = localStorage.getItem('token');
      const url = `${api_url}/${slug}/table_codes`;
      const response = await axios.get(url, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const tablesData = response.data;
      const specialTable = tablesData.find((table) => table.table_code === 'CT001');
      const otherTables = tablesData.filter((table) => table.table_code !== 'CT001');
      setTables(specialTable ? [specialTable, ...otherTables] : otherTables);
      setError(null);
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
    }
  };
  
  useEffect(() => {
    const storedStoreName = localStorage.getItem('store');
    if (storedStoreName) {
      setStoreName(storedStoreName);
    } else {
      setStoreName('Easy POS'); // ค่าเริ่มต้นถ้าไม่มีใน localStorage
    }

    fetchTables();
    const interval = setInterval(fetchTables, 10000); // ดึงข้อมูลทุก 10 วินาที
    return () => clearInterval(interval);
  }, []);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleKeyboardInput = (key) => {
    if (key === 'DELETE') {
      setSearchQuery(searchQuery.slice(0, -1)); // ลบตัวอักษร
    } else if (key === 'SPACE') {
      setSearchQuery(searchQuery + ' '); // เพิ่มช่องว่าง
    } else if (key === 'ENTER') {
    } else {
      setSearchQuery(searchQuery + key); // เพิ่มอักขระที่กด
    }
  };

  const filteredTables = tables.filter((table) => {
    const tableCode = table.table_code.toLowerCase();
    return tableCode.includes(searchQuery.toLowerCase());
  });

  const handleTableClick = (tableCode) => {
    playClickSound();
    router.push({
      pathname: '/products',
      query: { tableCode: tableCode },
    });
  };

  const handleFocusSearch = () => {
    setKeyboardVisible(true);
  };

  const handleCloseKeyboard = () => {
    setKeyboardVisible(false);
  };

  const handleClickOutside = (event) => {
    if (
      searchInputRef.current &&
      !searchInputRef.current.contains(event.target) &&
      keyboardRef.current &&
      !keyboardRef.current.contains(event.target)
    ) {
      setKeyboardVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />  {/* แสดง Sidebar ด้านซ้าย */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgb(221, 236, 237)' }}>
        {tableCode ? (
          <div style={styles.header}>
            <h1>รวมเมนูอาหาร</h1>
          </div>
        ) : (
          <div style={styles.tableSelectionContainer}>
            <h1 style={styles.title}>{storeName ? `${storeName}` : 'กำลังโหลด...'}</h1>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="ค้นหาโต๊ะ"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleFocusSearch}
              style={styles.searchInput}
            />

            <div className="marquee-text">ยินดีต้อนรับสู่ระบบ POS ของเรา! เปิดโต๊ะเพื่อเริ่มการให้บริการลูกค้า และทำให้การบริหารร้านของคุณเร็วและง่ายขึ้น.</div>

            <div style={styles.contentWrapper}>
              {/* โต๊ะ */}
              <div style={styles.tableGrid}>
                {error ? (
                  <p style={styles.errorText}>{error}</p>
                ) : filteredTables.length > 0 ? (
                  filteredTables.map((table) => (
                    <TableCard key={table.id} table={table} onClick={handleTableClick} />
                  ))
                ) : (
                  <p style={styles.noTableText}>ไม่พบข้อมูลโต๊ะ</p>
                )}
              </div>
              {/* ข้อมูลสถิติ */}
              <StatsDisplay tables={tables} />
            </div>
            {keyboardVisible && (
              <Keyboard onKeyPress={handleKeyboardInput} onClose={handleCloseKeyboard} ref={keyboardRef} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
    contentWrapper: { 
    display: 'flex', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%',
    maxWidth: '1300px',
    marginTop: '5px',
  },
  statsContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '15px', 
    marginLeft: '20px',
    minWidth: '200px',
    padding: '15px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
  },
  stat: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: 'bold' },
  icon: { fontSize: '24px' },
  sidebar: { height: '87vh', backgroundColor: '#499cae', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', borderRadius: '20px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)', transition: 'width 0.3s ease', position: 'absolute', top: '20px', left: '20px', zIndex: 1000, width: '215px' },
  header: { padding: '50px', textAlign: 'center', background_Color: '#f0f2f5', width: '100%', border: '2px solid white' },
  tableSelectionContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' },
  title: { padding: '0px', fontSize: '30px', fontWeight: '600', textAlign: 'center', marginBottom: '5px', fontFamily: '"Montserrat", sans-serif', color: '#222' },
  searchInput: { width: '1270px', padding: '10px', fontSize: '16px', marginBottom: '0px', borderRadius: '5px', border: '1px solid #ccc' },
  tableGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '30px', justifyContent: 'center', padding: '50px', width: '100%', maxWidth: '1000px', border: '5px solid white', borderRadius: '10px', backgroundColor: '#ffffff', boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)', maxHeight: '470px', overflowY: 'auto' },
  errorText: { color: 'red' },
  noTableText: { color: '#333' },
  sale: { color: '#000' },
};

