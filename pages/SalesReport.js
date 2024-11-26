import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BackendSidebar from './components/backendsideber';
import Swal from 'sweetalert2';
import { FaClipboardList, FaTable, FaCalendarAlt, FaDollarSign, FaTag, FaPercentage, FaMoneyBill, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const api_url = "https://easyapp.clinic/pos-api/api";
const slug = "abc";

export default function SalesReport({ initialReportData, initialError }) {
    const [reportData, setReportData] = useState(initialReportData || []);
    const [error, setError] = useState(initialError || null);
    const [dateFilter, setDateFilter] = useState('');
    const [currentItems, setCurrentItems] = useState([]);


    const fetchReportData = async () => {
        try {
            const url = `${api_url}/${slug}/orders`; // API endpoint สำหรับคำสั่งซื้อ
            const response = await axios.get(url, {
                headers: {
                    Accept: 'application/json',
                    Authorization: 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
                },
            });
    
            // ตรวจสอบข้อมูล
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
        const interval = setInterval(fetchReportData, 15000); // เพิ่มเวลา Refresh เป็น 15 วินาที
        return () => clearInterval(interval);
    }, []);

    const filterByDate = (data) => {
        if (!dateFilter) return data;
        return data.filter(order =>
            new Date(order.order_date).toLocaleDateString('en-CA') === dateFilter
        );
    };
    const handleEditOrder = async (orderId) => {
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
    
            if (!order || !order.items || order.items.length === 0) {
                Swal.fire({
                    title: 'ไม่มีรายการ',
                    text: 'ไม่สามารถแก้ไขรายการออเดอร์นี้ได้ เนื่องจากไม่มีสินค้า',
                    icon: 'info',
                    confirmButtonText: 'ปิด',
                });
                return;
            }
    
            // เปิดหน้าต่างแก้ไข หรือแสดงฟอร์มแก้ไขออเดอร์
            Swal.fire({
                title: 'แก้ไขออเดอร์',
                html: `
                    <div style="text-align: left;">
                        <label>หมายเลขบิล: ${order.order_number}</label>
                        <div id="order-items-edit"></div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'บันทึก',
                cancelButtonText: 'ยกเลิก',
                preConfirm: async () => {
                    // คุณสามารถเพิ่มตรรกะในการตรวจสอบหรืออัปเดตข้อมูลที่นี่
                    return true;
                },
            });
    
            // แสดงรายการสินค้าในคำสั่งซื้อเพื่อแก้ไข
            const container = document.getElementById('order-items-edit');
            if (container) {
                order.items.forEach((item) => {
                    const itemElement = document.createElement('div');
                    itemElement.innerHTML = `
                        <div style="margin-bottom: 10px;">
                            <strong>${item.p_name}</strong>
                            <input type="number" value="${item.quantity}" style="margin-left: 10px; width: 50px;" />
                            <label style="margin-left: 10px;">${item.price.toFixed(2)} บาท</label>
                        </div>
                    `;
                    container.appendChild(itemElement);
                });
            }
        } catch (error) {
            console.error('Error fetching order details for editing:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถแก้ไขออเดอร์นี้ได้',
                icon: 'error',
                confirmButtonText: 'ปิด',
            });
        }
    };
    
    const fetchOrderDetails = async (orderId) => {
        try {
            const orderResponse = await axios.get(`${api_url}/${slug}/orders/${orderId}`, {
                headers: {
                    Accept: 'application/json',
                    Authorization: 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
                },
            });
    
            const itemsResponse = await axios.get(`${api_url}/${slug}/order_items?order_id=${orderId}`, {
                headers: {
                    Accept: 'application/json',
                    Authorization: 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
                },
            });
    
            console.log('Order Details:', {
                order: orderResponse.data,
                items: itemsResponse.data,
            });
    
            if (!itemsResponse.data || itemsResponse.data.length === 0) {
                Swal.fire({
                    title: 'ไม่มีสินค้า',
                    text: 'ไม่มีรายการสินค้าในบิลนี้',
                    icon: 'info',
                    confirmButtonText: 'ปิด',
                });
                return null;
            }
    
            return { ...orderResponse.data, items: itemsResponse.data };
        } catch (error) {
            console.error('Error fetching order details:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถดึงข้อมูลสินค้าได้ กรุณาลองอีกครั้ง หรือแจ้งผู้ดูแลระบบ',
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
    
            if (!order || !order.items || order.items.length === 0) {
                Swal.fire({
                    title: 'ไม่มีรายละเอียด',
                    text: 'ไม่มีข้อมูลสินค้าในบิลนี้',
                    icon: 'info',
                    confirmButtonText: 'ปิด',
                });
                return;
            }
    
            // อัปเดต currentItems เพื่อแสดงในหน้าเว็บ
            setCurrentItems(order.items);
        } catch (error) {
            console.error('Error fetching order details:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถดึงข้อมูลสินค้าได้ กรุณาลองอีกครั้ง หรือแจ้งผู้ดูแลระบบ',
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
                                                    <button style={styles.editButton} onClick={() => handleEditOrder(order.id)}>แก้ไขออเดอร์</button>
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
    detailsButton: {
        padding: '5px 10px',
        backgroundColor: '#FFA500',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        flex: 1, // ให้ปุ่มใช้พื้นที่เท่ากัน
        maxWidth: '120px', // จำกัดความกว้างสูงสุด
        minWidth: '80px', // กำหนดความกว้างขั้นต่ำ
        margin: '5px', // ระยะห่างระหว่างปุ่ม
    },
    totalContainer: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' },
    tfoot: {
        position: 'sticky', // ช่วยให้แถวรวมยอดล็อคอยู่ที่ด้านล่าง
        bottom: 0, // ระบุตำแหน่งให้ชิดด้านล่างของ container
        backgroundColor: '#f0fff4', // สีพื้นหลังเพื่อแยกความชัดเจน
        height: '40px', // ความสูงของแถว
        borderTop: '2px solid #ddd', // ขอบด้านบนเพื่อแยกแถว
        zIndex: 10, // ความสำคัญให้แถวอยู่เหนือข้อมูลอื่นในตาราง
    },
    minHeight: '300px', // ตั้งค่าให้มีความสูงขั้นต่ำเสมอ
    maxHeight: '500px', // หรือกำหนดความสูงสูงสุด
    editButton: {
        padding: '5px 10px',
        backgroundColor: '#4CAF50',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        flex: 1, // ให้ปุ่มใช้พื้นที่เท่ากัน
        maxWidth: '120px', // จำกัดความกว้างสูงสุด
        minWidth: '80px', // กำหนดความกว้างขั้นต่ำ
        margin: '5px', // ระยะห่างระหว่างปุ่ม
    },
    
};
