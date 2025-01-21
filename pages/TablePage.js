import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { MdRestaurant } from 'react-icons/md';
import axios from 'axios';
import Keyboard from './keyboard';  // คีย์บอร์ดเสมือนที่คุณสร้างขึ้นมา

const api_url = "https://easyapp.clinic/pos-api/api";
const slug = "abc";
const authToken = "R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH";

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
                color: isSpecialTable ? '#333' : '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                backgroundColor: isSpecialTable ? '#FFC137' : isAvailable ? '#499cae' : '#ff6b6b',
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
                onClick(table.id);  // เมื่อกดที่โต๊ะให้ไปที่หน้ารายละเอียด
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0px 8px 20px rgba(0, 0, 0, 0.25)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0px 6px 18px rgba(0, 0, 0, 0.15)';
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
    const [error, setError] = useState(null);
    const { tableCode } = router.query;
    const [displayTable, setDisplayTable] = useState('');
    const [searchQuery, setSearchQuery] = useState('');  // ใช้สำหรับการค้นหาตาราง
    const [keyboardVisible, setKeyboardVisible] = useState(false);  // ใช้เพื่อควบคุมการแสดงคีย์บอร์ด
    const searchInputRef = useRef(null);  // ใช้เพื่ออ้างอิงช่องค้นหา
    const keyboardRef = useRef(null);  // ใช้เพื่ออ้างอิงคีย์บอร์ด

    // ฟังก์ชันสำหรับเล่นเสียงเมื่อกดโต๊ะ
    const playClickSound = () => {
        const audio = new Audio('/sounds/click-151673.mp3'); // เสียงเมื่อกด
        audio.play();
    };

    // ฟังก์ชันสำหรับดึงข้อมูลโต๊ะจาก API
    const fetchTables = async () => {
        try {
            const url = `${api_url}/${slug}/table_codes`;
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            const tablesData = response.data;

            // คัดแยกโต๊ะพิเศษ "หน้าขาย" ไว้ที่ตำแหน่งแรก
            const specialTable = tablesData.find(table => table.table_code === 'CT001');
            const otherTables = tablesData.filter(table => table.table_code !== 'CT001');
            setTables(specialTable ? [specialTable, ...otherTables] : otherTables);  // อัพเดตโต๊ะที่แสดง
            setError(null);
        } catch (error) {
            console.error('Error fetching tables:', error);
            setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
        }
    };

    useEffect(() => {
        fetchTables();
        const interval = setInterval(fetchTables, 5000); // ดึงข้อมูลทุก 5 วินาที
        return () => clearInterval(interval);
    }, []);

    // ฟังก์ชันเปลี่ยนแปลงค่าค้นหา
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    // ฟังก์ชันรับค่าจากคีย์บอร์ดเสมือน
    const handleKeyboardInput = (key) => {
        if (key === 'DELETE') {
            setSearchQuery(searchQuery.slice(0, -1));  // ลบตัวอักษร
        } else if (key === 'SPACE') {
            setSearchQuery(searchQuery + ' ');  // เพิ่มช่องว่าง
        } else if (key === 'ENTER') {
            // กด Enter
        } else {
            setSearchQuery(searchQuery + key);  // เพิ่มอักขระที่กด
        }
    };

    // ฟังก์ชันกรองข้อมูลโต๊ะตามคำค้นหา
    const filteredTables = tables.filter((table) => {
        const tableCode = table.table_code.toLowerCase();
        return tableCode.includes(searchQuery.toLowerCase());
    });

    // ฟังก์ชันเมื่อคลิกที่โต๊ะ
    const handleTableClick = (tableCode) => {
        playClickSound();  // เล่นเสียงเมื่อคลิกโต๊ะ
        router.push({
            pathname: '/products',
            query: { tableCode }
        });
    };

    // ฟังก์ชันเปิดคีย์บอร์ด
    const handleFocusSearch = () => {
        setKeyboardVisible(true);
    };

    // ฟังก์ชันปิดคีย์บอร์ด
    const handleCloseKeyboard = () => {
        setKeyboardVisible(false);
    };

    // ฟังก์ชันเพื่อปิดคีย์บอร์ดเมื่อคลิกที่พื้นที่นอกช่องค้นหา
    const handleClickOutside = (event) => {
        if (
            searchInputRef.current &&
            !searchInputRef.current.contains(event.target) &&
            keyboardRef.current &&
            !keyboardRef.current.contains(event.target)  // ป้องกันไม่ให้คีย์บอร์ดปิดเมื่อคลิกในคีย์บอร์ด
        ) {
            setKeyboardVisible(false);  // ปิดคีย์บอร์ด
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);  // ฟังการคลิกที่เอกสาร
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);  // ลบ event listener เมื่อไม่ใช้งาน
        };
    }, []);

    return (
        <div style={styles.pageContainer}>
            {tableCode ? (
                <div style={styles.header}>
                    <h1>รวมเมนูอาหาร</h1>
                    <h2>{displayTable}</h2>
                </div>
            ) : (
                <div style={styles.tableSelectionContainer}>
                    <h1 style={styles.title}>เลือกโต๊ะ</h1>
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="ค้นหาโต๊ะ"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={handleFocusSearch}  // เปิดคีย์บอร์ดเมื่อคลิกช่องค้นหา
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
                    {keyboardVisible && <Keyboard onKeyPress={handleKeyboardInput} onClose={handleCloseKeyboard} ref={keyboardRef} />}
                </div>
            )}
        </div>
    );
}

const styles = { 
    pageContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f0f2f5', minHeight: '100vh' }, 
    header: { padding: '20px', textAlign: 'center', backgroundColor: '#f0f2f5', width: '100%' }, 
    tableSelectionContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }, 
    title: { fontSize: '28px', fontWeight: '600', textAlign: 'center', marginBottom: '30px' }, 
    searchInput: { 
        width: '50%', 
        padding: '10px', 
        fontSize: '16px', 
        marginBottom: '20px', 
        borderRadius: '5px', 
        border: '1px solid #ccc',
    }, 
    tableGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px', justifyContent: 'center', padding: '20px', width: '100%', maxWidth: '1000px' }, 
    errorText: { color: 'red' }, 
    noTableText: { color: '#333' },
};
