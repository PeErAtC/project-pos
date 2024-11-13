import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BackendSidebar from './components/backendsideber';
import { Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';

const api_url = "https://easyapp.clinic/pos-api/api";
const slug = "abc";

export default function PaymentSummary() {
    const [salesData, setSalesData] = useState([]);
    const [monthlySalesData, setMonthlySalesData] = useState({});
    const [topSellingItems, setTopSellingItems] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewType, setViewType] = useState('daily');
    const [totalSales, setTotalSales] = useState(0);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const [startDate, setStartDate] = useState('');

    useEffect(() => {
        const fetchSalesData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${api_url}/${slug}/orders`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
                    },
                    params: {
                        viewType,
                        startDate: startDate || undefined
                    },
                });
                const data = response.data;
                setSalesData(data);
                calculateTotalSales(data);
                calculateMonthlySales(data);
                calculateTotalTransactions(data);
                fetchTopSellingItems();
                setError(null);
            } catch (err) {
                setError("ไม่สามารถเชื่อมต่อกับ API ได้");
                console.error('Error fetching sales data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSalesData();
    }, [viewType, startDate]);

    const fetchTopSellingItems = async () => {
        try {
            const response = await axios.get(`${api_url}/${slug}/order_items`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
                },
            });
            const data = response.data;
            const itemSales = data.reduce((acc, item) => {
                if (!acc[item.p_name]) {
                    acc[item.p_name] = 0;
                }
                acc[item.p_name] += item.quantity;
                return acc;
            }, {});
            const sortedItems = Object.entries(itemSales)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name, quantity]) => ({ name, quantity }));
            setTopSellingItems(sortedItems);
        } catch (err) {
            console.error("ไม่สามารถดึงข้อมูลสินค้าขายดีได้", err);
        }
    };

    const calculateTotalSales = (data) => {
        const total = data.reduce((acc, item) => acc + (parseFloat(item.net_amount) || 0), 0);
        setTotalSales(total);
    };

    const calculateTotalTransactions = (data) => {
        const total = data.length;
        setTotalTransactions(total);
    };

    const calculateMonthlySales = (data) => {
        const filteredData = data.filter(item => new Date(item.order_date).getFullYear() >= 2024);
        
        const monthlySales = filteredData.reduce((acc, item) => {
            const date = new Date(item.order_date);
            const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[yearMonth]) {
                acc[yearMonth] = 0;
            }
            acc[yearMonth] += parseFloat(item.net_amount) || 0;
            return acc;
        }, {});

        setMonthlySalesData(monthlySales);
    };

    const prepareDailyChartData = () => {
        const dailySales = salesData.reduce((acc, item) => {
            const date = new Date(item.order_date).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = 0;
            }
            acc[date] += parseFloat(item.net_amount) || 0;
            return acc;
        }, {});

        const year = startDate.split('-')[0];
        const month = startDate.split('-')[1];
        const daysInMonth = new Date(year, month, 0).getDate();

        const labels = Array.from({ length: daysInMonth }, (_, i) => `${year}-${month}-` + String(i + 1).padStart(2, '0'));
        const salesAmounts = labels.map(label => dailySales[label] || 0);

        return {
            labels,
            datasets: [
                {
                    label: 'ยอดขายรวม',
                    data: salesAmounts,
                    backgroundColor: '#4A90E2',
                    borderColor: '#4A90E2',
                    borderWidth: 1,
                },
            ],
        };
    };

    const prepareMonthlyChartData = () => {
        const monthNames = new Intl.DateTimeFormat('th-TH', { month: 'short' });
        const currentYear = new Date().getFullYear();

        const allMonths = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            return {
                label: monthNames.format(new Date(currentYear, i)),
                key: `${currentYear}-${String(month).padStart(2, '0')}`
            };
        });

        const labels = allMonths.map(item => item.label);
        const salesAmounts = allMonths.map(item => monthlySalesData[item.key] || 0);

        const backgroundColors = [
            '#FF6666', // 2024
            '#4A90E2', // 2025
            '#8A2BE2', // 2026
            '#FFB6C1', // 2027
            '#32CD32'  // 2028
        ];

        return {
            labels,
            datasets: backgroundColors.map((color, index) => ({
                label: `พ.ศ. ${2567 + index}`,
                data: index === 0 ? salesAmounts : salesAmounts.map(() => 0),
                backgroundColor: color,
                borderColor: '#000000',
                borderWidth: 1,
            }))
        };
    };

    const getSummaryLabel = () => {
        if (viewType === 'daily') return `สรุปยอดขายของเดือนนี้`;
        if (viewType === 'monthly') return `สรุปยอดขายของปีนี้`;
        return 'สรุปยอดขาย';
    };

    const chartOptions = {
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    font: {
                        size: 20
                    },
                    color: '#4A4A4A'
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#888',
                    font: {
                        size: 20,
                    },
                },
            },
            y: {
                grid: {
                    color: '#f0f0f0',
                },
                ticks: {
                    color: '#888',
                    font: {
                        size: 20,
                    },
                    beginAtZero: true,
                },
            },
        },
        maintainAspectRatio: false
    };

    return (
        <div style={styles.pageContainer}>
            <BackendSidebar />
            <div style={styles.content}>
                <h1 style={styles.titleWithHighlight}>สรุปการขาย</h1>

                <div style={styles.filterContainer}>
                    <label style={styles.label}>เลือกการดูยอดขาย: </label>
                    <div style={styles.circleButtonContainer}>
                        <button 
                            onClick={() => setViewType('daily')} 
                            style={{ ...styles.circleButton, backgroundColor: viewType === 'daily' ? '#4A90E2' : '#ccc' }}
                        >
                            รายวัน
                        </button>
                        <button 
                            onClick={() => setViewType('monthly')} 
                            style={{ ...styles.circleButton, backgroundColor: viewType === 'monthly' ? '#4A90E2' : '#ccc' }}
                        >
                            รายเดือน
                        </button>
                    </div>

                    <label style={styles.label}>เดือนที่ต้องการดู: </label>
                    <input 
                        type="month" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        style={{ ...styles.select, fontSize: '20px', padding: '16px', cursor: 'pointer' }}
                    />
                </div>

                {loading ? (
                    <p style={styles.loadingText}>กำลังโหลดข้อมูล...</p>
                ) : error ? (
                    <p style={styles.error}>{error}</p>
                ) : (
                    <>
                        <div style={styles.summaryChartContainer}>
                            <div style={styles.summaryContainer}>
                                <div style={styles.summaryBox}>
                                    <h3 style={styles.summaryTitle}>{getSummaryLabel()}</h3>
                                    <p style={styles.totalSalesValue}>{totalSales.toLocaleString()} บาท</p>
                                </div>
                                <div style={styles.salesCountBox}>
                                    <h3 style={styles.summaryTitle}>จำนวนการขาย</h3>
                                    <p style={styles.salesCountValue}>{totalTransactions}</p>
                                </div>
                                <div style={styles.topSellingBox}>
                                    <h3 style={styles.summaryTitle}>สินค้าขายดี</h3>
                                    <ul style={styles.topSellingList}>
                                        {topSellingItems.map((item, index) => (
                                            <li key={index} style={styles.topSellingItem}>
                                                {item.name}: {item.quantity} ชิ้น
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div style={styles.chartBox}>
                                {viewType === 'daily' ? (
                                    <>
                                        <h3 style={styles.chartTitle}>รายงานยอดขายรายวัน</h3>
                                        <Bar data={prepareDailyChartData()} options={chartOptions} />
                                    </>
                                ) : (
                                    <>
                                        <h3 style={styles.chartTitle}>กราฟแสดงยอดขายต่อเดือน</h3>
                                        <Bar data={prepareMonthlyChartData()} options={chartOptions} />
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const styles = {
    pageContainer: { display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f8', overflowY: 'auto' },
    content: { flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    titleWithHighlight: { fontSize: '36px', fontWeight: 'bold', color: '#ff6347', marginBottom: '20px', textShadow: '2px 2px #ffe6e6' }, // เพิ่ม textShadow และเปลี่ยนสีเพื่อให้หัวเรื่องเด่นขึ้น
    filterContainer: { display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '20px' },
    label: { fontSize: '20px', color: '#4a4a4a' },
    select: { padding: '12px', border: '1px solid #ccc', borderRadius: '8px' },
    loadingText: { fontSize: '24px', color: '#888' },
    error: { color: 'red', marginBottom: '10px' },
    summaryChartContainer: { display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%', maxWidth: '1400px', gap: '20px', marginBottom: '20px', justifyContent: 'center' }, // ลดความกว้างของ summaryChartContainer เพื่อลดการทับกับ sidebar
    summaryContainer: { display: 'flex', flexDirection: 'column', gap: '20px', width: '25%' }, // ลดขนาดความกว้างของ summaryContainer เพื่อให้ไม่ทับกับ sidebar
    summaryBox: { backgroundColor: '#ffffff', padding: '15px', borderRadius: '15px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center' },
    totalSalesValue: { fontSize: '32px', fontWeight: 'bold', color: '#ff6347' },
    salesCountBox: { backgroundColor: '#9effca', padding: '15px', borderRadius: '15px', textAlign: 'center' },
    salesCountValue: { fontSize: '24px', fontWeight: 'bold', color: '#4A4A4A' },
    topSellingBox: { backgroundColor: '#ffffff', padding: '15px', borderRadius: '15px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center' }, // กล่องสำหรับสินค้าขายดี
    topSellingList: { listStyleType: 'none', padding: 0, margin: 0 },
    topSellingItem: { fontSize: '20px', fontWeight: 'bold', color: '#4A4A4A', marginBottom: '10px' },
    chartBox: { flex: 3, backgroundColor: '#ffffff', padding: '20px', borderRadius: '15px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center', minHeight: '300px', maxHeight: '400px', maxWidth: '65%' }, // เพิ่มความสูงของ chartBox ให้มากขึ้นตามคำขอ
    chartTitle: { fontSize: '24px', color: '#4A4A4A', marginBottom: '15px', fontWeight: 'bold' },
    monthlyChartContainer: { width: '100%', maxWidth: '1200px', marginTop: '30px' },
    circleButtonContainer: { display: 'flex', gap: '20px' },
    circleButton: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        border: 'none',
        color: '#fff',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
};
