import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { MdRestaurant } from 'react-icons/md';

const clickSound = typeof Audio !== 'undefined' ? new Audio('/sounds/click.mp3') : null;

function TableCard({ table, onClick }) {
    const [isPressed, setIsPressed] = useState(false);

    const handleClick = () => {
        if (clickSound) {
            clickSound.currentTime = 0;
            clickSound.play().catch(error => console.error("Error playing sound:", error));
        }
        onClick(table.id);
    };

    return (
        <div
            style={{
                ...styles.tableCard,
                backgroundColor: table.isAvailable ? '#499cae' : '#FF6B6B',
                transform: isPressed ? 'scale(0.95)' : 'scale(1)',
            }}
            onClick={handleClick}
            onMouseEnter={(event) => {
                event.currentTarget.style.transform = 'scale(1.05)';
                event.currentTarget.style.boxShadow = '0px 6px 16px rgba(0, 0, 0, 0.35)';
            }}
            onMouseLeave={(event) => {
                event.currentTarget.style.transform = '';
                event.currentTarget.style.boxShadow = '0px 4px 12px rgba(0, 0, 0, 0.25)';
            }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
        >
            <MdRestaurant style={styles.icon} />
            <p style={styles.tableName}>{table.name}</p>
            <p style={styles.details}>จำนวนที่นั่ง: {table.seats}</p>
            <p style={styles.status}>สถานะ: {table.isAvailable ? 'ว่าง' : 'ไม่ว่าง'}</p>
        </div>
    );
}

export default function MainTablePage() {
    const router = useRouter();
    const [tables, setTables] = useState([
        { id: 1, name: "T001", seats: 4, isAvailable: true },
        { id: 2, name: "T002", seats: 4, isAvailable: true },
        { id: 3, name: "T003", seats: 10, isAvailable: true },
        { id: 4, name: "T004", seats: 10, isAvailable: true },
        { id: 5, name: "T005", seats: 3, isAvailable: true },
        { id: 6, name: "T006", seats: 4, isAvailable: true },
        { id: 7, name: "T007", seats: 4, isAvailable: true },
        { id: 8, name: "T008", seats: 10, isAvailable: true },
        { id: 9, name: "T009", seats: 10, isAvailable: true },
        { id: 10, name: "T010", seats: 3, isAvailable: true },
    ]);

    const handleTableClick = (tableId) => {
        setTables(tables.map(table =>
            table.id === tableId ? { ...table, isAvailable: false } : table
        ));

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
                    {tables.map((table) => (
                        <TableCard
                            key={table.id}
                            table={table}
                            onClick={handleTableClick}
                        />
                    ))}
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
        backgroundColor: '#499cae',
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