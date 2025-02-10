import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { MdRestaurant } from 'react-icons/md';
import axios from 'axios';
import Keyboard from './keyboard'; // คีย์บอร์ดเสมือนที่คุณสร้างขึ้นมา
import Sidebar from './components/sidebar'; // Sidebar

// Component สำหรับแสดงข้อมูลโต๊ะ
function TableCard({ table, onClick }) {
    const [isPressed, setIsPressed] = useState(false);
    const isAvailable = table.tableFree === 1 && table.status === 'Y'; // ตรวจสอบสถานะโต๊ะ
    const isSpecialTable = table.table_code === 'CT001'; // ตรวจสอบว่าโต๊ะเป็นโต๊ะพิเศษหรือไม่

    return (
        <div
            style={{
                width: '160px',
                height: '200px',
                color: isSpecialTable ? '#333' : '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px', // ขอบมุมโค้ง
                background: isSpecialTable
                    ? 'linear-gradient(145deg, #FFC137, #FFB220)' 
                    : isAvailable
                    ? 'linear-gradient(145deg, #499cae, #36758f)' 
                    : 'linear-gradient(145deg, #ff6b6b, #f14f4f)', // ไล่สีพื้นหลัง
                boxShadow: isPressed
                    ? '0px 3px 8px rgba(0, 0, 0, 0.2)' // เงาลึกเมื่อกด
                    : '0px 6px 18px rgba(0, 0, 0, 0.15)', // เงาปกติ
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: '600', // ฟอนต์หนา
                padding: '15px',
                textAlign: 'center',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease, border 0.3s ease', // เพิ่มการเปลี่ยนแปลงเมื่อ hover
                transform: isPressed ? 'scale(0.98)' : 'scale(1)', // ขยายเมื่อกด
                border: `3px solid ${isSpecialTable ? '#FFC137' : '#fff'}`, // ขอบที่ชัดเจน
            }}
            onClick={() => {
                setIsPressed(false);
                onClick(table.id); // เมื่อกดที่โต๊ะให้ไปที่หน้ารายละเอียด
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'; // ขยายโต๊ะเมื่อ hover
                e.currentTarget.style.boxShadow = '0px 10px 25px rgba(0, 0, 0, 0.3)'; // เงาที่มืดขึ้นเมื่อ hover
                e.currentTarget.style.border = `3px solid ${isAvailable ? '#d9ecf1' : '#fce6b6'}`; // เปลี่ยนสีขอบเมื่อ hover
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'; // กลับขนาดโต๊ะเมื่อออกจาก hover
                e.currentTarget.style.boxShadow = '0px 6px 18px rgba(0, 0, 0, 0.15)'; // กลับเงาปกติ
                e.currentTarget.style.border = `3px solid ${isSpecialTable ? '#FFC137' : '#fff'}`; // กลับขอบเดิม
            }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            aria-label={`Table ${table.table_code}, ${isAvailable ? 'Available' : 'Occupied'}`}
        >
            <MdRestaurant style={{ fontSize: '50px', marginBottom: '10px' }} />
            <p>{isSpecialTable ? 'หน้าขาย' : table.table_code}</p>
            {!isSpecialTable && <p>สถานะ: {isAvailable ? 'ว่าง' : 'ไม่ว่าง'}</p>}
        </div>
    );
}


export default function MainTablePage() {
    const router = useRouter();
    const [tables, setTables] = useState([]);
    const [userName, setUserName] = useState(''); // สำหรับเก็บชื่อผู้ใช้
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
            console.error('Error fetching tables:', error);
            setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
        }
    };

    const fetchUserName = () => {
        const storedUserName = localStorage.getItem('username'); // สมมติว่าชื่อผู้ใช้เก็บใน localStorage key `username`
        if (storedUserName) {
            setUserName(storedUserName);
        } else {
            setError('ไม่พบข้อมูลผู้ใช้');
        }
    };

    useEffect(() => {
        fetchTables();
        fetchUserName(); // ดึงชื่อผู้ใช้จาก localStorage
        const interval = setInterval(fetchTables, 5000); // ดึงข้อมูลทุก 5 วินาที
        return () => clearInterval(interval);
    }, []);

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const filteredTables = tables.filter((table) => {
        const tableCode = table.table_code.toLowerCase();
        return tableCode.includes(searchQuery.toLowerCase());
    });

    const handleTableClick = (tableCode) => {
        playClickSound();
        router.push({
            pathname: '/products',
            query: { tableCode },
        });
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar /> {/* เพิ่ม Sidebar */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f0f2f5' }}>
                <div style={styles.tableSelectionContainer}>
                    <h1 style={styles.title}>{userName ? `ยินดีต้อนรับ: ${userName}` : 'กำลังโหลด...'}</h1>
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="ค้นหาโต๊ะ"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        style={styles.searchInput}
                    />
                    <div style={styles.tableGrid}>
                        {error ? (
                            <p style={styles.errorText}>{error}</p>
                        ) : filteredTables.length > 0 ? (
                            filteredTables.map((table) => (
                                <TableCard
                                    key={table.id}
                                    table={table}
                                    onClick={handleTableClick}
                                />
                            ))
                        ) : (
                            <p style={styles.noTableText}>ไม่พบข้อมูลโต๊ะ</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    header: { padding: '20px', textAlign: 'center', backgroundColor: '#f0f2f5', width: '100%' },
    tableSelectionContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' },
    title: { fontSize: '28px', fontWeight: '600', textAlign: 'center', marginBottom: '30px', color: '#333' },
    searchInput: { width: '50%', padding: '10px', fontSize: '16px', marginBottom: '20px', borderRadius: '5px', border: '1px solid #ccc' },
    tableGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px', justifyContent: 'center', padding: '20px', width: '100%', maxWidth: '1000px' },
    errorText: { color: 'red' },
    noTableText: { color: '#333' },
};
