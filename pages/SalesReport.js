import React, { useState, useEffect } from 'react';
//import config from './config';  
import axios from 'axios';
import BackendSidebar from './components/backendsidebar';
import Swal from 'sweetalert2';

    export default function SalesReport({ initialReportData, initialError }) {
        // การใช้ useState สำหรับสถานะของข้อมูล รายงาน, ข้อผิดพลาด และตัวกรองวันที่
        const [reportData, setReportData] = useState(initialReportData || []);
        const [error, setError] = useState(initialError || null);
        const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]); // Set initial date to current date
        const [searchOrderNumber, setSearchOrderNumber] = useState(''); // New state for search input
        const [currentItems, setCurrentItems] = useState([]);

        // ฟังก์ชันกรองข้อมูลตามเลขบิล (จะค้นหาทุกๆ บิลไม่สนใจวันที่)
        const filterBySearchOrderNumber = (data, searchOrderNumber) => {
            if (!searchOrderNumber) return data; // หากไม่มีการกรอกเลขบิล จะไม่กรอง
            return data.filter(order => {
                const orderNumber = order.order_number.trim();
                return orderNumber.includes(searchOrderNumber.trim()); // ค้นหาตรงเลขบิล
            });
        };
        
                // ฟังก์ชันกรองข้อมูลตามวันที่ที่เลือก
        const filterByDate = (data) => {
            if (!dateFilter) return data; // หากไม่มีวันที่เลือก จะไม่กรอง
            return data.filter(order =>
                new Date(order.order_date).toLocaleDateString('en-CA') === dateFilter // กรองตามวันที่ที่เลือก
            );
        };

        // ฟังก์ชันกรองข้อมูลที่รวมทั้งการกรองตามวันที่และเลขบิล
        const filterData = (data) => {
            // กรองตามเลขบิล
            let filteredData = filterBySearchOrderNumber(data, searchOrderNumber);

            // กรองตามวันที่
            filteredData = filterByDate(filteredData);

            return filteredData;
        };  

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
        
        useEffect(() => {
            fetchReportData();
            const interval = setInterval(fetchReportData, 30000);
            return () => clearInterval(interval);
        }, []);
        
        const fetchPaymentHistoryByOrderId = async (orderId) => {
            try {
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
                        window.location.href = '/login';
                    });
                    return;
                }
        
                const response = await axios.get(`${api_url}/${slug}/payments/${orderId}/list`, {
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${authToken}`,
                    },
                });
                
                console.log("Payment Data:", response.data); // ตรวจสอบข้อมูลการชำระเงินที่ได้จาก API
                return response.data || [];
            } catch (error) {
                console.error('Error fetching payment history:', error);
                Swal.fire({
                    title: 'เกิดข้อผิดพลาด',
                    text: 'ไม่สามารถดึงข้อมูลการชำระเงินได้',
                    icon: 'error',
                    confirmButtonText: 'ปิด',
                });
                return [];
            }
        };        

        // ฟังก์ชันแสดงรายละเอียด Order พร้อม Popup
    const fetchOrderDetails = async (orderId) => {
        try {
            const api_url = localStorage.getItem('url_api');
            const slug = localStorage.getItem('slug');
            const authToken = localStorage.getItem('token');

            // ดึงข้อมูลคำสั่งซื้อ
            const orderResponse = await axios.get(`${api_url}/${slug}/orders/${orderId}`, {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
            });

            // ดึงข้อมูลการชำระเงินโดยใช้ API ใหม่ /payments/{order_id}/list
            const paymentResponse = await axios.get(`${api_url}/${slug}/payments/${orderId}/list`, {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
            });

            console.log('Order Details:', orderResponse.data);
            console.log('Payment Details:', paymentResponse.data);

            if (orderResponse.data && orderResponse.data.items) {
                return { order: orderResponse.data, payments: paymentResponse.data }; // ส่งข้อมูลคำสั่งซื้อและการชำระเงินกลับ
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

    // ฟังก์ชันแสดงรายละเอียดคำสั่งซื้อ
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
        const orderDetails = await fetchOrderDetails(orderId);

        if (!orderDetails || !orderDetails.order || !orderDetails.order.items || orderDetails.order.items.length === 0) {
            Swal.fire({
                title: 'ไม่มีข้อมูล',
                text: 'ไม่พบข้อมูลสำหรับบิลนี้ หรือบิลนี้ไม่มีรายการสินค้า',
                icon: 'info',
                confirmButtonText: 'ปิด',
            });
            return;
        }
        // ฟังก์ชันคำนวณยอดรวมสินค้า
        const calculateItemTotals = (items) => {
            let totalQuantity = 0;
            let totalAmount = 0; 
            items.forEach(item => {
                totalQuantity += item.quantity;
                totalAmount += item.price * item.quantity;
            });
            return { totalQuantity, totalAmount }; 
        };

        // คำนวณยอดรวมสินค้า
        const { totalQuantity, totalAmount } = calculateItemTotals(orderDetails.order.items);

        // สร้างตารางสินค้า
        const itemsTableHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="position: sticky; top: -2; background-color: #499cae; color: #fff;">
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

                    ${orderDetails.order.items.map((item, index) => {
                    const price = parseFloat(item.price) || 0;
                    const quantity = parseInt(item.quantity) || 0;
                    const totalAmountPerItem = price * quantity;  
                    
                    return `
                        <tr>
                            <td style="padding: 5px; border: 1px solid #ddd;">${index + 1}</td>
                            <td style="padding: 5px; border: 1px solid #ddd;">${item.order_id}</td>
                            <td style="padding: 5px; border: 1px solid #ddd;">${item.p_name}</td>
                            <td style="padding: 5px; border: 1px solid #ddd;">${quantity}</td>
                            <td style="padding: 5px; border: 1px solid #ddd;">${price.toFixed(2)} ฿</td>
                            <td style="padding: 5px; border: 1px solid #ddd;">${totalAmountPerItem.toFixed(2)} ฿</td>
                        </tr>
                    `;
                    }).join('')}
                </tbody>
                <tfoot style="background-color: #f8f8f8; font-weight: bold; position: sticky; bottom: -1; z-index: 2;">
                    <tr>
                        <td colspan="3" style="padding: 5px; border: 1px solid #ddd; text-align: right;">สินค้าทั้งหมด:</td>
                        <td style="padding: 5px; border: 1px solid #ddd; text-align: center;">${totalQuantity} ชิ้น</td>
                        <td colspan="1" style="padding: 5px; border: 1px solid #ddd; text-align: right;">รวมทั้งหมด:</td>
                        <td style="padding: 5px; border: 1px solid #ddd;">${totalAmount.toFixed(2)} ฿</td>
                    </tr>
                </tfoot>
            </table>
        `;
        // แสดงผลใน SweetAlert
        Swal.fire({
            html: `
                <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; font-size: 14px;">
                    <h4 style="font-size: 20px; font-weight: bold;">รายการสินค้า</h4>
                    <div style="max-height: 300px; overflow-y: auto; margin-bottom: 15px;">
                        ${itemsTableHTML}
                    </div>
                </div>
            `,
            confirmButtonText: 'ปิด',
            width: '900px',
            padding: '20px',
            background: '#fff',
        });
        // สร้างตารางประวัติการชำระเงิน
        const payments = orderDetails?.payments || [];
        // คำนวณยอดคงเหลือหลังจากการชำระเงินแต่ละครั้ง
        let remainingBalance = orderDetails.order.total_amount;  // เริ่มจากยอดรวมทั้งหมด

        const totalIccome = payments.reduce((sum, p) => sum + (p.icome ? parseFloat(p.icome) : 0), 0);
        const totalMoneyChanges = payments.reduce((sum, p) => sum + (p.money_changes ? parseFloat(p.money_changes) : 0), 0);

        const totalAmountPaid = payments
            .map(p => p.amount ? parseFloat(p.amount) : 0)
            .reduce((sum, value) => sum + value, 0);
        const paymentHistoryTableHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead style="position: sticky; top: 0; background-color: #499cae; color: #fff;">
                    <tr>
                        <th style="padding: 5px; border: 1px solid #ddd;">ลำดับ</th>
                        <th style="padding: 5px; border: 1px solid #ddd;">แยกชำระ</th>
                        <th style="padding: 5px; border: 1px solid #ddd;">รับเงิน</th>
                        <th style="padding: 5px; border: 1px solid #ddd;">วิธีการชำระ</th>
                        <th style="padding: 5px; border: 1px solid #ddd;">วันที่ชำระ</th>
                        <th style="padding: 5px; border: 1px solid #ddd;">ยอดคงเหลือ</th>
                        <th style="padding: 5px; border: 1px solid #ddd;">เงินทอน</th>
                    </tr>
                </thead>
                <tbody>
                    ${
                        payments.length > 0
                            ? payments.map((payment, index) => {
                                return `
                                    <tr>
                                        <td style="padding: 5px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
                                        <td style="padding: 5px; border: 1px solid #ddd;">${payment.amount ? payment.amount + " ฿" : '0 ฿'}</td>
                                        <td style="padding: 5px; border: 1px solid #ddd;">${payment.icome ? payment.icome + " ฿" : '0 ฿'}</td>
                                        <td style="padding: 5px; border: 1px solid #ddd;">${payment.pay_channel_id === 1 ? 'เงินสด' : payment.pay_channel_id === 2 ? 'QR Code พร้อมเพย์' : 'อื่นๆ'}</td>
                                        <td style="padding: 5px; border: 1px solid #ddd;">${payment.payment_date ? formatDateTimeToThai(payment.payment_date) : 'N/A'}</td>
                                        <td style="padding: 5px; border: 1px solid #ddd;">${payment.balances ? payment.balances + " ฿" : "0 ฿"}</td> 
                                        <td style="padding: 5px; border: 1px solid #ddd;">${payment.money_changes ? payment.money_changes + " ฿" : '0 ฿'}</td>
                                    </tr>
                                `;
                            }).join('')
                            : `
                                <tr>
                                    <td colspan="7" style="padding: 5px; border: 1px solid #ddd; text-align: center; color: #888;">ไม่มีข้อมูลการชำระเงิน</td>
                                </tr>
                            `
                    }
                    </tbody>
                    <tfoot style="background-color: #f8f8f8; font-weight: bold; position: sticky; bottom: 0; z-index: 2;">
                    <tr>
                        <td colspan="2" style="padding: 5px; border: 1px solid #ddd; text-align: right;"> รวมยอดแยกชำระ: </td>
                        <td style="padding: 5px; border: 1px solid #ddd;">${totalAmountPaid.toFixed(2)} ฿ </td>
                        <td colspan="1" style="padding: 5px; border: 1px solid #ddd;"></td>
                        <td colspan="2" style="padding: 5px; border: 1px solid #ddd; text-align: right;">**เงินทอน:**</td>
                        <td style="padding: 5px; border: 1px solid #ddd;">${totalMoneyChanges.toFixed(2)} ฿</td>
                    </tr>
                </tfoot>
            </table>
        `;
                // แสดงผลใน SweetAlert
                Swal.fire({
                    html: `
                        <div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; font-size: 14px;">
                            <h4 style="font-size: 20px; font-weight: bold;">รายการสินค้า</h4>
                            <div style="max-height: 208px; overflow-y: auto; margin-bottom: 15px;">${itemsTableHTML}</div>
                            <h4 style="font-size: 20px; font-weight: bold; margin-top: 10px;">ประวัติการชำระเงิน</h4>
                            <div style="max-height: 150px; overflow-y: auto;">${paymentHistoryTableHTML}</div>
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

        // ใช้ใน `pendingOrders` และ `paidOrders`
        const pendingOrders = filterData(reportData)
            .filter(order => order.status !== 'Y')
            .sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

        const paidOrders = filterData(reportData)
            .filter(order => order.status === 'Y')
            .sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

        const cancelledOrders = filterData(reportData)
            .filter(order => order.status === 'C')  // ยกเลิกบิล
            .sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

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
                        <div style={styles.dateSearchContainer}>
                            <div style={styles.datePickerContainer}>
                                <label style={styles.dateLabel}>เลือกวัน: </label>
                                <input
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    style={styles.dateInput}
                                />
                            </div>
                            <div style={styles.searchContainer}>
                                <label style={styles.searchLabel}>ค้นหาบิล: </label>
                                <input
                                    type="text"
                                    value={searchOrderNumber}
                                    onChange={(e) => setSearchOrderNumber(e.target.value)}
                                    placeholder="กรอกหมายเลขบิล"
                                    style={styles.searchInput}
                                />
                            </div>
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
                                        <td
                                        style={{
                                            ...styles.td,
                                            color: order.status === 'C' ? '#000' : order.status === 'Y' ? '#008000' : '#FF0000',
                                            fontWeight: 'bold',
                                        }}
                                        >
                                        {order.status === 'C' ? 'ยกเลิก' : order.status === 'Y' ? 'ชำระแล้ว' : 'ยังไม่ชำระ'}
                                        </td>
                                        <td style={styles.td}>
                                        <button style={styles.detailsButton} onClick={() => showOrderDetails(order.id)}>ดูรายละเอียด</button>
                                        </td>
                                    </tr>
                                    ))
                                )}
                            </tbody>

                            <tfoot style={{ ...styles.tfoot, position: 'sticky', bottom: -1, zIndex: 1 }}>
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
    content: { flex: 1, padding: '25px', backgroundColor: '#fff', marginLeft: '110px', overflowY: 'hidden',height:'800px' },
    headerContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', },
    dateSearchContainer: { display: 'flex',flexDirection: 'column', alignItems: 'flex-end', },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#000' },
    datePickerContainer: { display: 'flex', alignItems: 'center',  marginBottom: '10px', },
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
    searchContainer: { display: 'flex', alignItems: 'center', marginTop: '10px' },
    searchLabel: { marginRight: '10px' },
    searchInput: { padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '200px' },
    subTitle: { fontSize: '20px', fontWeight: 'bold', color: '#333' },
};
