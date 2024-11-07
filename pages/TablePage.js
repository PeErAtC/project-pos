import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MdRestaurant } from 'react-icons/md';
import axios from 'axios';

function TableCard({ table, onClick }) {
    const [isPressed, setIsPressed] = useState(false);

    return (
        <div
            style={{
                ...styles.tableCard,
                backgroundColor: table.tableFree === 1 && table.status === 'Y' ? '#499cae' : '#FF6B6B', // สีเขียวถ้าว่างและสถานะเปิด, สีแดงถ้าไม่ว่าง
                transform: isPressed ? 'scale(0.95)' : 'scale(1)',
            }}
            onClick={() => onClick(table.id)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
        >
            <MdRestaurant style={styles.icon} />
            <p style={styles.tableName}>{table.table_code}</p>
            <p style={styles.details}>จำนวนที่นั่ง: {table.seats}</p>
            <p style={styles.status}>สถานะ: {table.tableFree === 1 && table.status === 'Y' ? 'ว่าง' : 'ไม่ว่าง'}</p>
        </div>
    );
}

export default function MainTablePage() {
    const router = useRouter();
    const [tables, setTables] = useState([]);

    const fetchTables = async () => {
        try {
            const response = await axios.get('https://easyapp.clinic/pos-api/api/table_codes', {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
                },
            });
            setTables(response.data);
        } catch (error) {
            console.error('Error fetching tables:', error);
        }
    };

    useEffect(() => {
        fetchTables();
        const interval = setInterval(fetchTables, 5000); // อัปเดตทุก 5 วินาที
        return () => clearInterval(interval);
    }, []);


    const handleTableClick = (tableId) => {
        router.push({
            pathname: '/products',
            query: { tableId }
        });
    };

    return (
        <div style={styles.pageContainer}>
            <div style={styles.content}>
                <h1 style={styles.title}>เลือกโต๊ะ</h1>
                <div style={styles.tablesContainer}>
                    {tables.length > 0 ? (
                        tables.map((table) => (
                            <TableCard
                                key={table.id}
                                table={table}
                                onClick={handleTableClick}
                            />
                        ))
                    ) : (
                        <p>ไม่พบข้อมูลโต๊ะ</p>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    pageContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
    },
    content: {
        flex: 1,
        maxWidth: '1200px',
        backgroundColor: '#fff',
        borderRadius: '15px',
        padding: '20px',
        boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)',
        margin: '20px',
    },
    title: {
        fontSize: '32px',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '30px',
        color: '#333',
    },
    tablesContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '20px',
        maxWidth: '1000px',
        margin: '0 auto',
    },
    tableCard: {
        width: '160px',
        height: '180px',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.20)',
        transition: 'transform 0.1s ease-in-out, box-shadow 0.2s ease',
        cursor: 'pointer',
        fontSize: '20px',
        fontWeight: 'bold',
        padding: '10px',
        textAlign: 'center',
    },
    icon: {
        fontSize: '50px',
        marginBottom: '10px',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    tableName: {
        margin: '5px 0',
        fontSize: '24px',
        fontWeight: 'bold',
    },
    details: {
        margin: '5px 0',
        fontSize: '14px',
    },
    status: {
        margin: '5px 0',
        fontSize: '16px',
        fontWeight: 'bold',
    },
};

function handleMouseEnter(event) {
    event.currentTarget.style.transform = 'scale(1.05)';
    event.currentTarget.style.boxShadow = '0px 6px 16px rgba(0, 0, 0, 0.35)';
}

function handleMouseLeave(event) {
    event.currentTarget.style.transform = '';
    event.currentTarget.style.boxShadow = '0px 4px 12px rgba(0, 0, 0, 0.25)';
}
