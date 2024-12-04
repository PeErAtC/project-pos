import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MdRestaurant } from 'react-icons/md';
import axios from 'axios';

const api_url = "https://easyapp.clinic/pos-api/api";
const slug = "abc";
const authToken = "R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH";

function TableCard({ table, onClick }) {
    const [isPressed, setIsPressed] = useState(false);
    const isAvailable = table.tableFree === 1 && table.status === 'Y';
    const isSpecialTable = table.table_code === 'CT001';

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
                onClick(table.id);  // Handle table click
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
    const [searchQuery, setSearchQuery] = useState('');  // State for search query

    // Play sound on table click
    const playClickSound = () => {
        const audio = new Audio('/sounds/click-151673.mp3'); // Path to your audio file
        audio.play();
    };

    // Fetch tables data from API
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
            // Filter out special table and place it at the start of the list
            const specialTable = tablesData.find(table => table.table_code === 'CT001');
            const otherTables = tablesData.filter(table => table.table_code !== 'CT001');

            // Compare current tables with new data to check for changes
            if (JSON.stringify(tables) !== JSON.stringify([specialTable ? [specialTable, ...otherTables] : otherTables])) {
                setTables(specialTable ? [specialTable, ...otherTables] : otherTables);
                setError(null);
            }
        } catch (error) {
            console.error('Error fetching tables:', error);
            if (error.response) {
                if (error.response.status === 404) {
                    setError('ไม่พบเส้นทางของ API (404 Not Found)');
                } else {
                    setError(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${error.response.status}`);
                }
            } else if (error.request) {
                setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ');
            } else {
                setError('เกิดข้อผิดพลาด: ' + error.message);
            }
        }
    };

    // Check if the tableCode is special ("CT001") to display "หน้าขาย" instead of "โต๊ะ <number>"
    useEffect(() => {
        if (tableCode === 'CT001') {
            setDisplayTable('หน้าขาย');
        } else if (tableCode) {
            setDisplayTable(`โต๊ะ ${tableCode}`);
        }
    }, [tableCode]);

    useEffect(() => {
        fetchTables();
        const interval = setInterval(fetchTables, 5000); // Fetch every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const handleTableClick = (tableCode) => {
        playClickSound();  // Play sound when a table is clicked
        router.push({
            pathname: '/products',
            query: { tableCode }
        });
    };

    // Handle search input change
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    // Filter tables based on the search query
    const filteredTables = tables.filter((table) => {
        const tableCode = table.table_code.toLowerCase();
        return tableCode.includes(searchQuery.toLowerCase());
    });

    return (
        <div style={styles.pageContainer}>
            {/* Section to display the header and current table information */}
            {tableCode ? (
                <div style={styles.header}>
                    <h1>รวมเมนูอาหาร</h1>
                    <h2>{displayTable}</h2>
                </div>
            ) : (
                <div style={styles.tableSelectionContainer}>
                    <h1 style={styles.title}>เลือกโต๊ะ</h1>
                    {/* Search Bar */}
                    <input
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
            )}
        </div>
    );
}

const styles = { 
    pageContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f0f2f5', minHeight: '100vh' }, 
    header: { padding: '20px', textAlign: 'center', backgroundColor: '#f0f2f5', width: '100%' }, 
    tableSelectionContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }, 
    stickyHeader: {
        position: 'sticky',
        top: '0',
        backgroundColor: '#f0f2f5',
        zIndex: '10',
        padding: '20px',
        width: '100%',
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
    },
    title: { fontSize: '28px', fontWeight: '600', textAlign: 'center', marginBottom: '30px' }, 
    searchInput: { padding: '10px', fontSize: '16px', marginBottom: '20px', width: '80%', maxWidth: '400px' },
    loadingText: { fontSize: '18px', color: '#666' },
    tableGrid: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
        gap: '20px', 
        justifyContent: 'center', 
        padding: '20px', 
        width: '100%', 
        maxWidth: '1000px',
        maxHeight: '64vh',  
        overflowY: 'auto',  
    }, 
    errorText: { color: 'red' }, 
    noTableText: { color: '#333' },
    searchInput: { 
        width: '50%', 
        padding: '10px', 
        fontSize: '16px', 
        marginBottom: '20px', 
        borderRadius: '5px', 
        border: '1px solid #ccc',
    }, 
};
