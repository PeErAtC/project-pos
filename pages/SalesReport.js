import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BackendSidebar from './components/backendsidebar';
import Swal from 'sweetalert2';
import {
    FaClipboardList,
    FaTable,
    FaCalendarAlt,
    FaDollarSign,
    FaTag,
    FaPercentage,
    FaMoneyBill,
    FaCheckCircle,
    FaTimesCircle
} from 'react-icons/fa';

const api_url = "https://easyapp.clinic/pos-api/api";
const slug = "abc";
const authToken = "R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH";

export default function SalesReport({ initialReportData, initialError }) {
    const [reportData, setReportData] = useState(initialReportData || []);
    const [error, setError] = useState(initialError || null);
    const [dateFilter, setDateFilter] = useState('');
    const [currentItems, setCurrentItems] = useState([]);

    const fetchReportData = async () => {
        try {
            const url = `${api_url}/${slug}/orders`;
            const response = await axios.get(url, {
                headers: {
                    Accept: 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            console.log('Fetched Orders:', response.data);

            if (!response.data || response.data.length === 0) {
                console.error('No orders found in API response');
            }

            setReportData(response.data);
            setError(null);
        } catch (err) {
            setError('ไม่สามารถเชื่อมต่อกับ API ได้');
            console.error('Error fetching orders:', err);
        }
    };

    useEffect(() => {
        fetchReportData();
        const interval = setInterval(fetchReportData, 15000);
        return () => clearInterval(interval);
    }, []);

    const filterByDate = (data) => {
        if (!dateFilter) return data;
        return data.filter(order =>
            new Date(order.order_date).toLocaleDateString('en-CA') === dateFilter
        );
    };

    const fetchOrderDetails = async (orderId) => {
        try {
            const response = await axios.get(`${api_url}/${slug}/orders/${orderId}`, {
                headers: {
                    Accept: 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching order details:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถดึงข้อมูลคำสั่งซื้อได้',
                icon: 'error',
                confirmButtonText: 'ปิด',
            });
            return null;
        }
    };

    const showOrderDetails = async (orderId) => {
        if (!orderId) {
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่มี Order ID',
                icon: 'error',
                confirmButtonText: 'ปิด',
            });
            return;
        }
    
        try {
            const order = await fetchOrderDetails(orderId);
    
            // ดูข้อมูลใน console ว่ามีข้อมูลครบถ้วนหรือไม่
            console.log('Order details:', order);
    
            if (!order || !order.items || order.items.length === 0) {
                Swal.fire({
                    title: 'ไม่มีรายละเอียด',
                    text: 'ไม่มีข้อมูลสินค้าในบิลนี้',
                    icon: 'info',
                    confirmButtonText: 'ปิด',
                });
                return;
            }
    
            // เริ่มต้นการแสดงรายละเอียดใน Swal.fire
            Swal.fire({
                title: `รายละเอียดออเดอร์ #${order.order_number}`,
                html: `
                    <div style="font-family: 'Arial', sans-serif; line-height: 1.5; color: #333; font-size: 14px; overflow-y: auto;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                            <div>
                                <p style="font-weight: bold;">หมายเลขบิล:</p>
                                <p>${order.order_number || 'N/A'}</p>
                            </div>
                            <div>
                                <p style="font-weight: bold;">โต๊ะ:</p>
                                <p>${order.tables_id || 'N/A'}</p>
                            </div>
                            <div>
                                <p style="font-weight: bold;">วันที่:</p>
                                <p>${new Date(order.order_date).toLocaleDateString('th-TH')}</p>
                            </div>
                            <div>
                                <p style="font-weight: bold;">เวลาชำระเงิน:</p>
                                <p>${new Date(order.created_at).toLocaleTimeString('th-TH', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</p>
                            </div>
                            <div>
                                <p style="font-weight: bold;">ยอดรวม:</p>
                                <p>${order.total_amount || '0.00'} ฿</p>
                            </div>
                            <div>
                                <p style="font-weight: bold;">ส่วนลด:</p>
                                <p>${order.discount || '0.00'} ฿</p>
                            </div>
                            <div>
                                <p style="font-weight: bold;">ภาษีมูลค่าเพิ่ม:</p>
                                <p>${order.vat_amt || '0.00'} ฿</p>
                            </div>
                            <div>
                                <p style="font-weight: bold;">ยอดสุทธิ:</p>
                                <p>${order.net_amount || '0.00'} ฿</p>
                            </div>
                        </div>
                        <h4 style="font-size: 16px; font-weight: bold; margin-top: 20px;">รายการสินค้า:</h4>
                        <div style="max-height: 300px; overflow-y: auto; margin-top: 10px;">
                            <ul style="list-style-type: none; padding-left: 0; margin: 0;">
                                ${order.items.map(item => `
                                    <li style="border-bottom: 1px solid #ddd; padding: 10px 0;">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                            <p style="font-weight: bold; color: #444; font-size: 14px; margin: 0;">ชื่อสินค้า:</p>
                                            <p style="font-size: 14px; margin: 0;">${item.p_name}</p>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                            <p style="font-weight: bold; color: #444; font-size: 14px; margin: 0;">จำนวน:</p>
                                            <p style="font-size: 14px; margin: 0;">${item.quantity}</p>
                                        </div>
                                        <div style="display: flex; justify-content: space-between;">
                                            <p style="font-weight: bold; color: #444; font-size: 14px; margin: 0;">ราคา:</p>
                                            <p style="font-size: 14px; margin: 0;">${item.price} ฿</p>
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                `,
                confirmButtonText: 'ปิด',
                width: '900px', // ขนาดที่พอเหมาะ
                padding: '20px',
                background: '#fff',
                customClass: {
                    container: 'custom-swal-container',
                    title: 'custom-swal-title',
                    htmlContainer: 'custom-swal-html',
                    confirmButton: 'custom-swal-btn',
                },
            });
        } catch (error) {
            console.error('Error fetching order details:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถดึงข้อมูลคำสั่งซื้อได้',
                icon: 'error',
                confirmButtonText: 'ปิด',
            });
        }
    };
    
    const calculateTotals = (orders) => {
        const totalAmount = orders.reduce((total, order) => total + parseFloat(order.total_amount || 0), 0).toFixed(2);
        const totalDiscount = orders.reduce((total, order) => total + parseFloat(order.discount || 0), 0).toFixed(2);
        const totalVat = orders.reduce((total, order) => total + parseFloat(order.vat_amt || 0), 0).toFixed(2);
        const totalNet = (totalAmount - totalDiscount).toFixed(2);
        return { totalAmount, totalDiscount, totalVat, totalNet };
    };

    const pendingOrders = filterByDate(reportData).filter(order => order.status !== 'Y').sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
    const paidOrders = filterByDate(reportData).filter(order => order.status === 'Y').sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

    const pendingTotals = calculateTotals(pendingOrders);
    const paidTotals = calculateTotals(paidOrders);

    return (
        <div style={styles.pageContainer}>
            <div style={styles.sidebarContainer}>
                <BackendSidebar />
            </div>
            <div style={styles.content}>
                <div style={styles.headerContainer}>
                    <h1 style={styles.title}>รายงานการขาย</h1>
                    <div style={styles.datePickerContainer}>
                        <label style={styles.dateLabel}>เลือกวัน: </label>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            style={styles.dateInput}
                        />
                    </div>
                </div>
                {error && <p style={styles.error}>{error}</p>}
                <h2 style={styles.subTitle}>
                    รายการที่ยังไม่ชำระ <span style={styles.itemCount}>({pendingOrders.length} รายการ)</span>
                </h2>
                <div style={{ ...styles.tableContainer, backgroundColor: '#fff3f3' }}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}><FaClipboardList /> หมายเลขบิล</th>
                                <th style={styles.th}><FaTable /> โต๊ะ</th>
                                <th style={styles.th}><FaCalendarAlt /> วันที่และเวลา</th>
                                <th style={styles.th}><FaDollarSign /> ยอดรวม</th>
                                <th style={styles.th}><FaTag /> ส่วนลด</th>
                                <th style={styles.th}><FaPercentage /> ภาษีมูลค่าเพิ่ม</th>
                                <th style={styles.th}><FaMoneyBill /> ยอดสุทธิ</th>
                                <th style={styles.th}>สถานะ</th>
                                <th style={styles.th}><FaClipboardList /> รายละเอียด</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingOrders.map((order, index) => (
                                <tr key={index}>
                                    <td style={styles.td}>{order.order_number}</td>
                                    <td style={styles.td}>{order.tables_id || 'N/A'}</td>
                                    <td style={styles.td}>
                                        {new Date(order.order_date).toLocaleDateString('th-TH')} <span style={{ marginLeft: '4px' }} />
                                        {new Date(order.created_at).toLocaleTimeString('th-TH', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td style={styles.td}>{order.total_amount}</td>
                                    <td style={styles.td}>{order.discount}</td>
                                    <td style={styles.td}>{order.vat_amt || 'N/A'}</td>
                                    <td style={styles.td}>{order.net_amount} ฿</td>
                                    <td style={{ ...styles.td, color: '#FF0000', fontWeight: 'bold' }}>
                                        {order.status === 'Y' ? 'ชำระแล้ว' : 'ยังไม่ชำระ'}
                                    </td>
                                    <td style={styles.td}>
                                        <button style={styles.detailsButton} onClick={() => showOrderDetails(order.id)}>ดูรายละเอียด</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot style={{ ...styles.tfoot, position: 'sticky', bottom: 0, zIndex: 1 }}>
                            <tr>
                                <td colSpan="3" style={styles.totalLabel}>รวมยอด:</td>
                                <td style={styles.totalValue}>{pendingOrders.length > 0 ? pendingTotals.totalAmount : "0.00"}</td>
                                <td style={styles.totalValue}>{pendingOrders.length > 0 ? pendingTotals.totalDiscount : "0.00"}</td>
                                <td style={styles.totalValue}>{pendingOrders.length > 0 ? pendingTotals.totalVat : "0.00"}</td>
                                <td style={styles.totalValue}>{pendingOrders.length > 0 ? pendingTotals.totalNet : "0.00"} ฿</td>
                                <td colSpan="2"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <h2 style={styles.subTitle}>
                    รายการที่ชำระแล้ว <span style={styles.itemCount}>({paidOrders.length} รายการ)</span>
                </h2>
                <div style={{ ...styles.tableContainer, backgroundColor: '#f0fff4' }}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}><FaClipboardList /> หมายเลขบิล</th>
                                <th style={styles.th}><FaTable /> โต๊ะ</th>
                                <th style={styles.th}><FaCalendarAlt /> วันที่และเวลา</th>
                                <th style={styles.th}><FaDollarSign /> ยอดรวม</th>
                                <th style={styles.th}><FaTag /> ส่วนลด</th>
                                <th style={styles.th}><FaPercentage /> ภาษีมูลค่าเพิ่ม</th>
                                <th style={styles.th}><FaMoneyBill /> ยอดสุทธิ</th>
                                <th style={styles.th}><FaCheckCircle /> สถานะ</th>
                                <th style={styles.th}><FaClipboardList /> รายละเอียด</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paidOrders.map((order, index) => (
                                <tr key={index}>
                                    <td style={styles.td}>{order.order_number}</td>
                                    <td style={styles.td}>{order.tables_id || 'N/A'}</td>
                                    <td style={styles.td}>
                                        {new Date(order.order_date).toLocaleDateString('th-TH')} <span style={{ marginLeft: '4px' }} />
                                        {new Date(order.created_at).toLocaleTimeString('th-TH', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td style={styles.td}>{order.total_amount}</td>
                                    <td style={styles.td}>{order.discount}</td>
                                    <td style={styles.td}>{order.vat_amt || 'N/A'}</td>
                                    <td style={styles.td}>{order.net_amount} ฿</td>
                                    <td style={{ ...styles.td, color: '#008000', fontWeight: 'bold' }}>ชำระแล้ว</td>
                                    <td style={styles.td}>
                                        <button style={styles.detailsButton} onClick={() => showOrderDetails(order.id)}>ดูรายละเอียด</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot style={{ ...styles.tfoot, position: 'sticky', bottom: 0, backgroundColor: '#f0fff4', zIndex: 1 }}>
                            <tr>
                                <td colSpan="3" style={styles.totalLabel}>รวมยอด:</td>
                                <td style={styles.totalValue}>{paidOrders.length > 0 ? paidTotals.totalAmount : "0.00"}</td>
                                <td style={styles.totalValue}>{paidOrders.length > 0 ? paidTotals.totalDiscount : "0.00"}</td>
                                <td style={styles.totalValue}>{paidOrders.length > 0 ? paidTotals.totalVat : "0.00"}</td>
                                <td style={styles.totalValue}>{paidOrders.length > 0 ? paidTotals.totalNet : "0.00"} ฿</td>
                                <td colSpan="2"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}

const styles = {
    pageContainer: { display: 'flex' },
    content: { flex: 1, padding: '15px', backgroundColor: '#f9f9f9', marginLeft: '100px', overflowY: 'hidden' },
    headerContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#000' },
    datePickerContainer: { display: 'flex', alignItems: 'center' },
    dateLabel: { marginRight: '10px' },
    dateInput: { padding: '8px', border: '1px solid #ccc', borderRadius: '4px' },
    subTitle: { fontSize: '20px', fontWeight: 'bold', color: '#333' },
    itemCount: { fontSize: '16px', color: '#666', marginLeft: '10px' },
    tableContainer: { backgroundColor: '#ffffff', borderRadius: '8px', padding: '0px', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', marginBottom: '20px', resize: 'vertical', overflowY: 'auto', maxHeight: '320px', height: '220px', minHeight: '220px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '5px', backgroundColor: '#499cae', color: '#fff', textAlign: 'center', position: 'sticky', top: 0 },
    td: { padding: '5px', borderBottom: '1px solid #ddd', textAlign: 'center', color: '#333', fontSize: '14px' },
    totalLabel: { textAlign: 'right', fontWeight: 'bold' },
    totalValue: { textAlign: 'center', fontWeight: 'bold' },
    detailsButton: { padding: '5px 10px', backgroundColor: '#FFA500', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', flex: 1 },
    tfoot: { position: 'sticky', bottom: 0, backgroundColor: '#f0fff4', height: '40px', borderTop: '2px solid #ddd', zIndex: 10 },
};
