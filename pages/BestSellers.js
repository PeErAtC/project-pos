import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BackendSidebar from './components/backendsidebar'; // แก้ไข path นี้ให้ตรงกับตำแหน่งของ BackendSidebar ของคุณ

export default function BestSellers() {
    const [bestSellers, setBestSellers] = useState([]);
    const [error, setError] = useState(null);

    const fetchBestSellers = async () => {
        try {
            const response = await axios.get('https://easyapp.clinic/pos-api/api/orders', {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
                },
            });
            setBestSellers(response.data);
            setError(null);
        } catch (err) {
            setError("ไม่สามารถเชื่อมต่อกับ API ได้");
            console.error('Error fetching best sellers data:', err);
        }
    };

    useEffect(() => {
        fetchBestSellers();
    }, []);

    return (
        <div style={styles.pageContainer}>
            <div style={styles.sidebarContainer}>
                <BackendSidebar />
            </div>
            <div style={styles.content}>
                <h1 style={styles.title}>สินค้าขายดี</h1>
                {error && <p style={styles.error}>{error}</p>}
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>รหัสสินค้า</th>
                                <th style={styles.th}>ชื่อสินค้า</th>
                                <th style={styles.th}>จำนวนที่ขาย</th>
                                <th style={styles.th}>ยอดขายรวม</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bestSellers.map((product, index) => (
                                <tr key={index}>
                                    <td style={styles.td}>{product.product_code}</td>
                                    <td style={styles.td}>{product.product_name}</td>
                                    <td style={styles.td}>{product.quantity_sold}</td>
                                    <td style={styles.td}>{product.total_sales}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const styles = {
    pageContainer: { display: 'flex' },
    sidebarContainer: { width: '100px' }, // ปรับขนาดให้เข้ากับดีไซน์
    content: { flex: 1, padding: '15px', backgroundColor: '#f9f9f9', },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#000', marginBottom: '20px' },
    tableContainer: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '10px',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '10px', backgroundColor: '#499cae', color: '#fff', textAlign: 'center' },
    td: { padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'center' },
    error: { color: 'red', fontWeight: 'bold' }
};
