import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BackendSidebar from './components/backendsidebar';
import { Line } from 'react-chartjs-2';  // เปลี่ยนจาก Bar เป็น Line
import Chart from 'chart.js/auto';
import { FiTrendingUp, FiBarChart, FiShoppingCart, FiPackage, FiDownload  } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement } from 'chart.js';
import { FaChartBar, FaList, FaChartPie } from "react-icons/fa"; 
import { Doughnut } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import config from '../lib/config';  // ใช้ config ในไฟล์ที่ต้องการ

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
        const [isHovered, setIsHovered] = useState(false);

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

        const downloadChart = () => {
            const chartElement = document.getElementById("salesChart"); // ระบุ ID ของบล็อคกราฟที่ต้องการ capture
        
            if (!chartElement) {
                console.error("ไม่พบกราฟ");
                return;
            }
        
            html2canvas(chartElement, { backgroundColor: null }).then(canvas => {
                const link = document.createElement("a");
                link.href = canvas.toDataURL("image/png");
                link.download = "sales_chart.png";
                link.click();
            });
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

        const prepareDailyChartData = (chartType) => {
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
                        label: 'มูลค่าการขาย', // ✅ เปลี่ยนชื่อให้ทันสมัยขึ้น
                        data: salesAmounts,
                        backgroundColor: chartType === 'bar' 
                            ? ['#1396ce', '#1A73E8', '#34A853', '#FBBC05', '#EA4335'] 
                            : (context) => {
                                const chart = context.chart;
                                const { ctx, chartArea } = chart;
                                if (!chartArea) return null;
                                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                                gradient.addColorStop(0, 'rgba(52, 152, 219, 0.9)');
                                gradient.addColorStop(0.5, 'rgba(52, 152, 219, 0.5)');
                                gradient.addColorStop(1, 'rgba(52, 152, 219, 0.1)');
                                return gradient;
                            },
                        borderColor: chartType === 'bar' ? '#0b7db1' : '#2980b9',
                        borderWidth: 3,
                        hoverBackgroundColor: '#2c82c9',
                        hoverBorderWidth: 5,
                        fill: chartType === 'bar' ? false : true,
                        tension: 0.3, // ✅ ทำให้เส้นกราฟโค้งเนียนขึ้น
                        pointBackgroundColor: (context) => {
                            const index = context.dataIndex;
                            return ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5'][index % 5]; // ✅ เปลี่ยนสีจุดตามลำดับ
                        },
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 3,
                        pointHoverRadius: 9, // ✅ ขยายขนาดจุดเมื่อโฮเวอร์
                        pointHoverBorderWidth: 6,
                        pointStyle: 'circle', // ✅ ให้จุดเป็นวงกลม
                        animation: {
                            duration: 2000, // ✅ ทำให้กราฟโหลดช้าๆ
                            easing: 'easeInOutExpo',
                        },
                    },
                ],
            };
            
        };
        const prepareMonthlyChartData = (chartType) => {
            const selectedYear = startDate.split('-')[0];
        
            const allMonths = Array.from({ length: 12 }, (_, i) => ({
                label: new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(new Date(selectedYear, i)),
                key: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
            }));
        
            const salesAmounts = allMonths.map(item => {
                const filteredSales = salesData.filter(dataItem => {
                    const date = new Date(dataItem.order_date);
                    return date.getFullYear() === parseInt(selectedYear, 10) &&
                        (date.getMonth() + 1) === parseInt(item.key.split('-')[1], 10);
                });
                return filteredSales.reduce((acc, item) => acc + (parseFloat(item.net_amount) || 0), 0);
            });
        
            return {
                labels: allMonths.map(item => item.label),
                datasets: [
                    {
                        label: 'มูลค่าการขายต่อเดือน', // ✅ เปลี่ยนชื่อให้ทันสมัยขึ้น
                        data: salesAmounts,
                        backgroundColor: chartType === 'bar' 
                            ? ['#1A73E8', '#34A853', '#FBBC05', '#EA4335', '#0b7db1'] 
                            : (context) => {
                                const chart = context.chart;
                                const { ctx, chartArea } = chart;
                                if (!chartArea) return null;
                                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                                gradient.addColorStop(0, 'rgba(52, 152, 219, 0.9)');
                                gradient.addColorStop(0.5, 'rgba(52, 152, 219, 0.5)');
                                gradient.addColorStop(1, 'rgba(52, 152, 219, 0.1)');
                                return gradient;
                            },
                        borderColor: chartType === 'bar' ? '#1E88E5' : '#2980b9',
                        borderWidth: 3,
                        hoverBackgroundColor: '#2c82c9',
                        hoverBorderWidth: 5,
                        fill: chartType === 'bar' ? false : true,
                        tension: 0.3, // ✅ ทำให้เส้นกราฟโค้งเนียนขึ้น
                        pointBackgroundColor: (context) => {
                            const index = context.dataIndex;
                            return ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5'][index % 5]; // ✅ เปลี่ยนสีจุดตามลำดับ
                        },
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 3,
                        pointHoverRadius: 9, // ✅ ขยายขนาดจุดเมื่อโฮเวอร์
                        pointHoverBorderWidth: 6,   
                        pointStyle: 'circle', // ✅ ให้จุดเป็นวงกลม
                        animation: {
                            duration: 2000, // ✅ ทำให้กราฟโหลดช้าๆ
                            easing: 'easeInOutExpo',
                        },
                    },
                ],
            };
        };
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false, // ✅ ปิดการรักษาสัดส่วนของกราฟ
            layout: {
                padding: {
                    top: 10,
                    bottom: 10,
                    left: 15,
                    right: 15
                }
            },
            animation: {
                duration: 2000, // ✅ เพิ่ม smooth animation
                easing: 'easeInOutCubic',
            },
            hover: {
                mode: 'nearest',
                intersect: true,
                animationDuration: 500, // ✅ ทำให้ hover ดู smooth
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom', // ✅ Legend อยู่ด้านล่าง
                    align: 'center',
                    labels: {
                        font: { size: 14, family: 'Arial, sans-serif', weight: 'bold' },
                        color: '#2c3e50',
                        boxWidth: 15,
                        padding: 20,
                    },
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(44, 62, 80, 0.9)', // ✅ ใช้สีเข้ม
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 14, weight: '500' },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    shadowColor: 'rgba(0, 0, 0, 0.3)',
                    shadowBlur: 10,
                    callbacks: {
                        label: function (tooltipItem) {
                            let value = tooltipItem.raw.toLocaleString();
                            return `💰 ยอดขาย: ${value} บาท`; // ✅ เพิ่ม Icon ให้ดู Friendly
                        },
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 14, family: 'Arial, sans-serif' },
                        color: '#7f8c8d',
                        padding: 10,
                        
                    },
                },
                y: {
                    beginAtZero: true, // ✅ ให้เริ่มที่ 0
                    suggestedMax: Math.max(...salesData.map(d => d.net_amount)) * 1.2, // ✅ ขยายกราฟขึ้นไป 20%
                    grid: {
                        color: function (context) { 
                            return context.tick.value === 0 ? '#bdc3c7' : 'rgba(189, 195, 199, 0.3)';
                        },
                    },
                    ticks: {
                        font: { size: 14, family: 'Arial, sans-serif' },
                        color: '#7f8c8d',
                        callback: function (value) {
                            return `฿${value.toLocaleString()}`;
                        },
                        padding: 10,
                    },
                },
            },
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
        
            // เรียงสินค้าตามจำนวนที่ขายได้ (จากมากไปน้อย)
            const sortedItems = topSellingItems
                .sort((a, b) => b.sales - a.sales)  // เรียงจากมากไปหาน้อย
                .slice(0, 10); // เลือก 10 อันดับแรก

            const labels = sortedItems.map(item => item.p_name);
            const salesData = sortedItems.map(item => item.sales || 0);
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
                                {totalSales ? totalSales.toLocaleString() : 0}
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
                                                                return `${value} ชิ้น (${percentage}%)`; // แสดง % ใน tooltip
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
                                            {/* ตรวจสอบก่อนว่ามีข้อมูลใน topSellingItems หรือไม่ */}
                                            {Array.isArray(topSellingItems) && topSellingItems.length > 0 ? (
                                                topSellingItems.slice(0, 10).map((item, index) => (
                                                    <li
                                                        key={index}
                                                        style={{
                                                            ...styles.listItem,
                                                            ...(hoverIndex === index ? styles.listItemHover : {}),
                                                        }}
                                                        onMouseEnter={() => setHoverIndex(index)}
                                                        onMouseLeave={() => setHoverIndex(null)}
                                                    >
                                                        <span style={styles.itemIndex}>{index + 1}.</span>
                                                        <span
                                                            style={{
                                                                ...styles.itemName,
                                                                ...(hoverIndex === index ? styles.itemNameHover : {}),
                                                            }}
                                                        >
                                                            {/* ตรวจสอบว่า p_name มีค่าหรือไม่ก่อนการแสดง */}
                                                            {item.p_name || 'ไม่พบชื่อสินค้า'}
                                                        </span>
                                                        <span style={styles.itemSales}>
                                                            {/* ตรวจสอบว่า sale_total และ sales มีค่าหรือไม่ */}
                                                            {item.sale_total ? item.sale_total.toLocaleString() : '0'} / 
                                                            {item.sales ? item.sales.toLocaleString() : '0'} ชิ้น
                                                        </span>
                                                    </li>
                                                ))
                                            ) : (
                                                <p>ไม่พบข้อมูลสินค้าขายดี</p>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ส่วนของกราฟยอดขาย */}
                    <div style={styles.chartBox}>
                        <div style={styles.chartHeader}>
                            <h3 style={styles.chartTitle}>
                                {viewType === 'daily' ? "รายงานยอดขายรายวัน" : "กราฟแสดงยอดขายต่อเดือน"}
                            </h3>

                            {/* 🔹 ปุ่มเลือกประเภทกราฟ */}
                            <div style={styles.chartTypeSelector}>
                                <button
                                    style={{
                                        ...styles.iconButton,
                                        ...(chartType === 'line' ? styles.iconButtonActive : {}),
                                    }}
                                    onClick={() => setChartType('line')}
                                >
                                    <FiTrendingUp size={20} />
                                </button>

                                <button
                                    style={{
                                        ...styles.iconButton,
                                        ...(chartType === 'bar' ? styles.iconButtonActive : {}),
                                    }}
                                    onClick={() => setChartType('bar')}
                                >
                                    <FiBarChart size={20} />
                                </button>

                                <button
                                    style={{
                                        ...styles.downloadButton,
                                        ...(isHovered ? styles.downloadButtonHover : {}),
                                    }}
                                    onMouseEnter={() => setIsHovered(true)}
                                    onMouseLeave={() => setIsHovered(false)}
                                    onClick={downloadChart}
                                >
                                    <FiDownload size={20} />
                                </button>
                            </div>
                        </div>
                        {/* 🔹 แสดงกราฟตามประเภทที่เลือก */}
                        <div id="salesChart" style={{ width: "100%", height: "auto", minHeight: "600px", maxWidth: "100%" }}>
                            {chartType === 'bar' ? (
                                <Bar data={viewType === 'daily' ? prepareDailyChartData() : prepareMonthlyChartData()} options={chartOptions} />
                            ) : (
                                <Line data={viewType === 'daily' ? prepareDailyChartData() : prepareMonthlyChartData()} options={chartOptions} />
                            )}
                        </div>
                    </div>
                </div>
                    )}
                </div>
            </div>
        );;
    }

