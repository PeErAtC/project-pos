    // นำเข้า React, useState, useEffect สำหรับการจัดการสถานะและ Lifecycle ของ Component
    import React, { useState, useEffect } from 'react';
    // นำเข้า axios สำหรับการดึงข้อมูล API
    import axios from 'axios';
    // นำเข้า BackendSidebar ซึ่งเป็น Component สำหรับ Sidebar
    import BackendSidebar from './components/backendsidebar';
    // นำเข้า SweetAlert2 สำหรับการแจ้งเตือนแบบ Popup
    import Swal from 'sweetalert2';
    // นำเข้าไอคอนต่าง ๆ จาก react-icons สำหรับตกแต่ง UI
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

    
    export default function SalesReport({ initialReportData, initialError }) {
        // การใช้ useState สำหรับสถานะของข้อมูล รายงาน, ข้อผิดพลาด และตัวกรองวันที่
        const [reportData, setReportData] = useState(initialReportData || []);
        const [error, setError] = useState(initialError || null);
        const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]); // Set initial date to current date
        const [currentItems, setCurrentItems] = useState([]);

        // ฟังก์ชันสำหรับแปลงวันที่และเวลาให้อยู่ในรูปแบบของประเทศไทย
        const formatDateTimeToThai = (utcDateTime) => {
            if (!utcDateTime) return 'N/A';
            const date = new Date(`${utcDateTime}T00:00:00Z`); // เพิ่มเวลาเริ่มต้น
            return date.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
        };

        // ฟังก์ชันสำหรับดึงข้อมูลการชำระเงินตาม Order ID
            const fetchPaymentHistory = async (orderId) => {
                try {

                    //////////////////// ประกาศตัวแปร URL CALL   
                    const api_url =  localStorage.getItem('url_api'); 
                    const slug = localStorage.getItem('slug');
                    const authToken = localStorage.getItem('token');
                    //////////////////// ประกาศตัวแปร  END URL CALL 
                    const response = await axios.get(`${api_url}/${slug}/payments`, {
                        headers: {
                            Accept: 'application/json',
                            Authorization: `Bearer ${authToken}`,
                        },
                    });
        
                    const payments = response.data || [];
                    return payments.filter(payment => payment.order_id === orderId);
                } catch (error) {
                    console.error('Error fetching payment history:', error);
                    return [];
                }
            };

            // ฟังก์ชันสำหรับคำนวณรายละเอียด VAT
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
            const api_url = localStorage.getItem('url_api');
            const slug = localStorage.getItem('slug');
            const authToken = localStorage.getItem('token');
        
            if (!authToken) {
                Swal.fire({
                    title: 'ไม่ได้เข้าสู่ระบบ',
                    text: 'กรุณาเข้าสู่ระบบก่อนใช้งาน',
                    icon: 'warning',
                    confirmButtonText: 'ตกลง',
                }).then(() => {
                    window.location.href = '/login'; // Redirect ไปยังหน้า Login
                });
                return;
            }
        
            try {
                const ordersResponse = await axios.get(`${api_url}/${slug}/orders`, {
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${authToken}`,
                    },
                });
        
                const tablesResponse = await axios.get(`${api_url}/${slug}/table_codes`, {
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${authToken}`,
                    },
                });
        
                const paymentsResponse = await axios.get(`${api_url}/${slug}/payments`, {
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${authToken}`,
                    },
                });
        
                const orders = ordersResponse.data || [];
                const tables = tablesResponse.data || [];
                const payments = paymentsResponse.data || [];
        
                // สร้าง mapping สำหรับ table_id -> table_code
                const tableMapping = {};
                tables.forEach((table) => {
                    tableMapping[table.id] = table.table_code;
                });
        
                // เชื่อมโยงข้อมูล table_code และ payment_method กับ orders
                const ordersWithDetails = orders.map((order) => {
                    const payment = payments.find((pay) => pay.order_id === order.id);
                    return {
                        ...order,
                        table_code: tableMapping[order.tables_id] || `Unknown (${order.tables_id})`, // เพิ่ม table_code
                        payment_method: payment
                            ? payment.pay_channel_id === 1
                                ? 'เงินสด'
                                : payment.pay_channel_id === 2
                                ? 'QR Code พร้อมเพย์'
                                : 'อื่นๆ'
                            : 'รอชำระ', // เพิ่ม payment_method
                    };
                });
        
                setReportData(ordersWithDetails);
                setError(null);
            } catch (err) {
                setError('ไม่สามารถเชื่อมต่อกับ API ได้');
                console.error('Error fetching orders, tables, or payments:', err);
            }
        };
        
        // ใช้ useEffect สำหรับดึงข้อมูลรายงานครั้งแรกและตั้งค่า Refresh ทุก 15 วินาที
        useEffect(() => {
            fetchReportData();
            const interval = setInterval(fetchReportData, 15000);
            return () => clearInterval(interval);
        }, []);

        // ฟังก์ชันกรองข้อมูลตามวันที่ที่เลือก
        const filterByDate = (data) => {
            if (!dateFilter) return data;
            return data.filter(order =>
                new Date(order.order_date).toLocaleDateString('en-CA') === dateFilter
            );
        };

        // ฟังก์ชันแสดงรายละเอียด Order พร้อม Popup
        const fetchOrderDetails = async (orderId) => {
            try {
                //////////////////// ประกาศตัวแปร URL CALL   
            const api_url =  localStorage.getItem('url_api'); 
            const slug = localStorage.getItem('slug');
            const authToken = localStorage.getItem('token');
            //////////////////// ประกาศตัวแปร  END URL CALL 
                const response = await axios.get(`${api_url}/${slug}/orders/${orderId}`, {
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${authToken}`,
                    },
                });
        
                console.log('Order Details:', response.data); // เพิ่ม log เพื่อตรวจสอบโครงสร้างข้อมูล
        
                if (response.data && response.data.items) {
                    return response.data; // ส่งข้อมูลทั้งหมดกลับ
                } else {
                    throw new Error('ไม่พบข้อมูลรายการสินค้าของออเดอร์นี้');
                }
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
        
                if (!order || !order.items || order.items.length === 0) {
                    Swal.fire({
                        title: 'ไม่มีข้อมูล',
                        text: 'ไม่พบข้อมูลสำหรับบิลนี้ หรือบิลนี้ไม่มีรายการสินค้า',
                        icon: 'info',
                        confirmButtonText: 'ปิด',
                    });
                    return;
                }
        
                // คำนวณราคารวมสินค้า
                const totalPrice = order.items.reduce((sum, item) => {
                    const price = parseFloat(item.price) || 0;
                    const discount = parseFloat(item.discount) || 0;
                    const itemTotal = (price - discount) * item.quantity;
                    return sum + itemTotal;
                }, 0);
        
                // สร้างตารางสินค้า
                const itemsTableHTML = `
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="position: sticky; top: 0; background-color: #499cae; color: #fff;">
                            <tr>
                                <th style="padding: 5px; border: 1px solid #ddd;">ลำดับ</th>
                                <th style="padding: 5px; border: 1px solid #ddd;">เลขบิล</th>
                                <th style="padding: 5px; border: 1px solid #ddd;">ชื่อสินค้า</th>
                                <th style="padding: 5px; border: 1px solid #ddd;">จำนวน</th>
                                <th style="padding: 5px; border: 1px solid #ddd;">ราคา</th>
                                <th style="padding: 5px; border: 1px solid #ddd;">ราคารวม</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map((item, index) => {
                                const price = parseFloat(item.price) || 0;
                                const quantity = parseInt(item.quantity) || 0;
                                const totalPrice = price * quantity;
        
                                return `
                                    <tr>
                                        <td style="padding: 5px; border: 1px solid #ddd;">${index + 1}</td>
                                        <td style="padding: 5px; border: 1px solid #ddd;">${item.order_id}</td>
                                        <td style="padding: 5px; border: 1px solid #ddd;">${item.p_name}</td>
                                        <td style="padding: 5px; border: 1px solid #ddd;">${quantity}</td>
                                        <td style="padding: 5px; border: 1px solid #ddd;">${price.toFixed(2)} ฿</td>
                                        <td style="padding: 5px; border: 1px solid #ddd;">${totalPrice.toFixed(2)} ฿</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `;
        
                // สร้างตารางประวัติการชำระเงิน (พร้อมแสดงโครงสร้างตารางเสมอ)
                const payments = order.payments || [];
                const paymentHistoryTableHTML = `
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                        <thead style="position: sticky; top: 0; background-color: #499cae; color: #fff;">
                            <tr>
                                <th style="padding: 5px; border: 1px solid #ddd;">แยกชำระ</th>
                                <th style="padding: 5px; border: 1px solid #ddd;">วิธีการชำระ</th>
                                <th style="padding: 5px; border: 1px solid #ddd;">วันที่ชำระ</th>
                                <th style="padding: 5px; border: 1px solid #ddd;">หมายเหตุ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payments.length > 0
                                ? payments.map((payment) => `
                                    <tr>
                                        <td style="padding: 5px; border: 1px solid #ddd;">${payment.payment_date ? formatDateTimeToThai(payment.payment_date) : 'N/A'}</td>
                                        <td style="padding: 5px; border: 1px solid #ddd;">${payment.split_payment ? 'แยกชำระ' : 'N/A'}</td>
                                        <td style="padding: 5px; border: 1px solid #ddd;">${payment.method === 'qr_code' ? 'QR Code พร้อมเพย์' : payment.method === 'cash' ? 'เงินสด' : 'N/A'}</td>
                                        <td style="padding: 5px; border: 1px solid #ddd;">${payment.amount ? parseFloat(payment.amount).toFixed(2) : 'N/A'} ฿</td>
                                        <td style="padding: 5px; border: 1px solid #ddd;">${payment.notes || 'N/A'}</td>
                                    </tr>
                                `).join('')
                                : `
                                    <tr>
                                        <td colspan="5" style="padding: 5px; border: 1px solid #ddd; text-align: center; color: #888;">
                                            ไม่มีข้อมูลการชำระเงิน
                                        </td>
                                    </tr>
                                `}
                        </tbody>
                    </table>
                `;
                // แสดงผลใน SweetAlert
                Swal.fire({
                    html: `
                        <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; font-size: 14px;">
                            <h4 style="font-size: 20px; font-weight: bold;">รายการสินค้า</h4>
                            <div style="max-height: 208px; overflow-y: auto; margin-bottom: 15px;">
                                ${itemsTableHTML}
                            </div>
                            <div style="font-size: 16px; font-weight: bold; text-align: right; margin-top: 10px;">
                                <p>ราคารวม: ${totalPrice.toFixed(2)} ฿</p>
                            </div>
                            <h4 style="font-size: 20px; font-weight: bold; margin-top: 20px;">ประวัติการชำระเงิน</h4>
                            <div style="max-height: 150px; overflow-y: auto;">
                                ${paymentHistoryTableHTML}
                            </div>
                        </div>
                    `,
                    confirmButtonText: 'ปิด',
                    width: '900px',
                    padding: '20px',
                    background: '#fff',
                });
            } catch (error) {
                console.error('Error showing order details:', error);
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
                                    <th style={styles.th}> หมายเลขบิล</th>
                                    <th style={styles.th}>โต๊ะ</th>
                                    <th style={styles.th}>วันที่และเวลา</th>
                                    <th style={styles.th}>ยอดรวม</th>
                                    <th style={styles.th}>ส่วนลด</th>
                                    <th style={styles.th}>ภาษีมูลค่าเพิ่ม</th>
                                    <th style={styles.th}>ยอดสุทธิ</th>
                                    <th style={styles.th}>ชำระเงินด้วย</th> {/* New Column */}
                                    <th style={styles.th}>สถานะ</th>
                                    <th style={styles.th}>รายละเอียด</th>
                                </tr>
                            </thead>
                            <tbody>
                            {pendingOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="10" style={{ textAlign: 'center', color: '#999' }}>ไม่มีบิลที่ตรงกับวันที่ที่เลือก</td>
                                </tr>
                            ) : (
                                pendingOrders.map((order, index) => (
                                    <tr key={index}>
                                        <td style={styles.td}>{order.order_number}</td>
                                        <td style={styles.td}>{order.table_code === 'CT001' ? 'หน้าขาย' : order.table_code || 'N/A'}</td>
                                        <td style={styles.td}>{formatDateTimeToThai(order.order_date)}</td>
                                        <td style={styles.td}>{order.total_amount}</td>
                                        <td style={styles.td}>{order.discount}</td>
                                        <td style={styles.td}>{calculateVatDetails(order).vatLabel}</td>
                                        <td style={styles.td}>{order.net_amount} ฿</td>
                                        <td style={styles.td}>{order.payment_method || 'N/A'}</td>
                                        <td style={{ ...styles.td, color: '#FF0000', fontWeight: 'bold' }}>{order.status === 'Y' ? 'ชำระแล้ว' : 'ยังไม่ชำระ'}</td>
                                        <td style={styles.td}>
                                            <button style={styles.detailsButton} onClick={() => showOrderDetails(order.id)}>ดูรายละเอียด</button>
                                        </td>
                                    </tr>
                                ))
                            )}
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
                                    <th style={styles.th}>หมายเลขบิล</th>
                                    <th style={styles.th}>โต๊ะ</th>
                                    <th style={styles.th}>วันที่และเวลา</th>
                                    <th style={styles.th}>ยอดรวม</th>
                                    <th style={styles.th}>ส่วนลด</th>
                                    <th style={styles.th}>ภาษีมูลค่าเพิ่ม</th>
                                    <th style={styles.th}>ยอดสุทธิ</th>
                                    <th style={styles.th}>ชำระเงินด้วย</th>
                                    <th style={styles.th}>สถานะ</th>
                                    <th style={styles.th}>รายละเอียด</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paidOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" style={{ textAlign: 'center', color: '#999' }}>ไม่มีบิลที่ตรงกับวันที่ที่เลือก</td>
                                    </tr>
                                ) : (
                                    paidOrders.map((order, index) => (
                                        <tr key={index}>
                                            <td style={styles.td}>{order.order_number}</td>
                                            <td style={styles.td}>{order.table_code === 'CT001' ? 'หน้าขาย' : order.table_code || 'N/A'}</td>
                                            <td style={styles.td}>{formatDateTimeToThai(order.order_date)}</td>
                                            <td style={styles.td}>{order.total_amount}</td>
                                            <td style={styles.td}>{order.discount}</td>
                                            <td style={styles.td}>{calculateVatDetails(order).vatLabel}</td>
                                            <td style={styles.td}>{order.net_amount} ฿</td>
                                            <td style={styles.td}>{order.payment_method || 'N/A'}</td> {/* ใช้ payment_method */}
                                            <td style={{ ...styles.td, color: '#008000', fontWeight: 'bold' }}>ชำระแล้ว</td>
                                            <td style={styles.td}>
                                                <button style={styles.detailsButton} onClick={() => showOrderDetails(order.id)}>ดูรายละเอียด</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
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
        content: { flex: 1, padding: '25px', backgroundColor: '#f9f9f9', marginLeft: '110px', overflowY: 'hidden' },
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
