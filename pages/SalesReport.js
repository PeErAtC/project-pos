import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BackendSidebar from './components/backendsidebar';
import Swal from 'sweetalert2';
import { FaClipboardList, FaTable, FaCalendarAlt, FaDollarSign, FaTag, FaPercentage, FaMoneyBill, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const api_url = "https://easyapp.clinic/pos-api/api";
const slug = "abc";

export default function SalesReport({ initialReportData, initialError }) {
    const [reportData, setReportData] = useState(initialReportData || []);
    const [error, setError] = useState(initialError || null);
    const [dateFilter, setDateFilter] = useState('');

    const fetchReportData = async () => {
        try {
            const url = `${api_url}/${slug}/orders`;
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
                },
            });
            setReportData(response.data);
            console.log('Fetched report data:', response.data);
            setError(null);
        } catch (err) {
            setError("ไม่สามารถเชื่อมต่อกับ API ได้");
            console.error('Error fetching report data:', err);
        }
    };

    useEffect(() => {
        fetchReportData();
        const interval = setInterval(fetchReportData, 10000);
        return () => clearInterval(interval);
    }, []);

    const filterByDate = (data) => {
        if (!dateFilter) return data;
        return data.filter(order => 
            new Date(order.order_date).toLocaleDateString('en-CA') === dateFilter
        );
    };

    const calculateTotals = (orders) => {
        const totalAmount = orders.reduce((total, order) => total + parseFloat(order.total_amount || 0), 0).toFixed(2);
        const totalDiscount = orders.reduce((total, order) => total + parseFloat(order.discount || 0), 0).toFixed(2);
        const totalVat = orders.reduce((total, order) => total + parseFloat(order.vat_amt || 0), 0).toFixed(2);
        const totalNet = (totalAmount - totalDiscount).toFixed(2);
        return { totalAmount, totalDiscount, totalVat, totalNet };
    };

    // ฟังก์ชันดึงรายละเอียดคำสั่งซื้อพร้อมสินค้า
    const fetchOrderDetails = async (orderId) => {
        try {
            const orderResponse = await axios.get(`${api_url}/${slug}/orders/${orderId}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
                },
            });

            if (orderResponse.status !== 200) {
                throw new Error(`Unexpected response code: ${orderResponse.status}`);
            }

            const itemsResponse = await axios.get(`${api_url}/${slug}/order_items?order_id=${orderId}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
                },
            });

            if (itemsResponse.status !== 200) {
                throw new Error(`Unexpected response code: ${itemsResponse.status}`);
            }

            return { ...orderResponse.data, items: itemsResponse.data };
        } catch (error) {
            console.error('Error fetching order details:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถดึงข้อมูลสินค้าได้ กรุณาลองอีกครั้ง หรือแจ้งผู้ดูแลระบบ',
                icon: 'error',
                confirmButtonText: 'ปิด',
            });
            return null;
        }
    };

    // ฟังก์ชันแสดงรายละเอียดคำสั่งซื้อ
    const showOrderDetails = async (orderId) => {
        const order = await fetchOrderDetails(orderId);
        if (!order || !order.items || order.items.length === 0) {
            Swal.fire({
                title: 'ไม่มีรายละเอียด',
                text: 'ไม่มีข้อมูลสินค้าในบิลนี้',
                icon: 'warning',
                confirmButtonText: 'ปิด'
            });
            return;
        }

        const details = order.items
            .map(item => `
                <p><strong>สินค้า:</strong> ${item.p_name}</p>
                <p><strong>จำนวน:</strong> ${item.quantity}</p>
                <p><strong>ราคา:</strong> ${parseFloat(item.price).toFixed(2)}</p>
                <p><strong>รวม:</strong> ${(item.quantity * parseFloat(item.price)).toFixed(2)}</p>
                <hr />
            `)
            .join('');

        Swal.fire({
            title: `รายละเอียดบิล: ${order.order_number}`,
            html: details,
            width: 600,
            padding: '3em',
            confirmButtonText: 'ปิด'
        });
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
                                <th style={styles.th}><FaTimesCircle /> สถานะ</th>
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
                                    <td style={styles.td}>{order.net_amount}</td>
                                    <td style={{ ...styles.td, color: '#FF0000', fontWeight: 'bold' }}>ยังไม่ชำระ</td>
                                    <td style={styles.td}>
                                        <button style={styles.detailsButton} onClick={() => showOrderDetails(order.id)}>ดูรายละเอียด</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot style={styles.tfoot}>
                            <tr>
                                <td colSpan="3" style={styles.totalLabel}>รวมยอด:</td>
                                <td style={styles.totalValue}>{pendingTotals.totalAmount}</td>
                                <td style={styles.totalValue}>{pendingTotals.totalDiscount}</td>
                                <td style={styles.totalValue}>{pendingTotals.totalVat}</td>
                                <td style={styles.totalValue}>{pendingTotals.totalNet}</td>
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
                                    <td style={styles.td}>{order.net_amount}</td>
                                    <td style={{ ...styles.td, color: '#008000', fontWeight: 'bold' }}>ชำระแล้ว</td>
                                    <td style={styles.td}>
                                        <button style={styles.detailsButton} onClick={() => showOrderDetails(order.id)}>ดูรายละเอียด</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot style={styles.tfoot}>
                            <tr>
                                <td colSpan="3" style={styles.totalLabel}>รวมยอด:</td>
                                <td style={styles.totalValue}>{paidTotals.totalAmount}</td>
                                <td style={styles.totalValue}>{paidTotals.totalDiscount}</td>
                                <td style={styles.totalValue}>{paidTotals.totalVat}</td>
                                <td style={styles.totalValue}>{paidTotals.totalNet}</td>
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
    th: { padding: '10px', backgroundColor: '#499cae', color: '#fff', textAlign: 'center', position: 'sticky', top: 0 },
    td: { padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'center', color: '#333', fontSize: '14px' },
    totalLabel: { textAlign: 'right', fontWeight: 'bold' },
    totalValue: { textAlign: 'center', fontWeight: 'bold' },
    detailsButton: { padding: '5px 10px', backgroundColor: '#FFA500', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
    totalContainer: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' },
    tfoot: { position: 'sticky', bottom: 0, backgroundColor: '#fffffe', height: '35px' }
};
