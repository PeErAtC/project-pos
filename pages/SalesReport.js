import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BackendSidebar from './components/backendsideber';
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
    FaTimesCircle,
} from 'react-icons/fa';

const api_url = "https://easyapp.clinic/pos-api/api";
const slug = "abc";
const authToken = "R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH";

export default function SalesReport({ initialReportData, initialError }) {
    const [reportData, setReportData] = useState(initialReportData || []);
    const [error, setError] = useState(initialError || null);
    const [dateFilter, setDateFilter] = useState('');
    const [currentItems, setCurrentItems] = useState([]);
    
    const formatDateTimeToThai = (utcDateTime) => {
        if (!utcDateTime) return 'N/A'; // หากไม่มีข้อมูล ให้แสดง "N/A"
        const date = new Date(`${utcDateTime}Z`); // เพิ่ม "Z" เพื่อบอกว่าเป็น UTC
        return date.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }); // แปลงเป็นเวลาประเทศไทย
    };

    const calculateVatDetails = (item) => {
        if (!item || item.vat_per === null || item.vat_per === undefined || parseFloat(item.vat_per) === 0) {
            // กรณีไม่มี VAT หรือ VAT เป็น 0%
            return {
                vatAmount: '0.00',
                vatLabel: 'ไม่มีภาษีมูลค่าเพิ่ม',
            };
        }
    
        const vatPercentage = parseFloat(item.vat_per); // เปลี่ยนค่า vat_per ให้เป็นตัวเลข
        const totalAmount = parseFloat(item.total_amount || 0); // ตรวจสอบว่า total_amount เป็นตัวเลข
        const discount = parseFloat(item.discount || 0); // ตรวจสอบส่วนลด
        const netAmount = parseFloat(item.net_amount || 0); // ตรวจสอบยอดสุทธิ
        const totalAfterDiscount = totalAmount - discount; // ยอดรวมหลังลบส่วนลด
        let vatAmount = 0;
        let vatLabel = '';
    
        if (item.include_vat) {
            // กรณี VAT รวมในยอดแล้ว (Including VAT)
            vatAmount = totalAfterDiscount * vatPercentage / (100 + vatPercentage);
    
            // ตรวจสอบว่ายอดสุทธิรวม VAT หรือไม่
            if (netAmount === totalAfterDiscount) {
                vatLabel = `${vatAmount.toFixed(2)} ฿ (${vatPercentage.toFixed(2)}% Including VAT)`;
            } else {
                vatLabel = `${vatAmount.toFixed(2)} ฿ (${vatPercentage.toFixed(2)}% Exclude VAT)`;
            }
        } else {
            // กรณี VAT แยกออกจากยอด (Exclude VAT)
            vatAmount = totalAfterDiscount * (vatPercentage / 100);
    
            // ตรวจสอบว่ายอดสุทธิรวม VAT หรือไม่
            if (netAmount === totalAfterDiscount + vatAmount) {
                vatLabel = `${vatAmount.toFixed(2)} ฿ (${vatPercentage.toFixed(2)}% Exclude VAT)`;
            } else {
                vatLabel = `${vatAmount.toFixed(2)} ฿ (${vatPercentage.toFixed(2)}% Including VAT)`;
            }
        }
    
        return {
            vatAmount: vatAmount.toFixed(2),
            vatLabel,
        };
    };
    
    
    
    
    

    const fetchReportData = async () => {
        try {
            const ordersResponse = await axios.get(`${api_url}/${slug}/orders`, {
                headers: {
                    Accept: 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
    
            const paymentsResponse = await axios.get(`${api_url}/${slug}/payments`, {
                headers: {
                    Accept: 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
    
            const orders = ordersResponse.data || [];
            const payments = paymentsResponse.data || [];
    
            // เชื่อมโยง pay_channel_id กับ orders
            const ordersWithPayments = orders.map((order) => {
                const payment = payments.find((pay) => pay.order_id === order.id);
                return {
                    ...order,
                    payment_method: payment ? 
                        (payment.pay_channel_id === 1 ? 'เงินสด' : 'QR Code พร้อมเพย์') 
                        : 'N/A',
                };
            });
    
            setReportData(ordersWithPayments);
            setError(null);
        } catch (err) {
            setError('ไม่สามารถเชื่อมต่อกับ API ได้');
            console.error('Error fetching orders or payments:', err);
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
            return response.data;  // ข้อมูลจะต้องอยู่ในรูปของอาเรย์หรือออบเจ็กต์
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
    
            // เพิ่มการตรวจสอบว่าได้รับข้อมูลบิลหรือไม่
            if (!order || !order.items || order.items.length === 0) {
                Swal.fire({
                    title: 'ไม่มีข้อมูล',
                    text: 'ไม่พบข้อมูลสำหรับบิลนี้ หรือบิลนี้ไม่มีรายการสินค้า',
                    icon: 'info',
                    confirmButtonText: 'ปิด',
                });
                return;
            }
    
            console.log('Order details:', order);  // ตรวจสอบข้อมูลที่ดึงมา
    
            // แสดงรายละเอียดในรูปแบบตาราง
            console.log(order.order_number); // ตรวจสอบค่าหมายเลขบิล

            Swal.fire({
                html: `
                    <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; font-size: 14px;">
                        <h4 style="margin-top: 15px; font-size: 20px; font-weight: bold;">รายการสินค้า</h4>
                        <div style="max-height: 208px; overflow-y: auto; margin-bottom: 15px;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead style="position: sticky; top: -1; background-color: #499cae; z-index: 1;">
                                    <tr>
                                        <th style="padding: 5px; color: #fff; border: 1px solid #ddd; font-size: 14px;">หมายเลขบิล</th>
                                        <th style="padding: 5px; color: #fff; border: 1px solid #ddd; font-size: 14px;">รหัสรายการอาหาร</th>
                                        <th style="padding: 5px; color: #fff; border: 1px solid #ddd; font-size: 14px;">รายการ</th>
                                        <th style="padding: 5px; color: #fff; border: 1px solid #ddd; font-size: 14px;">ชื่อสินค้า</th>
                                        <th style="padding: 5px; color: #fff; border: 1px solid #ddd; font-size: 14px;">จำนวน</th>
                                        <th style="padding: 5px; color: #fff; border: 1px solid #ddd; font-size: 14px;">ราคา</th>
                                        <th style="padding: 5px; color: #fff; border: 1px solid #ddd; font-size: 14px;">ส่วนลด</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${order.items.map((item, index) => `
                                        <tr>
                                            <td style="padding: 5px; border: 1px solid #ddd; font-size: 14px;">${item.order_id}</td>
                                            <td style="padding: 5px; border: 1px solid #ddd; font-size: 14px;">${item.product_id}</td>
                                            <td style="padding: 5px; border: 1px solid #ddd; font-size: 14px;">${index + 1}</td>
                                            <td style="padding: 5px; border: 1px solid #ddd; font-size: 14px;">${item.p_name}</td>
                                            <td style="padding: 5px; border: 1px solid #ddd; font-size: 14px;">${item.quantity}</td>
                                            <td style="padding: 5px; border: 1px solid #ddd; font-size: 14px;">${item.price} ฿</td>
                                            <td style="padding: 5px; border: 1px solid #ddd; font-size: 14px;">${item.discount || '0.00'} ฿</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div style="font-size: 16px; font-weight: bold; text-align: right; margin-top: 10px;">
                            <p>ราคารวม: ${order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} ฿</p>
                        </div>
                    </div>
                `,
                confirmButtonText: 'ปิด',
                width: '900px',
                padding: '20px',
                background: '#fff',
                customClass: {
                    container: 'custom-swal-container',
                    title: 'custom-swal-title',
                    htmlContainer: 'custom-swal-html',
                    confirmButton: 'custom-swal-btn',
                    closeButton: 'custom-swal-close-btn'
                },
                didOpen: () => {
                    const confirmButton = document.querySelector('.swal2-confirm');
                    confirmButton.style.fontSize = '14px';
                    confirmButton.style.padding = '14px 40px';
                }
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
                                <th style={styles.th}>ชำระเงินด้วย</th> {/* New Column */}
                                <th style={styles.th}>สถานะ</th>
                                <th style={styles.th}><FaClipboardList /> รายละเอียด</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingOrders.map((order, index) => {
                            const vatDetails = calculateVatDetails(order);
                            return (
                                <tr key={index}>
                                    <td style={styles.td}>{order.order_number}</td>
                                    <td style={styles.td}>{order.tables_id || 'N/A'}</td>
                                    <td style={styles.td}>{formatDateTimeToThai(order.order_date)}</td>
                                    <td style={styles.td}>{order.total_amount}</td>
                                    <td style={styles.td}>{order.discount}</td>
                                    <td style={styles.td}>{vatDetails.vatLabel}</td> {/* ใช้ค่าจากฟังก์ชัน */}
                                    <td style={styles.td}>{order.net_amount} ฿</td>
                                    <td style={styles.td}>{order.payment_method || 'N/A'}</td> {/* Check if payment_method exists */}
                                    <td style={{ ...styles.td, color: '#FF0000', fontWeight: 'bold' }}>
                                        {order.status === 'Y' ? 'ชำระแล้ว' : 'ยังไม่ชำระ'}
                                    </td>
                                    <td style={styles.td}>
                                        <button style={styles.detailsButton} onClick={() => showOrderDetails(order.id)}>ดูรายละเอียด</button>
                                    </td>
                                </tr>
                            );
                            })}
                        </tbody>

                        <tfoot style={{ ...styles.tfoot, position: 'sticky', bottom: 0, zIndex: 1 }}>
                            <tr>
                                <td colSpan="4" style={styles.totalLabel}>รวมยอด:</td>
                                <td style={styles.totalValue}>{pendingOrders.length > 0 ? pendingTotals.totalAmount : "0.00"}</td>
                                <td style={styles.totalValue}>{pendingOrders.length > 0 ? pendingTotals.totalDiscount : "0.00"}</td>
                                <td style={styles.totalValue}>{pendingOrders.length > 0 ? pendingTotals.totalVat : "0.00"}</td>
                                <td style={styles.totalValue}>
                                    {pendingOrders.length > 0
                                        ? (
                                            parseFloat(pendingTotals.totalAmount) -
                                            parseFloat(pendingTotals.totalDiscount) +
                                            parseFloat(pendingTotals.totalVat)
                                        ).toFixed(2)
                                        : "0.00"} ฿
                                </td>
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
                <th style={styles.th}>ชำระเงินด้วย</th>
                <th style={styles.th}><FaCheckCircle /> สถานะ</th>
                <th style={styles.th}><FaClipboardList /> รายละเอียด</th>
            </tr>
        </thead>
        <tbody>
            {paidOrders.map((order, index) => {
                const vatDetails = calculateVatDetails(order); // Updated function
                return (
                    <tr key={index}>
                        <td style={styles.td}>{order.order_number}</td>
                        <td style={styles.td}>{order.tables_id || 'N/A'}</td>
                        <td style={styles.td}>{formatDateTimeToThai(order.created_at)}</td>
                        <td style={styles.td}>{order.total_amount}</td>
                        <td style={styles.td}>{order.discount}</td>
                        <td style={styles.td}>{vatDetails.vatLabel}</td> {/* Updated VAT column */}
                        <td style={styles.td}>{order.net_amount} ฿</td>
                        <td style={styles.td}>{order.payment_method || 'N/A'}</td>
                        <td style={{ ...styles.td, color: '#008000', fontWeight: 'bold' }}>ชำระแล้ว</td>
                        <td style={styles.td}>
                            <button style={styles.detailsButton} onClick={() => showOrderDetails(order.id)}>ดูรายละเอียด</button>
                        </td>
                    </tr>
                );
            })}
        </tbody>
        <tfoot style={{ ...styles.tfoot, position: 'sticky', bottom: 0, backgroundColor: '#fff', zIndex: 1 }}>
            <tr>
                <td colSpan="4" style={styles.totalLabel}>รวมยอด:</td>
                <td style={styles.totalValue}>{paidOrders.length > 0 ? paidTotals.totalAmount : "0.00"}</td>
                <td style={styles.totalValue}>{paidOrders.length > 0 ? paidTotals.totalDiscount : "0.00"}</td>
                <td style={styles.totalValue}>{paidOrders.length > 0 ? paidTotals.totalVat : "0.00"}</td>
                <td style={styles.totalValue}>
                    {paidOrders.length > 0
                        ? (
                            parseFloat(paidTotals.totalAmount) - 
                            parseFloat(paidTotals.totalDiscount) + 
                            parseFloat(paidTotals.totalVat)
                        ).toFixed(2)
                        : "0.00"} ฿
                </td>
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
    totalLabel: { textAlign: 'right', fontWeight: 'bold'  },
    totalValue: { textAlign: 'center', fontWeight: 'bold' },
    detailsButton: { padding: '5px 10px', backgroundColor: '#FFA500', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', flex: 1 },
    tfoot: { position: 'sticky', bottom: 0, backgroundColor: '#fff', height: '40px', borderTop: '2px solid #ddd', zIndex: 10 },
};
