import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BackendSidebar from './components/backendsideber';
import { Line } from 'react-chartjs-2';  // เปลี่ยนจาก Bar เป็น Line
import Chart from 'chart.js/auto';
import { FiTrendingUp, FiBarChart, FiShoppingCart, FiPackage } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement } from 'chart.js';
import { FaChartBar, FaList, FaChartPie } from "react-icons/fa"; 
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(LineElement);


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
    const [dailySales, setDailySales] = useState(0); // สำหรับยอดขายรายวัน
    const [yearlySales, setYearlySales] = useState(0); // สำหรับยอดขายปีนี้
    const [monthlyTransactions, setMonthlyTransactions] = useState(0);  // เพิ่ม useState นี้เข้าไป
    const [chartType, setChartType] = useState('pie'); // Default Pie Chart
    const [showTopSellingList, setShowTopSellingList] = useState(false);
    const [displayMode, setDisplayMode] = useState("chart"); // เริ่มต้นเป็นกราฟ
    const [chartPopupVisible, setChartPopupVisible] = useState(false);
    const [hoverIndex, setHoverIndex] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        const fetchSalesData = async () => {
            const authToken = localStorage.getItem('token');
            if (!authToken) {
                Swal.fire({
                    title: 'กรุณาเข้าสู่ระบบ',
                    text: 'คุณยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อนใช้งาน',
                    icon: 'warning',
                    confirmButtonText: 'เข้าสู่ระบบ',
                }).then(() => {
                    window.location.href = '/login';
                });
                return;
            }
    
            setLoading(true);
            try {
                const api_url = localStorage.getItem('url_api');
                const slug = localStorage.getItem('slug');
                const response = await axios.get(`${api_url}/${slug}/orders`, {
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${authToken}`,
                    },
                    params: { viewType, startDate: startDate || undefined },
                });
    
                const data = response.data;
                setSalesData(data);
                calculateTotalSales(data);
                calculateMonthlySales(data);
                calculateTotalTransactions(data);
                calculateMonthlyTransactions(data);
                calculateDailySales(data);
                calculateYearlySales(data);
                
                // ดึงข้อมูลสินค้าขายดี
                await fetchTopSellingItems();
    
                setError(null);
            } catch (err) {
                setError('ไม่สามารถเชื่อมต่อกับ API ได้');
                console.error('❌ Error fetching sales data:', err);
            } finally {
                setLoading(false);
            }
        };
    
        fetchSalesData();
    }, [viewType, startDate]);
    
    
    useEffect(() => {
        const fetchTopSellingItems = async () => {
            const authToken = localStorage.getItem('token');
            try {
                const api_url = localStorage.getItem('url_api');
                const slug = localStorage.getItem('slug');
                const response = await axios.get(`${api_url}/${slug}/topsale`, {
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${authToken}`,
                    },
                });
    
                const data = response.data;
                console.log("📊 ข้อมูลสินค้าขายดีจาก API:", data);
    
                if (Array.isArray(data) && data.length > 0) {
                    setTopSellingItems(data);
                } else {
                    setTopSellingItems([]);
                }
            } catch (err) {
                console.error('❌ Error fetching top-selling items:', err.response ? err.response.data : err.message);
                setTopSellingItems([]);
            }
        };
    
        fetchTopSellingItems();
    }, []);
    

    const fetchTopSellingItems = async () => {
        const authToken = localStorage.getItem('token');
        try {
            const api_url = localStorage.getItem('url_api');
            const slug = localStorage.getItem('slug');
            const response = await axios.get(`${api_url}/${slug}/topsale`, {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
            });
    
            const data = response.data;
            console.log("📊 ข้อมูลสินค้าขายดีจาก API:", data);
    
            if (Array.isArray(data) && data.length > 0) {
                setTopSellingItems(data);
            } else {
                setTopSellingItems([]);
            }
        } catch (err) {
            console.error('❌ Error fetching top-selling items:', err.response ? err.response.data : err.message);
            setTopSellingItems([]);
        }
    };
    
    
    useEffect(() => {
        console.log("📌 displayMode:", displayMode);
    }, [displayMode]);
    
    
    
    
    const handleItemClick = (item) => {
        setSelectedItem(item);
    };
    
    // คำนวณยอดขายทั้งเดือน
    const calculateTotalSales = (data) => {
        const [selectedYear, selectedMonth] = startDate.split('-');
        const total = data
            .filter((item) => {
                const date = new Date(item.order_date);
                return (
                    date.getFullYear() === parseInt(selectedYear, 10) &&
                    (viewType === 'daily' ? date.getMonth() + 1 === parseInt(selectedMonth, 10) : true)
                );
            })
            .reduce((acc, item) => acc + (parseFloat(item.net_amount) || 0), 0);
        setTotalSales(total);
    };
    

    // คำนวณยอดขายรายวัน
    const calculateDailySales = (data) => {
        const today = new Date().toISOString().split('T')[0]; // วันที่ปัจจุบัน
        const dailyTotal = data
            .filter((item) => {
                const date = new Date(item.order_date).toISOString().split('T')[0];
                return date === today;
            })
            .reduce((acc, item) => acc + (parseFloat(item.net_amount) || 0), 0);
        setDailySales(dailyTotal);
    };
    

    // คำนวณยอดขายปีนี้
    const calculateYearlySales = (data) => {
        if (!startDate) return;
        const [selectedYear] = startDate.split('-');
    
        const yearlySalesTotal = data.filter(item => {
            const date = new Date(item.order_date);
            return date.getFullYear() === parseInt(selectedYear, 10);
        }).reduce((acc, item) => acc + (parseFloat(item.net_amount) || 0), 0);
    
        console.log("📅 ยอดขายรวมปีที่เลือก:", yearlySalesTotal);
        setYearlySales(yearlySalesTotal);
    };
    
    
    const getLatestSalesDate = (data) => {
        if (!data.length) return null;
    
        // เรียงข้อมูลตามวันที่ล่าสุด
        const sortedData = [...data].sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
        
        return sortedData.length > 0 ? sortedData[0].order_date : null;
    };
    
    // คำนวณยอดขายในเดือนที่เลือก
    const calculateMonthlySales = (data) => {
        if (!startDate) return;
    
        const [selectedYear, selectedMonth] = startDate.split('-');
        if (!selectedYear || !selectedMonth) return;
    
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1; // +1 เพราะ getMonth() เริ่มจาก 0
    
        const monthlySalesData = data.filter(item => {
            const date = new Date(item.order_date);
            return date.getFullYear() === parseInt(selectedYear, 10) &&
                   date.getMonth() + 1 === parseInt(selectedMonth, 10);
        });
    
        let totalMonthlySales = monthlySalesData.reduce((acc, item) => acc + (parseFloat(item.net_amount) || 0), 0);
    
        // ถ้าผู้ใช้เลือกเดือนปัจจุบัน ให้ดึงยอดขายของวันล่าสุดแทน
        if (parseInt(selectedYear) === currentYear && parseInt(selectedMonth) === currentMonth) {
            const latestDate = getLatestSalesDate(monthlySalesData);
            if (latestDate) {
                totalMonthlySales = monthlySalesData
                    .filter(item => new Date(item.order_date).toISOString().split('T')[0] === latestDate)
                    .reduce((acc, item) => acc + (parseFloat(item.net_amount) || 0), 0);
            }
        }
    
        console.log("📅 ยอดขายที่ต้องแสดง:", totalMonthlySales);
        setTotalSales(totalMonthlySales);
    };
    
    
    
    const calculateTotalTransactions = (data) => {
        const total = data.length;
        setTotalTransactions(total);
    };
    const calculateMonthlyTransactions = (data) => {
        if (!startDate) return;
        const [selectedYear, selectedMonth] = startDate.split('-');
        if (!selectedYear || !selectedMonth) return;
    
        const monthlyTotal = data.filter(item => {
            const date = new Date(item.order_date);
            return date.getFullYear() === parseInt(selectedYear, 10) && date.getMonth() + 1 === parseInt(selectedMonth, 10);
        }).length;
    
        setMonthlyTransactions(monthlyTotal || 0);
    };

    // 🛠️ คำนวณยอดขายของเดือนและปีที่เลือก
    const calculateMonthlyAndYearlySales = (data) => {
        if (!startDate) return;
        const [selectedYear, selectedMonth] = startDate.split('-');
        if (!selectedYear) return;

        // คำนวณยอดขายของปีที่เลือก
        const yearlyTotal = data.filter(item => {
            const date = new Date(item.order_date);
            return date.getFullYear() === parseInt(selectedYear, 10);
        }).reduce((acc, item) => acc + (parseFloat(item.net_amount) || 0), 0);
        
        setYearlySales(yearlyTotal);

        // คำนวณยอดขายของเดือนที่เลือก
        if (selectedMonth) {
            const monthlyTotal = data.filter(item => {
                const date = new Date(item.order_date);
                return date.getFullYear() === parseInt(selectedYear, 10) &&
                    date.getMonth() + 1 === parseInt(selectedMonth, 10);
            }).reduce((acc, item) => acc + (parseFloat(item.net_amount) || 0), 0);
            
            setTotalSales(monthlyTotal);
        }
    };
    // 🛠️ คำนวณจำนวนออเดอร์ของเดือนและปีที่เลือก
    const calculateMonthlyAndYearlyTransactions = (data) => {
        if (!startDate) return;
        const [selectedYear, selectedMonth] = startDate.split('-');
        if (!selectedYear) return;
    
        const yearlyOrders = data.filter(item => {
            const date = new Date(item.order_date);
            return date.getFullYear() === parseInt(selectedYear, 10);
        }).length;
    
        const monthlyOrders = selectedMonth 
            ? data.filter(item => {
                const date = new Date(item.order_date);
                return date.getFullYear() === parseInt(selectedYear, 10) &&
                    date.getMonth() + 1 === parseInt(selectedMonth, 10);
            }).length
            : 0;
    
        setYearlyTransactions(yearlyOrders);
        setMonthlyTransactions(monthlyOrders);
    };
    
    const TwoColumnLegend = ({ data }) => {
        return (
            <div style={styles.legendContainer}>
                {data.map((row, rowIndex) => (
                    <div key={rowIndex} style={styles.legendRow}>
                        {row.map((item, index) => (
                            <div key={index} style={styles.legendItem}>
                                <span style={{ ...styles.legendColor, backgroundColor: item.color }}></span>
                                <span style={styles.legendText}>{item.name} ({item.percentage})</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
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
                    fill: true,
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 2,
                },
            ],
        };
    };

    const prepareMonthlyChartData = () => {
        const selectedYear = startDate.split('-')[0]; // ใช้ปีที่ผู้ใช้เลือก
    
        // สร้างข้อมูลสำหรับกราฟ
        const allMonths = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            return {
                label: new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(new Date(selectedYear, i)), // ชื่อเดือน
                key: `${selectedYear}-${String(month).padStart(2, '0')}`, // key สำหรับเดือน
            };
        });
    
        // คำนวณยอดขายสำหรับทุกเดือน
        const salesAmounts = allMonths.map(item => {
            // กรองยอดขายในแต่ละเดือน
            const filteredSales = salesData.filter(dataItem => {
                const date = new Date(dataItem.order_date);
                return date.getFullYear() === parseInt(selectedYear, 10) && (date.getMonth() + 1) === parseInt(item.key.split('-')[1], 10);
            });
            // หาผลรวมยอดขายในเดือนนั้น
            return filteredSales.reduce((acc, item) => acc + (parseFloat(item.net_amount) || 0), 0);
        });
    
        return {
            labels: allMonths.map(item => item.label),
            datasets: [
                {
                    label: 'ยอดขายต่อเดือน',
                    data: salesAmounts,
                    fill: true,
                    backgroundColor: '#3498db',  // สีฟ้าสำหรับกราฟ
                    borderColor: '#2980b9',
                    borderWidth: 2,
                },
            ],
        };
    };
    
    
    const chartOptions = {
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    font: { size: 20 },
                    color: '#4A4A4A'
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#888', font: { size: 15 } },
            },
            y: {
                grid: { color: '#f0f0f0' },
                ticks: { color: '#888', font: { size: 15 }, beginAtZero: true },
            },
        },
        maintainAspectRatio: false
    };
    const modernColors = [
        "#a10202", "#FFD166", "#06D6A0", "#118AB2", "#073B4C",
        "#EF476F", "#8338EC", "#FF8C42", "#FFCAD4", "#6A0572"
    ];
    
    
    const prepareTopSellingChartData = () => {
        if (!topSellingItems || topSellingItems.length === 0) {
            return {
                labels: [],
                datasets: [
                    {
                        label: 'จำนวนสินค้าที่ขายได้',
                        data: [],
                        backgroundColor: [],
                    },
                ],
            };
        }
    
        const labels = topSellingItems.map(item => item.p_name);
        const salesData = topSellingItems.map(item => item.sales || 0);
        const totalSales = salesData.reduce((acc, value) => acc + value, 0);
    
        const formattedLabels = labels.map((label, index) => ({
            name: label,
            percentage: ((salesData[index] / totalSales) * 100).toFixed(1) + "%",
            color: modernColors[index]
        }));
    
        // จัดกลุ่ม legend ให้แสดงเป็น 2 รายการต่อแถว
        const groupedLabels = [];
        for (let i = 0; i < formattedLabels.length; i += 2) {
            groupedLabels.push(formattedLabels.slice(i, i + 2));
        }
    
        return {
            labels: labels,
            datasets: [
                {
                    label: 'จำนวนสินค้าที่ขายได้',
                    data: salesData,
                    backgroundColor: modernColors.slice(0, topSellingItems.length),
                    borderWidth: 2,
                    borderColor: "#fff",
                    hoverBorderWidth: 4,
                    hoverBorderColor: "#000",
                    cutout: '60%',
                },
            ],
            groupedLabels, // ✅ ส่งออก legend ที่จัดเรียงใหม่
        };
    };
    
    const CustomLegend = ({ data }) => {
        return (
            <div style={styles.customLegend}>
                <div style={styles.legendGrid}>
                    {data.map((item, index) => (
                        <div key={index} style={styles.legendItem}>
                            <span style={{ ...styles.legendColor, backgroundColor: item.color }}></span>
                            <span style={styles.legendText}>{item.name} ({item.percentage})</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };
    const closePopup = (e) => {
        if (!e.target.closest(".chart-popup") && !e.target.closest(".chart-icon")) {
            setChartPopupVisible(false);
        }
    };
    
    // เพิ่ม event listener เมื่อต้องการให้ป๊อปอัปปิดเมื่อกดที่อื่น
    useEffect(() => {
        if (chartPopupVisible) {
            document.addEventListener("click", closePopup);
        } else {
            document.removeEventListener("click", closePopup);
        }
        return () => document.removeEventListener("click", closePopup);
    }, [chartPopupVisible]);


    return (
        <div style={styles.pageContainer}>
            <BackendSidebar />
            <div style={styles.content}>
                <h1 style={styles.titleWithHighlight}>รายงานยอดขาย</h1>
    
                <div style={styles.filterContainer}>
                    <label style={styles.label}>เลือกการดูยอดขาย: </label>
                    <div style={styles.circleButtonContainer}>
                        <button
                            onClick={() => setViewType('daily')}
                            style={{
                                ...styles.circleButton,
                                backgroundColor: viewType === 'daily' ? '#3498db' : '#ccc',
                                boxShadow: viewType === 'daily' ? '0px 4px 8px rgba(52, 152, 219, 0.6)' : 'none'
                            }}
                        >
                            รายวัน <FiBarChart />
                        </button>
                        <button
                            onClick={() => setViewType('monthly')}
                            style={{
                                ...styles.circleButton,
                                backgroundColor: viewType === 'monthly' ? '#3498db' : '#ccc',
                                boxShadow: viewType === 'monthly' ? '0px 4px 8px rgba(52, 152, 219, 0.6)' : 'none'
                            }}
                        >
                            รายเดือน
                        </button>
                    </div>
    
                    <label style={styles.label}>เดือนที่ต้องการดู: </label>
                    <input
                        type="month"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{
                            ...styles.select,
                            fontSize: '14px',
                            padding: '16px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    />
                </div>
    
                {loading ? (
                    <p style={styles.loadingText}>กำลังโหลดข้อมูล...</p>
                ) : error ? (
                    <p style={styles.error}>{error}</p>
                ) : (
                    <div style={styles.summaryChartContainer}>
                        <div style={styles.summaryContainer}>
                            <div style={styles.summaryBox}>
                                <h3 style={styles.summaryTitle}>สรุปยอดขาย</h3>
                                <div style={styles.totalSalesValueContainer}>
                                    <p style={styles.totalSalesValue}>
                                        {totalSales.toLocaleString()} ฿
                                        {viewType === 'monthly'
                                            ? (parseInt(startDate.split('-')[1]) === new Date().getMonth() + 1
                                                ? ' (ล่าสุด)'
                                                : ' (รวมเดือน)')
                                            : ''}
                                    </p>
                                    {viewType === 'daily' && (
                                        <p style={styles.totalSalesValue}>
                                            {yearlySales.toLocaleString()} ฿ (รวมปี)
                                        </p>
                                    )}
    
                                    {viewType === 'monthly' && (
                                        <p style={styles.totalSalesValue}>
                                            {yearlySales.toLocaleString()} ฿ (รวมปี)
                                        </p>
                                    )}
                                </div>
                            </div>
    
                            <div style={styles.salesCountBox}>
                                <h3 style={styles.salesCountTitle}>จำนวนการขาย</h3>
                                <div style={styles.salesCountValueContainer}>
                                    <p style={styles.salesCountValue}>{totalTransactions} (ทั้งหมด)</p>
                                    <p style={styles.salesCountValueMonth}>{monthlyTransactions} (เดือนที่เลือก)</p>
                                </div>
                            </div>
    
                            {/* สินค้าขายดี */}
                            <div style={styles.topSellingBox}>
                            {/* หัวข้อ + ปุ่มเลือกโหมดการแสดงผล */}
                            <div style={styles.topSellingHeader}>
                                <h3 style={styles.summaryTitle}>สินค้าขายดี</h3>
                                <div style={styles.buttonContainer}>
                                <FaChartBar
                                    size={22}
                                    style={displayMode === "chart" ? styles.selectedIcon : styles.icon}
                                    onClick={() => setDisplayMode("chart")}
                                    title="แสดงเป็นกราฟ"
                                />
                                <FaList
                                    size={22}
                                    style={displayMode === "list" ? styles.selectedIcon : styles.icon}
                                    onClick={() => setDisplayMode("list")}
                                    title="แสดงเป็นรายชื่อ"
                                />
                                </div>
                            </div>

                            {/* ปุ่มเลือกประเภทกราฟ (แสดงเฉพาะเมื่อเลือกโหมดกราฟ) */}
                            {displayMode === "chart" && (
                                <div style={styles.chartTypeSelector}>
                                    <FaChartBar
                                        size={22}
                                        style={chartType === "bar" ? styles.selectedIcon : styles.icon}
                                        onClick={() => setChartType("bar")}
                                        title="กราฟแท่ง"
                                    />
                                    <FaChartPie
                                        size={22}
                                        style={chartType === "pie" ? styles.selectedIcon : styles.icon}
                                        onClick={() => setChartType("pie")}
                                        title="กราฟวงกลม"
                                    />
                                </div>
                            )}
                                {/* แสดงผล */}
                                <div style={styles.chartContainer}>
                            {displayMode === "chart" ? (
                                chartType === "bar" ? (
                                    <Bar data={prepareTopSellingChartData()} options={{ responsive: true, maintainAspectRatio: false }} />
                                ) : (
                                    <Doughnut 
                                        data={prepareTopSellingChartData()} 
                                        options={{
                                            responsive: true, 
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: "top", 
                                                    labels: {
                                                        font: { size: 14 },
                                                        color: "#333",
                                                    }
                                                },
                                                tooltip: {
                                                    callbacks: {
                                                        label: function(tooltipItem) {
                                                            let value = tooltipItem.raw;
                                                            let total = tooltipItem.dataset.data.reduce((a, b) => a + b, 0);
                                                            let percentage = ((value / total) * 100).toFixed(1);
                                                            return `${value} ชิ้น (${percentage}%)`; // ✅ แสดง % ใน tooltip
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                )
                            ) : (
                                <div style={styles.listWrapper}>
                                    <ul style={styles.listContainer}>
                                        {topSellingItems.slice(0, 10).map((item, index) => (
                                            <li key={index} style={styles.listItem}>
                                                <span style={styles.itemIndex}>{index + 1}.</span>
                                                <span style={styles.itemName}>{item.p_name}</span>
                                                <span style={styles.itemSales}>{item.sale_total.toLocaleString()} / {item.sales.toLocaleString()} ชิ้น</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                                </div>
                            </div>
                        </div>
                        <div style={styles.chartBox}>
                            {viewType === 'daily' ? (
                                <>
                                    <h3 style={styles.chartTitle}>รายงานยอดขายรายวัน</h3>
                                    <Line
                                        data={prepareDailyChartData()}
                                        options={chartOptions}
                                    />
                                </>
                            ) : (
                                <>
                                    <h3 style={styles.chartTitle}>กราฟแสดงยอดขายต่อเดือน</h3>
                                    <Line
                                        data={prepareMonthlyChartData()}
                                        options={chartOptions}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
    
    ;
}

const styles = {
    pageContainer: { display: 'flex', minHeight: '100vh', overflowY: 'auto', overflowX: 'hidden', marginRight: '70px' },
    content: { 
        flex: 1, 
        padding: '40px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'flex-start', 
        resize: 'both', 
        overflow: 'auto', 
        width: '85%', // ✅ ใช้ width แทน maxWidth เพื่อให้ยืดหยุ่น
        minHeight: '600px', // ✅ ป้องกันการย่อจนเล็กเกินไป
        maxHeight: '80vh', // ✅ เพิ่ม maxHeight ให้สูงขึ้นเล็กน้อย
        border: '1px solid #ffffff', 
        borderRadius: '10px',
        marginLeft: '120px', 
        marginRight: '5px', 
        backgroundColor: '#e8f4ff'
    },
    
    
    titleWithHighlight: { 
        fontSize: '24px', 
        fontWeight: 'bold', 
        color: '#315859', 
        marginBottom: '20px',
        textAlign: 'left',  
    },
    filterContainer: { 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '20px', 
        gap: '20px', 
        justifyContent: 'flex-start'  
    },
    label: { fontSize: '20px', color: '#8196abff' },
    select: { padding: '12px', border: '1px solid #eefeff', borderRadius: '8px' },
    circleButtonContainer: { display: 'flex', gap: '10px' },
    circleButton: {
        padding: '8px 16px',
        fontSize: '14px',
        borderRadius: '30px',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        transition: 'all 0.3s ease',   
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
        transform: 'scale(1)',  
    },
    topSellingBox: {
        backgroundColor: "#fff",
        borderRadius: "15px",
        padding: "15px",
        width: "100%",
        maxWidth: "350px", // ✅ กำหนดความกว้างแน่นอน
        minWidth: "300px",
        height: "400px", // ✅ คงขนาดความสูง
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
        textAlign: "left", // ✅ จัดชิดซ้ายให้ตรงกับชื่อบล็อก
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
    loadingText: { fontSize: '24px', color: '#888' },
    error: { color: 'red', marginBottom: '10px' },
    summaryChartContainer: { display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%', gap: '20px' },
    summaryContainer: { display: 'flex', flexDirection: 'column', gap: '20px', width: '25%' },
    summaryBox: { 
        minHeight: 'auto', // ลบความสูงคงที่ และให้มันยืดขนาดตามเนื้อหาที่แสดง
        backgroundColor: '#ffffff', 
        padding: '15px', 
        borderRadius: '15px', 
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', 
        textAlign: 'center',
        position: 'relative',
        display: 'flex',  // ใช้ flexbox
        justifyContent: 'space-between',  // ให้ข้อความอยู่ที่ขอบซ้ายและขวา
        alignItems: 'center',  // ให้ข้อความอยู่กึ่งกลางในแนวตั้ง
    },

    salesCountBox: { 
        backgroundColor: '#ffffff', 
        padding: '5px', 
        borderRadius: '15px', 
        height: '78px', 
        display: 'flex', 
        justifyContent: 'space-between', // ให้ข้อความอยู่ที่ขอบซ้ายและขวา
        alignItems: 'center', 
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', 
        marginRight: '10px', // เพิ่มระยะห่างจากขอบขวา
    },
    
        totalSalesValue: { 
        fontSize: '16px', 
        fontWeight: 'bold', 
        color: '#8196abff',
        margin: '5px 10px', // เพิ่ม margin สำหรับระยะห่างระหว่างแต่ละข้อความ
    },
    totalSalesValueContainer: { 
        display: 'flex', 
        justifyContent: 'flex-end',
        justifyContent: 'center', 
        alignItems: 'center', 
        flexDirection: 'column', 
        marginTop: '10px', 
    },
    salesCountValue: { 
        fontSize: '17px', 
        fontWeight: 'bold', 
        color: '#8196ab',  // สีสำหรับตัวเลขจำนวนการขาย
        textAlign: 'left', 
        marginLeft: '10px',
    },
    salesCountValueMonth: {
        fontSize: '17px',
        fontWeight: 'bold',
        color: '#8196ab', // สีสำหรับข้อมูล "เดือนนี้"
        textAlign: 'left',
        marginLeft: '10px',
    },
    salesCountTitle: { 
        fontSize: '18px', 
        fontWeight: 'bold', 
        color: '#315859',  // สีสำหรับหัวข้อ "จำนวนการขาย"
        textAlign: 'left', 
        marginLeft: '10px',
    },
    chartBox: { flex: 3, backgroundColor: '#ffffff', padding: '20px', borderRadius: '15px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center', minHeight: '300px', maxHeight: '400px' },
    chartTitle: { fontSize: '16px', color: '#000', marginBottom: '15px', fontWeight: 'bold' },
    summaryTitle: { 
        fontSize: '20px', 
        fontWeight: 'bold', 
        color: '#315859',
        margin: 0, // เอา margin ออก
        textAlign: 'left', // ให้ข้อความอยู่ทางซ้าย
    }, 
    summaryChartContainer: {
        display: 'flex',
        flexDirection: 'row',  /* จัดเรียงบล็อกในแนวนอน */
        alignItems: 'flex-start',
        justifyContent: 'space-between',  /* ให้มีช่องว่างระหว่างบล็อก */
        gap: '20px', /* ระยะห่างระหว่างบล็อก */
        width: '100%',
    },
    buttonContainer: {
        display: "flex",
        justifyContent: "center",
        gap: "15px",
        flexWrap: "wrap",
        marginBottom: "10px",
        
    },
    icon: {
        cursor: "pointer",
        transition: "transform 0.2s ease, color 0.2s ease",
        color: "#888", // ✅ สีปกติ
    },
    selectedIcon: {
        cursor: "pointer",
        transform: "scale(1.1)", // ✅ ขยายเล็กน้อยเมื่อถูกเลือก
        color: "#3498db", // ✅ เปลี่ยนเป็นสีฟ้าเมื่อถูกเลือก
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)", // ✅ เพิ่มเงาเพื่อให้เด่นขึ้น
    },
    button: {
        width: "40px", 
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        backgroundColor: "#eee", // พื้นหลังปกติ
        fontSize: "14px",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        
    },
    raisedButton: {
        transform: "translateY(-4px)", // ยกสูงขึ้นเล็กน้อย
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)", // เงาเบาๆ
    },
    raisedIcon: {
        transform: "translateY(-4px)", // ยกขึ้นเล็กน้อย
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)", // เงาเบาๆ
        cursor: "pointer",
    },
    chartTypeSelector: {
        display: "flex",
        alignItems: "center", // ✅ จัดให้ไอคอนอยู่แนวเดียวกัน
        justifyContent: "flex-end", // ✅ ชิดขวา
        gap: "8px", // ✅ เพิ่มระยะห่างระหว่างไอคอน
        width: "100%", 
        paddingRight: "10px", 
        marginTop: "0px", // ✅ ลดระยะห่างให้แนบกับปุ่มเลือกโหมดแสดงผล
    },
    
    activeButton: {
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        backgroundColor: "#3498db",
        color: "#fff",
        fontSize: "14px",
    },
    chartContainer: {
        width: "100%",
        height: "auto",
        maxHeight: "400px", // ป้องกันการขยายเกิน
    },
    listWrapper: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        overflowY: "auto", // ✅ อนุญาตให้เลื่อนแนวตั้ง
        overflowX: "hidden", // ✅ ปิดการเลื่อนแนวนอน
        maxHeight: "340px", // ✅ ปรับความสูงให้รายการอยู่ใกล้ชื่อบล็อก
        paddingLeft: "10px",
        marginTop: "-25px", // ✅ ขยับขึ้นไปใกล้ชื่อบล็อก
        scrollbarWidth: "none", // ✅ ปิดแสดง scrollbar บน Firefox
        msOverflowStyle: "none", // ✅ ปิดแสดง scrollbar บน IE และ Edge
    },
    
    // ปรับส่วนของรายการอาหาร
    listContainer: {
        display: "flex",
        flexDirection: "column",
        listStyleType: "none",
        padding: "0px",  // ✅ เอา padding ออก
        margin: "0px",   // ✅ เอา margin ออก
        width: "100%",
        gap: "9px",      // ✅ ลดระยะห่างระหว่างรายการ
    },

    listItem: {
        display: "flex",
        justifyContent: "space-between", // ✅ กระจายเนื้อหาไปสุดซ้าย-ขวา
        alignItems: "center",
        padding: "4px 8px",
        fontSize: "14px",
        backgroundColor: "#f8f9fa",
        borderRadius: "5px",
        transition: "background 0.3s ease",
        cursor: "pointer",
        minWidth: "200px", // ✅ ขยายพื้นที่ให้เหมาะสม
        gap:"10px"
    },
    
    
    
    listItemHover: {
        backgroundColor: "#e9ecef",
    },
    itemNameHover: {
        color: "#007bff", // ✅ เปลี่ยนสีเป็นฟ้าเมื่อโฮเวอร์
        fontWeight: "bold",
    },
    itemIndex: {
        width: "25px", // ✅ กำหนดความกว้างให้ตัวเลข
        textAlign: "left",
        fontWeight: "bold",
        color: "#343c43",
    },
    itemSales: {
        fontWeight: "bold",
        color: "#2185f0",
        textAlign: "right",
        whiteSpace: "nowrap", // ✅ ป้องกันการขึ้นบรรทัดใหม่
        minWidth: "10px", // ✅ ป้องกันการถูกบีบให้เล็กเกินไป
        marginLeft: "auto", // ✅ ดันไปชิดขวา
    },
    itemName: {
        flex: 1,
        textAlign: "left", // ✅ จัดชิดซ้าย
        paddingLeft: "10px", // ✅ เพิ่ม padding ซ้ายเพื่อไม่ให้ติดขอบเกินไป
        fontWeight: "500",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        color: "#315859", // ✅ ใช้สีเขียวอมน้ำเงินให้เข้ากับระบบ
    },
    
    
    tableContainer: { marginTop: '20px', textAlign: 'left', width: '80%', margin: 'auto' },
    container: { 
        backgroundColor: '#f8fbff', 
        padding: '20px', 
        borderRadius: '10px', 
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', 
        textAlign: 'center', 
        width: '90%', 
        margin: 'auto' 
    },
    title: { 
        fontSize: '20px', 
        fontWeight: 'bold', 
        color: '#333', 
        marginBottom: '15px' 
    },
    buttonContainer: { 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '15px', 
        gap: '10px' 
    },
    button: { 
        padding: '8px 16px', 
        borderRadius: '5px', 
        border: 'none', 
        cursor: 'pointer', 
        backgroundColor: '#ccc', 
        fontSize: '14px' 
    },
    activeButton: { 
        padding: '8px 16px', 
        borderRadius: '5px', 
        border: 'none', 
        cursor: 'pointer', 
        backgroundColor: '#3498db', 
        color: '#fff', 
        fontSize: '14px' 
    },
    chartContainer: { 
        width: '80%', 
        height: '300px', 
        margin: 'auto' 
    },
    topSellingHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        marginBottom: "10px",
    },
    chartText: {
        cursor: "pointer",
        color: "#777",
        transition: "color 0.2s ease",
    },
    selectedChartText: {
        cursor: "pointer",
        color: "#000",
        fontWeight: "bold",
        textDecoration: "underline",
    },
    customLegend: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        marginTop: "10px",
    },
    legendGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, auto)", // ✅ ทำให้ legend มี 2 คอลัมน์
        gap: "10px 20px",
    },
    legendItem: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    legendColor: {
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        display: "inline-block",
    },
    legendText: {
        fontSize: "14px",
        color: "#333",
    },
    
};