const styles = { 
    pageContainer: { display: 'flex', minHeight: '90vh', overflowY: 'auto', overflowX: 'hidden', marginRight: '0px' }, 
    content: { flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', resize: 'both', overflow: 'auto', width: '85%', minHeight: '650px', maxHeight: '87vh', border: '1px solid #ffffff', borderRadius: '10px', marginLeft: '120px', marginRight: '5px', marginTop: '15px', backgroundColor: '#f3f9ffbd' }, 
    titleWithHighlight: { fontSize: '24px', fontWeight: 'bold', color: '#000', marginBottom: '20px', textAlign: 'left' }, 
    filterContainer: { display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '20px', justifyContent: 'flex-start' }, 
    label: { fontSize: '20px', color: '#18373f' }, 
    select: { padding: '12px', border: '1px solid #eefeff', borderRadius: '8px' }, 
    circleButtonContainer: { display: 'flex', gap: '10px' }, 
    circleButton: { padding: '8px 16px', fontSize: '14px', borderRadius: '30px', border: 'none', color: '#fff', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', transform: 'scale(1)' }, 
    topSellingBox: { flex: 1, backgroundColor: "#fff", borderRadius: "15px", padding: "15px", paddingTop: "1px", minWidth: "330px", maxWidth: "100%", maxHeight: "auto", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", resize: "both" }, 
    loadingText: { fontSize: '24px', color: '#888' }, 
    error: { color: 'red', marginBottom: '10px' }, 
    summaryChartContainer: { display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%', gap: '20px' }, 
    summaryContainer: { display: 'flex', flexDirection: 'column', gap: '20px', width: '25%' }, 
    summaryBox: { minHeight: 'auto', backgroundColor: '#ffffff', padding: '15px', borderRadius: '15px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center', position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, 
    salesCountBox: { backgroundColor: '#ffffff', padding: '5px', borderRadius: '15px', height: '78px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', marginRight: '1px' }, 
    totalSalesValueContainer: { display: 'flex', justifyContent: 'flex-end', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', marginTop: '10px' }, 
    totalSalesValue: { fontSize: '18px', fontWeight: 'bold', color: '#3498db', margin: '5px 0', paddingLeft: '15px', textAlign: 'left' }, 
    salesCountValue: { fontSize: '18px', fontWeight: 'bold', color: '#3498db', margin: '5px 0', paddingLeft: '15px', textAlign: 'left' }, 
    salesCountValueMonth: { fontSize: '18px', fontWeight: 'bold', color: '#3498db', margin: '5px 0', paddingLeft: '15px', textAlign: 'left' }, 
    salesCountTitle: { fontSize: '20px', fontWeight: 'bold', color: '#18373f', textAlign: 'left', marginLeft: '10px' }, 
    chartTitle: { fontSize: '16px', color: '#201f1f', marginBottom: '0px', fontWeight: 'bold' }, 
    summaryTitle: { fontSize: "20px", fontWeight: "bold", color: "#18373f", textAlign: "left", marginBottom: "25px" }, 
    summaryChartContainer: { display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', width: '100%', flexWrap: "wrap" }, 
    buttonContainer: { display: "flex", justifyContent: "center", gap: "15px", flexWrap: "wrap", marginBottom: "10px" }, 
    icon: { cursor: "pointer", transition: "transform 0.2s ease, color 0.2s ease", color: "#888" }, 
    selectedIcon: { cursor: "pointer", transform: "scale(1.1)", color: "#3498db", boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)" }, 
    button: { width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", cursor: "pointer", backgroundColor: "#eee", fontSize: "14px", transition: "transform 0.2s ease, box-shadow 0.2s ease" }, 
    raisedButton: { transform: "translateY(-4px)", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)" }, 
    raisedIcon: { transform: "translateY(-4px)", boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)", cursor: "pointer" }, 
    chartTypeSelector: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", width: "100%", paddingRight: "0px" }, 
    iconButtonActive: { background: "linear-gradient(135deg, #007bff, #0056b3)", transform: "scale(1.08)", boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.3)" }, 
    iconButton: { width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #cccccc, #999999)", color: "#ffffff", fontSize: "16px", transition: "all 0.3s ease-in-out", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.15)" }, 
    activeButton: { width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", cursor: "pointer", backgroundColor: "#3498db", color: "#fff", fontSize: "14px" }, 
    chartContainer: { flexGrow: 1, width: "100%", minHeight: "400px", height: "100%" }, 
    listWrapper: { display: "flex", flexDirection: "column", width: "100%", overflowY: "auto", overflowX: "hidden", maxHeight: "340px", paddingLeft: "10px", marginTop: "-25px", scrollbarWidth: "none", msOverflowStyle: "none" }, 
    listContainer: { display: "flex", flexDirection: "column", listStyleType: "none", padding: "5px 10px", margin: "0px", width: "100%", gap: "5px" }, 
    listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", fontSize: "14px", borderRadius: "5px", transition: "all 0.3s ease", cursor: "pointer", minWidth: "200px", gap: "10px" }, 
    listItemHover: { backgroundColor: "#e1f5fe", transform: "scale(1.02)", boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.1)" }, 
    itemNameHover: { color: "#007bff", fontWeight: "bold", transition: "color 0.2s ease-in-out" }, 
    itemIndex: { width: "25px", textAlign: "left", fontWeight: "bold", color: "#343c43" }, 
    itemSales: { fontWeight: "bold", color: "#2185f0", textAlign: "right", whiteSpace: "nowrap", minWidth: "10px", marginLeft: "auto" }, 
    itemName: { flex: 1, textAlign: "left", paddingLeft: "10px", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#315859" }, 
    tableContainer: { marginTop: '20px', textAlign: 'left', width: '80%', margin: 'auto' }, 
    container: { backgroundColor: '#f8fbff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center', width: '90%', margin: 'auto' }, 
    title: { fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '15px' }, 
    buttonContainer: { display: 'flex', justifyContent: 'center', marginBottom: '15px', gap: '10px' }, 
    button: { padding: '8px 16px', borderRadius: '5px', border: 'none', cursor: 'pointer', backgroundColor: '#ccc', fontSize: '14px' }, 
    activeButton: { padding: '8px 16px', borderRadius: '5px', border: 'none', cursor: 'pointer', backgroundColor: '#3498db', color: '#fff', fontSize: '14px' }, 
    chartContainer: { width: '80%', height: '300px', margin: 'auto' }, 
    topSellingHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "0px" }, 
    chartText: { cursor: "pointer", color: "#777", transition: "color 0.2s ease" }, 
    selectedChartText: { cursor: "pointer", color: "#000", fontWeight: "bold", textDecoration: "underline" }, 
    customLegend: { display: "flex", flexWrap: "wrap", justifyContent: "center", marginTop: "10px" }, 
    legendGrid: { display: "grid", gridTemplateColumns: "repeat(2, auto)", gap: "10px 20px" }, 
    legendItem: { display: "flex", alignItems: "center", gap: "8px" }, 
    legendColor: { width: "12px", height: "12px", borderRadius: "50%", display: "inline-block" }, 
    legendText: { fontSize: "14px", color: "#333" }, 
    chartBox: { flex: 3, backgroundColor: "#ffffff", padding: "20px", borderRadius: "15px", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "space-between", minHeight: "600px", height: "auto", maxHeight: "600px" }, 
    chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0px" }, 
    chartTitle: { fontSize: "16px", color: "#000", fontWeight: "bold" }, 
    chartTypeSelector: { display: "flex", gap: "10px" }, 
    button: { padding: "8px 16px", borderRadius: "5px", border: "1px solid #ccc", cursor: "pointer", backgroundColor: "#eee", fontSize: "14px", transition: "all 0.3s ease" }, 
    activeButton: { padding: "8px 16px", borderRadius: "5px", border: "none", cursor: "pointer", backgroundColor: "#3498db", color: "#fff", fontSize: "14px", transition: "all 0.3s ease", transform: "scale(1.1)" }, 
    downloadButton: { width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #28a745, #1e7e34)", color: "#ffffff", fontSize: "16px", transition: "all 0.3s ease-in-out", boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.15)" }, 
    downloadButtonHover: { background: "linear-gradient(135deg, #1e7e34, #155d27)", transform: "scale(1.08)", boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.3)" },

    /* Additional styles for smaller screens (media queries) */
    '@media (max-width: 768px)': {
        pageContainer: { flexDirection: 'column' },
        content: { width: '100%', marginLeft: 0, marginRight: 0 },
        chartContainer: { minHeight: '300px' },
    },
};
