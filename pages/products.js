"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from './components/sidebar';
import Image from 'next/image';
import { FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useRouter } from 'next/router';

const api_url = "https://easyapp.clinic/pos-api";
const slug = "abc";
const authToken = "R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH";

export default function SalesPage() {
    const [products, setProducts] = useState([]);
    const router = useRouter();
    const { tableCode } = router.query;
    const [cart, setCart] = useState([]);
    const [receivedAmount, setReceivedAmount] = useState(0);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [billDiscount, setBillDiscount] = useState(0);
    const [billDiscountType, setBillDiscountType] = useState("THB");
    const [showReceipt, setShowReceipt] = useState(false);
    const [orderReceived, setOrderReceived] = useState(false);
    const [isBillPaused, setIsBillPaused] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [orderNumber, setOrderNumber] = useState("");
    const [categories, setCategories] = useState([]);
    const [isCategoryPopupOpen, setIsCategoryPopupOpen] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const VAT_RATE = 0.07;
    const [paymentMethod, setPaymentMethod] = useState(''); // เก็บวิธีการชำระเงินที่เลือก
    const [qrCode, setQrCode] = useState(null); // เก็บข้อมูล QR Code
    


    // Fetch products from API
    const fetchProducts = () => {
        const url = `${api_url}/api/${slug}/products`;
        console.log('Fetching products from:', url);
        axios.get(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        })
        .then((response) => setProducts(response.data))
        .catch((error) => console.error('Error fetching products:', error));
    };
    // Fetch categories from API
    const fetchCategories = () => {
        const url = `${api_url}/api/${slug}/category`;
        console.log('Fetching categories from:', url); // Debug URL
        axios.get(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        })
        .then(response => setCategories(response.data.categories))
        .catch(error => console.error('Error fetching categories:', error));
    };
    useEffect(() => {
        fetchProducts();
        fetchCategories();
        const interval = setInterval(fetchProducts, 5000);
        return () => clearInterval(interval);
    }, []);;
    useEffect(() => {
        fetchPaymentMethods(); // ดึงข้อมูลวิธีการชำระเงิน
    }, []);
    
    const handleCategorySelect = (categoryId) => {
        setSelectedCategoryId(categoryId);
    };
    const addToCart = async (product) => {
        if (product.status !== 'Y') return;
    
        const element = document.querySelector(`#product-${product.id}`);
        if (element) {
            element.style.animation = "none"; // รีเซ็ตการแอนิเมชั่นก่อนหน้า
            requestAnimationFrame(() => {
                element.style.animation = "shake 0.5s ease, highlight 1s ease";
            });
        }
    
        // เพิ่มสินค้าในตะกร้า (local state)
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.id === product.id);
            if (existingItem) {
                return prevCart.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                return [...prevCart, { ...product, quantity: 1, discount: 0, discountType: "THB" }];
            }
        });
    
        // ส่งข้อมูลสินค้าไปที่ฐานข้อมูล
        try {
            await addItemToDatabase(product);
        } catch (error) {
            console.error('ไม่สามารถเพิ่มสินค้าไปที่ฐานข้อมูลได้:', error);
        }
    };
    
    // ฟังก์ชันเพื่อเพิ่มสินค้าลงในฐานข้อมูล
    const addItemToDatabase = async (product) => {
        try {
            const orderData = {
                product_id: product.id,
                quantity: 1, // สมมุติว่าเพิ่มสินค้าจำนวน 1 ชิ้น
                price: product.price,
                total: product.price,
            };
    
            const response = await axios.post(`${api_url}/api/${slug}/order-items`, orderData, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
    
            if (response.data.success) {
                console.log('สินค้าถูกเพิ่มในฐานข้อมูลออร์เดอร์ไอเท็มเรียบร้อยแล้ว');
            } else {
                console.error('เกิดข้อผิดพลาดในการเพิ่มสินค้าในฐานข้อมูล:', response.data.message);
            }
        } catch (error) {
            console.error('ไม่สามารถส่งข้อมูลไปที่ฐานข้อมูลได้:', error);
        }
    };
    
    
    
    
    useEffect(() => {
        if (paymentMethod === 'qr') {
            fetchPaymentChannels(); // ดึง URL QR Code
        }
    }, [paymentMethod]);
    
    const updateQuantity = (productId, delta) => {
        setCart((prevCart) =>
            prevCart
                .map((item) =>
                    item.id === productId ? { ...item, quantity: item.quantity + delta } : item
                )
                .filter(item => item.quantity > 0)
        );
    };
    
    const handlePaymentChange = (selectedMethod) => {
        setPaymentMethod(selectedMethod); // เก็บวิธีการชำระเงินที่เลือกใน state
    };

    const clearCart = () => {
        Swal.fire({
            title: 'คุณแน่ใจหรือไม่?',
            text: "คุณต้องการเคลียเมนูทั้งหมดออกหรือไม่",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ใช่, เคลีย!',
            cancelButtonText: 'ยกเลิก',
        }).then((result) => {
            if (result.isConfirmed) {
                setCart([]);
                setReceivedAmount(0);
                setBillDiscount(0);
                setBillDiscountType("THB");
                setOrderReceived(false);
                setIsBillPaused(false);
                Swal.fire('เคลียแล้ว!', 'เมนูทั้งหมดถูกเคลียเรียบร้อยแล้ว', 'success');
            }
        });
    };

    const calculateDiscountedPrice = (price, discount, discountType) => {
        if (discountType === "THB") {
            return Math.max(price - discount, 0);
        } else if (discountType === "%") {
            return Math.max(price - (price * discount) / 100, 0);
        }
        return price;
    };

    const calculateTotalAfterItemDiscounts = () => {
        return cart.reduce((acc, item) => 
            acc + calculateDiscountedPrice(item.price, item.discount, item.discountType) * item.quantity
        , 0);
    };

    const calculateTotalWithBillDiscount = () => {
        const totalAfterItemDiscounts = calculateTotalAfterItemDiscounts(); // ยอดรวมหลังส่วนลดต่อชิ้น
        const totalWithDiscount = calculateDiscountedPrice(totalAfterItemDiscounts, billDiscount, billDiscountType); // ยอดรวมหลังส่วนลดบิล
        return totalWithDiscount; // ยอดรวมที่ต้องชำระ
    };

    const calculateVAT = () => {
        return calculateTotalWithBillDiscount() * VAT_RATE;
    };

    const handlePayment = () => {
        if (cart.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'ไม่มีสินค้าในตะกร้า',
                text: 'กรุณาเพิ่มสินค้าในตะกร้าก่อนทำการชำระเงิน',
                confirmButtonText: 'ตกลง',
            });
            return;
        }
    
        const totalAmount = calculateTotalWithBillDiscount();
        if (receivedAmount < totalAmount) {
            Swal.fire({
                icon: 'warning',
                title: 'ยอดชำระเงินไม่เพียงพอ',
                text: `กรุณารับเงินมาไม่น้อยกว่าหรือเท่ากับยอดรวม ${totalAmount} ก่อนทำการชำระเงิน`,
                confirmButtonText: 'ตกลง',
            });
            return;
        }
    
        // แสดงบิล (ไม่มีการบันทึกข้อมูลใด ๆ)
        setShowReceipt(true);
    };
    
    const filteredProducts = products.filter(product =>
        (!selectedCategoryId || product.category_id === selectedCategoryId) &&
        (product.p_name ? product.p_name.toLowerCase().includes(searchTerm.toLowerCase()) : false)
    );
    
    const sendOrder = async (orderData) => {
        try {
            const response = await axios.post(`${api_url}/api/${slug}/orders`, orderData, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
    
            if (response.data && response.data.order) {
                return response.data.order; // ส่งกลับข้อมูลออร์เดอร์
            } else {
                throw new Error('รูปแบบการตอบกลับจาก API ไม่ถูกต้อง');
            }
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการสร้างออร์เดอร์:', error.response?.data || error.message);
            throw new Error(`ไม่สามารถสร้างออร์เดอร์ได้: ${error.response?.data?.message || error.message}`);
        }
    };
    
    // ฟังก์ชันหลักสำหรับรับคำสั่งซื้อ (สร้าง order และบันทึกรายการ order_items)
    const receiveOrder = async () => {
        try {
            const userId = 1; // ตัวอย่าง ID ผู้ใช้งาน
            const orderData = {
                total_amount: calculateTotalAfterItemDiscounts(),
                discount: billDiscountType === 'THB' ? billDiscount : 0,
                discount_per: billDiscountType === '%' ? billDiscount : 0,
                vat_per: VAT_RATE * 100, // เปอร์เซ็นต์ VAT
                vat_amt: calculateVAT(), // จำนวน VAT
                net_amount: calculateTotalWithBillDiscount(), // จำนวนรวมสุทธิ
                status: 'N', // สถานะออร์เดอร์ (N = New)
                tables_id: tableCode || null, // ID โต๊ะ (ถ้ามี)
                created_by: userId, // ผู้สร้างออร์เดอร์
                items: cart.map((item) => ({
                    product_id: item.id || 0,
                    p_name: item.p_name || 'Unnamed Product',
                    quantity: item.quantity || 1,
                    price: item.price || 0,
                    total: calculateDiscountedPrice(item.price, item.discount, item.discountType) * item.quantity || 0,
                })),
            };
    
            // ส่งข้อมูลออร์เดอร์ไปยังเซิร์ฟเวอร์
            const newOrder = await sendOrder(orderData); // ฟังก์ชันสำหรับส่งข้อมูลออร์เดอร์
            setOrderNumber(newOrder.order_number); // รับหมายเลขออร์เดอร์จากการตอบกลับ
            setOrderId(newOrder.id); // เก็บ ID ออร์เดอร์
            setOrderReceived(true); // เปิดการเลือกชำระเงิน
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการรับออร์เดอร์:', error);
            Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
        }
    };

    const addOrderItems = async () => {
        if (!orderId) {
            // ถ้ายังไม่มียอดสั่งซื้อ ให้เรียกใช้ฟังก์ชันรับคำสั่งซื้อใหม่
            await receiveOrder();
        }

        const newItems = cart.map((item) => ({
            product_id: item.id || 0,
            p_name: item.p_name || 'ไม่มีชื่อสินค้า',
            quantity: item.quantity || 1,
            price: item.price || 0,
            total: calculateDiscountedPrice(item.price, item.discount, item.discountType) * item.quantity || 0,
        }));
        console.log('New Items:', newItems); // ตรวจสอบข้อมูลที่ส่งไป

        try {
            const response = await axios.post(
                `${api_url}/api/${slug}/orders/${orderId}/addItem`,
                { items: newItems },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                }
            );

            if (response.data && response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'เพิ่มรายการสินค้าเรียบร้อย',
                    text: 'รายการสินค้าใหม่ถูกเพิ่มเข้าไปในออเดอร์สำเร็จ!',
                    confirmButtonText: 'ตกลง',
                });
            } else {
                throw new Error(response.data.message || 'เกิดข้อผิดพลาดในการเพิ่มรายการสินค้า');
            }
        } catch (error) {
            console.error('Error adding order items:', error);
            Swal.fire('ผิดพลาด', `ไม่สามารถเพิ่มรายการสินค้าได้: ${error.message}`, 'error');
        }
    };

    const fetchPaymentMethods = async () => {
        const url = `${api_url}/api/${slug}/payChannels`; // URL สำหรับเรียกข้อมูลช่องทางการชำระเงิน
        try {
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`, // ใช้ Token เพื่อยืนยันสิทธิ์
                },
            });
    
            // ตรวจสอบว่า Response มีข้อมูลที่ต้องการหรือไม่
            if (response.status === 200 && Array.isArray(response.data)) {
                console.log('Payment Methods:', response.data);
                setPaymentMethods(response.data); // บันทึกข้อมูลช่องทางการชำระเงินใน State
            } else {
                console.error('Unexpected response format:', response.data);
                Swal.fire('ผิดพลาด', 'รูปแบบข้อมูลช่องทางการชำระเงินไม่ถูกต้อง', 'error');
            }
        } catch (error) {
            console.error('Error fetching payment channels:', error.response?.data || error.message);
    
            // แสดงข้อความผิดพลาดให้ผู้ใช้งานทราบ
            Swal.fire({
                icon: 'error',
                title: 'ผิดพลาด',
                text: 'ไม่สามารถดึงข้อมูลช่องทางการชำระเงินได้ กรุณาตรวจสอบการเชื่อมต่อหรือแจ้งผู้ดูแลระบบ',
                confirmButtonText: 'ตกลง',
            });
        }
    };

    const handleAmountButton = (amount) => {
        setReceivedAmount((prevAmount) => prevAmount + amount);
    };

    const resetAmount = () => {
        setReceivedAmount(0);
    };

    const handleFullAmount = () => {
        setReceivedAmount(calculateTotalWithBillDiscount());
    };

    const closeReceipt = async () => {
        const totalDue = calculateTotalWithBillDiscount(); // ยอดรวมที่ต้องชำระ
    
        if (receivedAmount < totalDue) {
            Swal.fire({
                icon: 'error',
                title: 'ยอดเงินไม่เพียงพอ',
                text: `กรุณาชำระเงินให้ครบ: ${totalDue.toFixed(2)} บาท`,
            });
            return;
        }
    
        try {
            // 1. บันทึกข้อมูลการชำระเงิน
            console.log('บันทึกการชำระเงิน...');
            await savePaymentToDatabase(orderId, paymentMethod, receivedAmount);
            
            // 2. อัปเดตสถานะบิลเป็น Y (ไม่ต้องตรวจสอบข้อผิดพลาด)
            console.log('อัปเดตสถานะบิล...');
            await axios.put(
                `${api_url}/api/${slug}/orders/${orderId}`,
                { status: 'Y' },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                }
            );
    
        } catch (error) {
            console.error('เกิดข้อผิดพลาด:', error.message);
            // ทำการข้ามไปแสดงข้อความบันทึกบิลสำเร็จ
        }
    
        // แสดงข้อความบันทึกบิลสำเร็จ และรีเซตสถานะเสมอ
        Swal.fire({
            icon: 'success',
            title: 'บันทึกบิลสำเร็จ',
            text: `บิลถูกปิดเรียบร้อยแล้ว! ยอดเงิน: ${totalDue.toFixed(2)} บาท`,
            confirmButtonText: 'ตกลง',
        }).then(() => {
            resetStateAfterSuccess();
        });
    };
    
    // ฟังก์ชันรีเซ็ตสถานะหลังบิลสำเร็จ
    const resetStateAfterSuccess = () => {
        setShowReceipt(false);
        setOrderReceived(false);
        setOrderId(null);
        setCart([]);
        setReceivedAmount(0);
        setBillDiscount(0);
        setBillDiscountType("THB");
        setIsBillPaused(false);
    };
    
    
    const handlePauseBill = () => {
        setShowReceipt(false);
        setIsBillPaused(true);
    };

    const handleItemDiscountChange = (id, discount, discountType) => {
        setCart((prevCart) => 
            prevCart.map((item) => 
                item.id === id ? { ...item, discount: discount, discountType: discountType } : item
            )
        );
    };
    const formatDateTime = (date) => {
        const pad = (num) => num.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };
   const savePaymentToDatabase = async (orderId, paymentMethod, amount) => {
        try {
            const url = `${api_url}/api/${slug}/payments`;
            const paymentData = {
                order_id: orderId,
                pay_channel_id: paymentMethod === 'cash' ? 1 : 2, // เงินสด หรือ QR Code
                payment_date: formatDateTime(new Date()), // ใช้ฟอร์แมตวันที่ที่ถูกต้อง
                amount,
                status: 'Y',
            };

            console.log('Sending payment data:', paymentData); // Debugging

            const response = await axios.post(url, paymentData, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            if (response.data && response.data.success) {
                console.log('บันทึกข้อมูลลงใน payments สำเร็จ:', response.data);
            } else {
                console.error('บันทึกข้อมูล payments ล้มเหลว:', response.data.message || 'ไม่ทราบข้อผิดพลาด');
            }
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลลงใน payments:', error.response?.data || error.message);
            throw new Error('ไม่สามารถบันทึกข้อมูลลงใน payments ได้');
        }
    };
    const fetchPaymentChannels = async () => {
        try {
            const response = await axios.get(`${api_url}/api/${slug}/payChannels`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            if (response.data) {
                const promptpayChannel = response.data.find(
                    (channel) => channel.type === "T" && channel.status === "Y"
                );

                if (promptpayChannel) {
                    setQrCode(promptpayChannel.promptpay_api); // เก็บ URL QR Code ใน state
                } else {
                    throw new Error('ไม่มีช่องทาง PromptPay ที่พร้อมใช้งาน');
                }
            }
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการดึงช่องทางชำระเงิน:', error.message);
            Swal.fire('ผิดพลาด', 'ไม่สามารถดึงข้อมูลช่องทางการชำระเงินได้', 'error');
        }
    };
    const handlePartialPayment = () => {
        const totalDue = calculateTotalWithBillDiscount(); // ยอดที่ต้องชำระทั้งหมด
    
        if (receivedAmount <= 0 || receivedAmount > totalDue) {
            Swal.fire({
                icon: 'error',
                title: 'ยอดเงินไม่ถูกต้อง',
                text: `กรุณาระบุยอดเงินที่ถูกต้อง (ไม่เกิน ${totalDue.toFixed(2)} บาท)`,
            });
            return;
        }
    
        const remainingTotal = totalDue - receivedAmount; // คำนวณยอดที่เหลือหลังแยกชำระ
    
        // อัปเดตสถานะการแยกชำระ
        Swal.fire({
            icon: 'success',
            title: 'แยกชำระเรียบร้อย',
            text: `ยอดที่ชำระ: ${receivedAmount.toFixed(2)} บาท\nยอดคงเหลือ: ${remainingTotal.toFixed(2)} บาท`,
        });
    
        // อัปเดตยอดรวมใหม่
        setBillDiscountType("THB"); // ตรวจสอบว่าส่วนลดเป็นแบบไหน
        setBillDiscount((prevDiscount) => prevDiscount + receivedAmount); // อัปเดตส่วนลดที่ใช้จ่ายไปแล้ว
    
        setReceivedAmount(0); // รีเซ็ตยอดรับเงิน
    
        // หากยอดรวมเหลือ 0 บาท ให้ปิดบิลโดยอัตโนมัติ
        if (remainingTotal <= 0) {
            closeReceipt(); // เรียกฟังก์ชันปิดบิล
        }
    };
    
    
    
    
    
// kkkkkk
    return (
        <div style={styles.pageContainer}>
            <div style={styles.sidebarContainer}>
                <Sidebar onCategorySelect={(categoryId) => setSelectedCategoryId(categoryId)} />
            </div>
            <div style={styles.mainContent}>
                <div style={styles.productListContainer}>
                <div style={styles.headerContainer}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
    <div style={{ ...styles.categoryRow, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div
            onClick={() => handleCategorySelect(null)}
            className="categoryCircle"
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            style={{ ...styles.categoryCircle, backgroundColor: '#499cae' }}
        >
            <span style={styles.iconText}>🍽️</span>
            <span style={styles.labelText}>ทั้งหมด</span>
        </div>
        <div
            onClick={() => handleCategorySelect(1)}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            style={{ ...styles.categoryCircle, backgroundColor: '#499cae' }}
        >
            <span style={styles.iconText}>🍛</span>
            <span style={styles.labelText}>เมนูผัด</span>
        </div>
        <div
            onClick={() => handleCategorySelect(2)}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            style={{ ...styles.categoryCircle, backgroundColor: '#499cae' }}
        >
            <span style={styles.iconText}>🍚</span>
            <span style={styles.labelText}>ข้าวผัด</span>
        </div>
        <div
            onClick={() => handleCategorySelect(3)}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            style={{ ...styles.categoryCircle, backgroundColor: '#499cae' }}
        >
            <span style={styles.iconText}>🥗</span>
            <span style={styles.labelText}>เมนูยำ</span>
        </div>
        <div
            onClick={() => handleCategorySelect(4)}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            style={{ ...styles.categoryCircle, backgroundColor: '#499cae' }}
        >
            <span style={styles.iconText}>🍲</span>
            <span style={styles.labelText}>ข้าวต้ม</span>
        </div>
        <div
            onClick={() => handleCategorySelect(5)}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            style={{ ...styles.categoryCircle, backgroundColor: '#499cae' }}
        >
            <span style={styles.iconText}>🍹</span>
            <span style={styles.labelText}>เครื่องดื่ม</span>
        </div>
    </div>
</div>


    <div style={styles.searchAndTableCodeContainer}>
        <div style={styles.searchContainer}>
            <h5 style={styles.tableCode}>โต๊ะ: {tableCode}</h5>
            <input 
                type="text" 
                placeholder="ค้นหาชื่ออาหาร..." 
                style={styles.searchInput} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <p style={styles.productCount}>รายการ: {filteredProducts.length}</p>
        </div>
    </div>
</div>

<div style={styles.products}>
    {filteredProducts.map((product) => (
        <div
            key={product.id}
            id={`product-${product.id}`} // เพิ่ม ID สำหรับ Animation
            style={{
                ...styles.productCard,
                position: 'relative',
                cursor: product.status === 'Y' ? 'pointer' : 'not-allowed',
            }}
            onClick={() => addToCart(product)} // เรียกฟังก์ชันเมื่อคลิก
        >
            {product.status === 'N' && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '1.5em',
                        fontWeight: 'bold',
                    }}
                >
                    หมด
                </div>
            )}
            {product.image ? (
                <Image
                    src={`${api_url}/storage/app/public/product/${slug}/${product.image}`}
                    alt={product.p_name}
                    width={100}
                    height={100}
                    quality={100}
                    style={styles.productImage}
                />
            ) : (
                <div style={styles.noImage}>
                    <span style={styles.noImageText}>ไม่มีภาพ</span>
                </div>
            )}
            <div style={styles.productDetails}>
                <p style={styles.productName}>{product.p_name}</p>
                <p style={styles.productPrice}>{product.price.toFixed(2)}</p>
            </div>
        </div>
    ))}
</div>

                </div>
            </div>
            <div style={styles.cart}>
            <div style={{ ...styles.cartHeader, position: 'sticky', top: 0, zIndex: 100 }}>

        <div style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: '#d33' }}>
            <Image src="/images/shopping.png" alt="รายการสั่งซื้อ" width={24} height={24} />
            <h2 style={{ marginLeft: '10px' }}>
                ({cart.reduce((acc, item) => acc + item.quantity, 0)})
            </h2>
        </div>
        <button onClick={clearCart} style={styles.clearCartButton}>
            <FaTrash />
        </button>
         </div>

        {/* แสดงรายการสินค้า */}
        <div style={{ 
            ...styles.cartItems, 
            flexDirection: 'column',  // เปลี่ยนให้รายการเริ่มจากด้านบน
            minHeight: '100px',  // กำหนดความสูงขั้นต่ำที่ต้องการ
            flexGrow: 1,  // ใช้ flex-grow เพื่อให้พื้นที่ขยายตามเนื้อหา
            
            overflowY: 'auto',  // ให้พื้นที่เลื่อนขึ้นมาได้
            marginTop: '0px', // เพิ่มระยะห่างเพื่อให้ไม่ทับกับหัวข้อ
        }}>
            {cart.map((item) => (
                <div key={item.id} style={styles.cartItem}>
                    {item.image ? (
                        <Image
                            src={`${api_url}/storage/app/public/product/${slug}/${item.image}`}
                            alt={item.p_name}
                            width={40}
                            height={40}
                            quality={100}
                            style={styles.cartItemImage}
                        />
                        
                    ) : (
                        <div style={styles.noImage}>
                            <span style={styles.noImageText}>ไม่มีภาพ</span>
                        </div>
                    )}
                    <div style={styles.cartItemDetails}>
                        <p style={styles.cartItemName}>{item.p_name}</p>
                        <div style={styles.cartItemPriceDiscountRow}>
                            <p style={styles.cartItemPrice}>ราคา {item.price.toFixed(2)} บาท</p>
                            <div style={styles.discountContainer}>
                                <input
                                    type="number"
                                    value={item.discount === 0 ? '' : item.discount}
                                    placeholder="ส่วนลด"
                                    onChange={(e) =>
                                        handleItemDiscountChange(
                                            item.id,
                                            parseFloat(e.target.value) || 0,
                                            item.discountType
                                        )
                                    }
                                    style={{ flex: '1', width: '60px' }}
                                />
                                <select
                                    value={item.discountType}
                                    onChange={(e) =>
                                        handleItemDiscountChange(item.id, item.discount, e.target.value)
                                    }
                                    style={{ flex: '1', width: '50px' }}
                                >
                                    <option value="THB">บาท (฿)</option>
                                    <option value="%">%</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div style={styles.quantityControls}>
                        <button
                            onClick={() => updateQuantity(item.id, -1)}
                            style={styles.quantityButton}
                        >
                            -
                        </button>
                        <span style={styles.quantityDisplay}>{item.quantity}</span>
                        <button
                            onClick={() => updateQuantity(item.id, 1)}
                            style={styles.quantityButton}
                        >
                            +
                        </button>
                    </div>
                </div>
            ))}
        </div>

        {/* บล็อกรวมยอดรวม */}
<div
    style={{
        ...styles.totalContainer,
        boxShadow: '0 8px 15px rgba(0, 0, 0, 0.15)', // เงาชัดเจนขึ้น
        position: 'sticky', // ใช้ sticky เพื่อให้บล็อคติดอยู่
        bottom: '0', // ให้อยู่ด้านล่างสุดของพื้นที่แสดงรายการสินค้า
        width: '100%',
        maxWidth: '380px', // ไม่ให้มันยาวเกิน
        margin: '0 auto', // จัดให้อยู่กลาง
        backgroundColor: '#fff', // สีพื้นหลัง
        zIndex: 10, // ทำให้บล็อคอยู่ด้านบนเมื่อเลื่อน
    }}
>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        <h3
            style={{
                ...styles.totalText,
                fontSize: '1.1rem',
                fontWeight: '400',
                textAlign: 'left',
                marginTop: '0', // ลด marginTop เพื่อให้ข้อความรวมอยู่ใกล้กับส่วนอื่นๆ
                marginBottom: '0', // ปรับ marginBottom ให้ไม่มีระยะห่างด้านล่าง
                color: '#444',
                paddingLeft: '5px',
                lineHeight: '1.2', // เพิ่ม lineHeight เพื่อให้ข้อความมีระยะห่างที่สบายตา
                fontFamily: 'Impact, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '2px',
            }}
        >
            รวม: {calculateTotalWithBillDiscount().toFixed(2)}฿
        </h3>
        <div style={{ width: '220px', marginRight: '-70px' }}>
            <select
                value={paymentMethod}
                onChange={(e) => handlePaymentChange(e.target.value)}
                style={{
                    padding: '7px 10px',
                    width: '100%', // กว้างเต็มที่ตามขนาดของพื้นที่
                    border: '2px solid #6c5ce7', // ขอบสีสดใส
                    borderRadius: '5px',
                    background: 'linear-gradient(145deg, #ffffff, #f2f2f2)', // พื้นหลังแบบเกรเดียนท์
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', // เงาบางๆ
                    fontSize: '13px', // ขนาดฟอนต์ปรับให้ดูชัดเจนขึ้น
                    color: '#010101',
                    cursor: 'pointer',
                    maxWidth: '160px', // กำหนดความยาวเฉพาะเจาะจง
                    transition: 'all 0.3s ease',
                    marginBottom: '7px',
                    textAlign: 'center', // จัดข้อความให้ตรงกลางใน select
                    marginLeft: '-10px', // ขยับไปทางซ้ายสุด
                    textAlign: 'left', // จัดข้อความให้ตรงซ้าย
                }}
                onFocus={(e) => (e.target.style.borderColor = '#6c5ce7')} // เมื่อโฟกัสจะเปลี่ยนสีขอบ
                onBlur={(e) => (e.target.style.borderColor = '#ccc')} // เมื่อเลิกโฟกัสจะกลับเป็นสีปกติ
            >
                <option value="" disabled>
                    เลือกวิธีการชำระเงิน
                </option>
                <option value="cash">เงินสด</option>
                <option value="qr">QR Code พร้อมเพย์</option>
            </select>
        </div>
    </div>
    {orderReceived ? (
        <>
            {/* ส่วนที่เกี่ยวกับการรับเงินและส่วนลด */}
            <div style={styles.discountAndReceivedAmountRow}>
                <input
                    type="number"
                    placeholder="รับเงิน"
                    value={receivedAmount || ''}
                    onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                    style={styles.amountInputHalf}
                />
                <input
                    type="number"
                    placeholder="ส่วนลดรวม"
                    value={billDiscount || ''}
                    onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                    style={styles.discountInputSmall}
                />
                <select
                    value={billDiscountType}
                    onChange={(e) => setBillDiscountType(e.target.value)}
                    style={{
                        backgroundColor: 'white', /* พื้นหลังเป็นสีขาว */
                        border: '1px solid #cccccc', /* เส้นกรอบสีเทาอ่อน */
                        borderRadius: '4px', /* มุมโค้ง */
                        padding: '8px 12px', /* ระยะห่างภายใน */
                        fontSize: '13px', /* ขนาดตัวอักษร */
                        color: '#333', /* สีตัวอักษร */
                        outline: 'none', /* ไม่มีกรอบเมื่อเลือก */
                        boxShadow: 'none' /* ไม่มีเงา */
                    }}
                >
                    <option value="THB">บาท (฿)</option>
                    <option value="%">%</option>
                </select>
            </div>
            {/* ปุ่มเพิ่มจำนวนเงิน */}
            <div style={styles.amountButtons}>
                {[1, 5, 10, 20, 50, 100].map((amount) => (
                    <button key={amount} onClick={() => handleAmountButton(amount)} style={styles.amountButton}>
                        +{amount}.00
                    </button>
                ))}
                <button
                    onClick={resetAmount}
                    style={{
                        ...styles.amountButton,
                        background: 'linear-gradient(to right, #ff7f7f, #ff0000)',
                        color: '#ffffff',
                        borderRadius: '8px', // ปรับให้มุมโค้งมนขึ้น
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // เพิ่มเงาให้ปุ่มเด่นขึ้น
                        cursor: 'pointer', // เมื่อโฮเวอร์แสดงมือ
                        transition: 'all 0.3s ease', // เพิ่มการเปลี่ยนแปลงนุ่มๆ เมื่อมีการ hover
                    }}
                >
                    C
                </button>
                <button
                    onClick={handleFullAmount}
                    style={{
                        ...styles.amountButton,
                        background: 'linear-gradient(to right, #50de75, #038a26)', // สีพื้นหลังแบบกราเดีย้นท์
                        gridColumn: 'span 2',
                        color: '#ffffff',
                        fontWeight: 'bold', // ตัวหนา
                        borderRadius: '8px', // ปรับให้มุมโค้งมนขึ้น
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // เพิ่มเงาให้ปุ่มเด่นขึ้น
                        cursor: 'pointer', // เมื่อโฮเวอร์แสดงมือ
                        transition: 'all 0.3s ease', // เพิ่มการเปลี่ยนแปลงนุ่มๆ เมื่อมีการ hover
                    }}
                >
                    รับเงินเต็มจำนวน
                </button>
            </div>

            {/* การแสดงเงินทอน */}
            <div style={styles.changeDisplay}>
                เงินทอน: {(receivedAmount ? (receivedAmount - calculateTotalWithBillDiscount()).toFixed(2) : '0.00')} บาท
            </div>
        </>
    ) : null}

    {/* ปุ่มการทำงาน */}
    <div style={styles.paymentRow}>
        {orderReceived ? (
            <button
                style={{
                    ...styles.receiveOrderButton,
                    ...(cart.length === 0 ? styles.buttonDisabled : {}),
                }}
                onClick={handlePartialPayment} // เรียกฟังก์ชันแยกชำระเงิน
                disabled={cart.length === 0}
            >
                แยกชำระในบิลนี้
            </button>
        ) : (
            <button
                style={{
                    ...styles.receiveOrderButton,
                    ...(cart.length === 0 ? styles.buttonDisabled : {}),
                }}
                onClick={receiveOrder} // เรียกฟังก์ชันรับออเดอร์
                disabled={cart.length === 0}
            >
                รับออเดอร์
            </button>
        )}

            <button
                style={{
                    ...styles.paymentButton,
                    ...(orderReceived && cart.length > 0 ? {} : styles.paymentButtonDisabled),
                }}
                onClick={handlePayment} // ฟังก์ชันการชำระเงิน
                disabled={!orderReceived || cart.length === 0}
            >
                ชำระเงิน
            </button>
        </div>
    </div>
    </div>
    
    {showReceipt && (
    <div style={styles.receiptOverlay}>
        <div style={styles.receiptContainer}>
            <div style={styles.header}>
                <Image src="/images/POS SHOP.png" alt="POS SHOP" width={50} height={50} />
                <h2 style={styles.shopName}>Easy PÖS</h2>
                <p style={styles.receiptTitle}>บิลการชำระเงิน</p>
            </div>
            <div style={styles.info}>
                <p style={styles.billId}>No: {orderNumber}</p>
                <p style={styles.date}>{new Date().toLocaleString()}</p>
            </div>
            <div style={styles.tableHeader}>
                <p style={styles.tableColumn}>รายการ</p>
                <p style={styles.tableColumn}>จำนวน</p>
                <p style={styles.tableColumn}>ราคา</p>
            </div>
            <div className="receiptItems" style={styles.receiptItems}>
                {cart.map((item) => (
                    <div key={item.id} style={styles.receiptItem}>
                        <p style={styles.itemName}>{item.p_name}</p>
                        <p style={styles.itemQuantity}>{item.quantity}</p>
                        <p style={styles.itemPrice}>
                            <span style={{ textDecoration: item.discount > 0 ? 'line-through' : 'none' }}>
                                {item.price.toFixed(2)}
                            </span>
                            {item.discount > 0 && (
                                <>
                                    <br />
                                    <span>{`ลด ${item.discountType === 'THB' ? item.discount.toFixed(2) + ' บาท' : item.discount + '%'}`}</span>
                                    <br />
                                    <span>{`${calculateDiscountedPrice(item.price, item.discount, item.discountType).toFixed(2)} บาท`}</span>
                                </>
                            )}
                        </p>
                    </div>
                ))}
            </div>
            <div style={styles.receiptItem}>
                <p style={styles.itemName}><strong>ส่วนลดรวมของบิล</strong></p>
                <p style={styles.itemQuantity}></p>
                <p style={styles.itemPrice}>
                    <strong>
                        {billDiscountType === 'THB' ? `${billDiscount.toFixed(2)} บาท` : `${billDiscount}%`}
                    </strong>
                </p>
            </div>
            <div style={styles.receiptSummary}>
                <p>โต๊ะ: {tableCode}</p>
                <p>ยอดบิล: <span style={styles.summaryValue}>{calculateTotalWithBillDiscount().toFixed(2)} บาท</span></p>
                <p>ยอดภาษีมูลค่าเพิ่ม (VAT) 7%: <span style={styles.summaryValue}>{calculateVAT().toFixed(2)} บาท</span></p>
                <p>รับเงิน: <span style={styles.summaryValue}>{receivedAmount.toFixed(2)} บาท</span></p>
                <p>เงินทอน: <span style={styles.summaryValue}>{(receivedAmount - calculateTotalWithBillDiscount()).toFixed(2)} บาท</span></p>
            </div>
            <div style={styles.receiptItem}>
                <p style={styles.itemName}><strong>วิธีการชำระเงิน</strong></p>
                <p style={styles.itemQuantity}></p>
                <p style={styles.itemPrice}>
                    <strong>
                        {paymentMethod === 'cash' ? 'เงินสด' : 
                        paymentMethod === 'qr' ? 'QR Code พร้อมเพย์' : 
                        'ยังไม่ได้เลือก'}
                    </strong>
                </p>
            </div>
            <div style={styles.buttonContainer}>
                {calculateTotalWithBillDiscount() === 0 ? (
                    <button
                        style={styles.actionButton}
                        onClick={() => {
                            setShowReceipt(false);
                            setOrderReceived(false);
                            setOrderId(null);
                            setCart([]);
                            setReceivedAmount(0);
                            setBillDiscount(0);
                            setBillDiscountType("THB");
                            setIsBillPaused(false);
                        }}
                    >
                        ตกลง
                    </button>
                ) : (
                    <>
                        <button
                            style={{
                                ...styles.actionButton,
                                ...(receivedAmount < calculateTotalWithBillDiscount() ? styles.buttonDisabled : {}),
                            }}
                            onClick={closeReceipt}
                            disabled={receivedAmount < calculateTotalWithBillDiscount()}
                        >
                            ดำเนินการ
                        </button>
                        <button style={styles.pauseButton} onClick={handlePauseBill}>
                            พักบิล
                        </button>
                    </>
                )}
            </div>
        </div>
    </div>
)}

        </div>
    );
}  
const styles = {
    iconText: { fontSize: '30px', marginBottom: '2px' },
    labelText: { fontSize: '14px', fontWeight: 'bold', color: '#fff' },
    circleItem: { width: '140px', height: '140px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer' },
    popupTitle: { fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', color: '#333', margin: '0px' },
    icon: { margin: '20px 0', cursor: 'pointer', borderRadius: '12px', padding: '5px', width: '10px', height: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s ease' },
    categoryRow: {
        display: 'flex',               // ใช้ Flexbox
        justifyContent: 'center',      // จัดให้อยู่ตรงกลางในแนวนอน
        gap: '10px',                   // ระยะห่างระหว่าง item
        margin: '0 auto',              // จัดตำแหน่ง container กลางหน้าแนวนอน
        flexWrap: 'wrap',              // รองรับการล้นและขึ้นบรรทัดใหม่
        alignItems: 'center',          // จัดให้อยู่ตรงกลางในแนวตั้ง
        width: '100%',                 // ใช้เต็มพื้นที่ในแนวนอน
    },
        searchAndTableCodeContainer: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%' },
    pageContainer: { display: 'flex', padding: '10px', height: '92vh',overflow: 'hidden'  },
    sidebarContainer: { flex: '0 0 100px' },
    cart: {width: '400px',overflowY: 'auto',overflowX: 'hidden',backgroundColor: '#f8f9fa',padding: '15px',borderRadius: '12px',marginTop: '-8px',display: 'flex',flexDirection: 'column',justifyContent: 'flex-start',boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',},    
    discountAndTotal: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' },
    totalText: { fontSize: '1.1rem',fontWeight: '400', textAlign: 'left', marginTop: '2px', color: '#444', paddingLeft: '5px', lineHeight: '1', fontFamily: '   Impact, sans-serif ', textTransform: 'uppercase', paddingBottom: '5px', letterSpacing: '2px', },
    orderReceived: { display: 'flex',flexDirection: 'column',alignItems: 'center',marginTop: '20px',},
    discountInputSmall: { width: 'calc(33.33% - 10px)',padding: '2px',borderRadius: '4px',border: '1px solid #ddd', fontSize: '12px'},
    discountAndReceivedAmountRow: {display: 'flex',gap: '10px',flexWrap: 'wrap',justifyContent: 'space-between',marginBottom: '15px',marginTop:'5px'},
    discountContainerHalf: { display: 'flex', alignItems: 'center', gap: '2px', flex: 1, marginTop: '-12px' },
    amountInputHalf: { width: 'calc(33.33% - 10px)',padding: '8px',borderRadius: '4px',border: '1px solid #ddd',flex: '1',},    
    amountInputSmall: { width: '40%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd' },
    cartItemPriceDiscountRow: { display: 'flex', alignItems: 'center', gap: '3px', flexDirection: 'row', marginTop: '-27px' },
    categoryCircle: { width: '95px',height: '60px',display: 'flex',flexDirection: 'column',alignItems: 'center',justifyContent: 'center',borderRadius: '10px',fontWeight: 'bold',cursor: 'pointer',fontSize: '12px', textAlign: 'center',lineHeight: '1',margin: '10px',background: '#499cae',backdropFilter: 'blur(5px)', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',color: '#ffffff', transition: 'all 0.3s ease',':hover': {transform: 'scale(1.1)',background: 'rgba(255, 127, 36, 0.9)', boxShadow: '0 6px 8px rgba(0, 0, 0, 0.2)',},},
    headerContainer: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'sticky', top: '0', backgroundColor: '#f5f5f5', zIndex: 10, padding: '10px 0', width: '100%' },
    searchContainer: { display: 'flex', alignItems: 'center', width: '100%', gap: '10px', marginTop: '-10px' },
    mainContent: { display: 'flex', flex: 1, backgroundColor: '#f5f5f5', padding: '5px' },
    productListContainer: { flex: 1, maxHeight: '92vh', overflowY: 'auto', marginLeft: '20px', paddingTop: '0px' },
    pageTitle: { fontSize: '24px', fontWeight: 'bold', color: '#333' },
    tableCode: { fontSize: '15px', color: '#333' },
    receiveOrderButton: { flex: '1',padding: '10px',backgroundColor: '#347cae',color: '#ffffff',border: 'none',cursor: 'pointer',borderRadius: '5px',fontWeight: 'bold',marginTop: '5px',transition: 'all 0.3s ease',},    
    paymentButton: {flex: '1',    border: 'none', padding: '10px',backgroundColor: '#2ecc71',color: '#fff',fontWeight: 'bold',textAlign: 'center',borderRadius: '5px',cursor: 'pointer',},
    paymentButtonDisabled: { opacity: 0.5,cursor: 'not-allowed',    fontSize: '0.9rem',    },
    receiptContainer: { backgroundColor: '#fff', padding: '15px 20px',borderRadius: '12px',width: '280px',textAlign: 'center',fontFamily: "'Poppins', sans-serif",boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',animation: 'fadeIn 0.5s ease',},
    '@keyframes fadeIn': {from: { opacity: 0, transform: 'translateY(-20px)' },to: { opacity: 1, transform: 'translateY(0)' },},
    receiveOrderButton: { flex: 1, padding: '10px', backgroundColor: '#347cae',color: '#ffffff',border: 'none',cursor: 'pointer', borderRadius: '5px',fontWeight: 'bold',marginTop: '5px',transition: 'all 0.3s ease',},
    buttonDisabled: {backgroundColor: '#bbbbd6',color: '#666666',cursor: 'not-allowed', pointerEvents: 'none'},
    searchBar: { marginBottom: '10px', position: 'sticky', top: '40px', backgroundColor: '#f5f5f5', zIndex: 1, marginLeft: '100px' },
    searchInput: { width: 'calc(890px - 150px)', padding: '9px', borderRadius: '5px', border: '1px solid #ddd' },
    products: { display: 'flex', flexWrap: 'wrap', gap: '15px', paddingTop: '5px', marginTop: '0px' },
    productCard: {width: '120px',height: '100px',border: '1px solid #ddd',borderRadius: '8px',   cursor: 'pointer',   backgroundColor: '#ffffff',  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column',alignItems: 'center',padding: '15px',transition: 'transform 0.3s ease, box-shadow 0.3s ease',overflow: 'hidden',':hover': {transform: 'scale(1.05)',boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)',},},
    productImage: { width: '100px', height: '70px', objectFit: 'cover', borderRadius: '3px', },
    noImage: { width: '100%', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: '5px', marginBottom: '8px' },
    noImageText: { fontSize: '14px', color: '#aaa' },
    productDetails: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', padding: '0 5px',marginLeft:'4px' },
    productName: { fontSize: '11px', fontWeight: 'bold', textAlign: 'left', color: '#333', flex: 1 },
    productPrice: { fontSize: '11px', color: '#333', whiteSpace: 'nowrap' },
    discountInput: { flex: '1', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '10px' },
    discountSelect: { width: '70px', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px', backgroundColor: '#f0f0f0' },
    discountContainer: { display: 'flex', alignItems: 'center', gap: '2px', flexDirection: 'row' },
    receiptOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    receiptContainer: { backgroundColor: '#fff', padding: '20px 30px', borderRadius: '12px', width: '320px', textAlign: 'center', fontFamily: "'Arial', sans-serif" },
    header: { marginBottom: '10px' },
    shopName: { fontSize: '18px', fontWeight: 'bold', margin: '5px 0' },
    receiptTitle: { fontSize: '14px', color: '#777' },
    info: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555', marginBottom: '10px' },
    billId: { fontWeight: 'bold' },
    tableHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '5px' },
    tableColumn: { flex: 1, textAlign: 'right' },
    receiptItem: { display: 'flex', alignItems: 'center', fontSize: '12px', marginBottom: '5px', justifyContent: 'space-between' },
    receiptItems: {maxHeight: '150px',overflowY: 'scroll',scrollbarWidth: 'none',msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch',},    
    itemName: { flex: 2, textAlign: 'left' },
    itemQuantity: { flex: 1, textAlign: 'center' },
    itemPrice: { flex: 1, textAlign: 'right' },
    receiptSummary: { fontSize: '14px', textAlign: 'right', marginTop: '10px', borderTop: '1px solid #ddd', paddingTop: '10px', color: '#333' },
    summaryValue: { fontWeight: 'bold', color: '#000' },
    proceedButton: { marginTop: '20px', backgroundColor: '#499cae', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', width: '100%', fontSize: '16px', fontWeight: 'bold' },
    cartHeader: { position: 'sticky', top: '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px',backgroundColor: '#f8f8f8',  zIndex: 100,},
    cartItems: { display: 'flex',flexDirection: 'column',gap: '3px',maxHeight: '800px',overflowY: 'auto',},    
    cartItemsGradient: { position: 'absolute', bottom: '0', left: '0', right: '0', height: '20px', background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1))', pointerEvents: 'none' },
    totalContainer: { padding: '10px',marginTop: 'auto',backgroundColor: '#ffffff',borderRadius: '8px',boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',maxWidth: '100%'},
    cartItem: { display: 'flex',alignItems: 'center',justifyContent: 'space-between',padding: '10px',borderBottom: '1px solid #ddd',backgroundColor: '#f3f3f3',},    
    cartItemImage: { width: '40px', height: '40px', borderRadius: '3px', margin:'2px' },
    cartItemDetails: { display: 'flex', flexDirection: 'column', gap: '1px', width: '100%', marginTop: '-18px' },
    cartItemName: { fontSize: '14px', fontWeight: 'bold', color: '#333', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginLeft:'10px' },
    cartItemPrice: { fontSize: '12px', color: '#555', marginRight: '5px' , marginLeft:'10px'},
    cartItemPriceRow: { display: 'flex', alignItems: 'center', gap: '10px' },
    discountContainer: { display: 'flex', alignItems: 'center', gap: '5px', width: '70px' },
    quantityControls: { display: 'flex', alignItems: 'center', gap: '5px' },
    quantityButton: { width: '25px', height: '25px', backgroundColor: '#b2c5c9', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '14px' },
    quantityDisplay: { fontSize: '14px', fontWeight: 'bold', color: '#333' },
    clearCartButton: { color: '#555', border: 'none', padding: '5px 10px', cursor: 'pointer', fontSize: '18px' },
    amountInput: { placeholder: 'รับเงิน', width: '100%', padding: '6px', marginTop: '10px', border: '1px solid #ddd', borderRadius: '5px' },
    amountButtons: {display: 'grid',gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',gap: '5px',},    
    amountButton: {padding: '10px',borderRadius: '4px',backgroundColor: '#f0f0f0',color: '#333',fontWeight: 'bold',cursor: 'pointer',textAlign: 'center',boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',border: '2px solid #ddd',transition: 'all 0.3s ease',},
    changeDisplay: {fontSize: '1.3rem',fontWeight: 'bold',textAlign: 'center',margin: '15px 0',color: '#2ecc71',},
    buttonContainer: { display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center' },
    actionButton: { flex: 1, padding: '8px', backgroundColor: '#499cae', color: '#ffffff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
    pauseButton: { flex: 1, padding: '8px', backgroundColor: '#cccccc', color: '#0f0e0e', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
    productCount: { fontSize: '14px', color: '#333', display: 'inline', paddingRight: '10px', marginLeft: '10px' },
    paymentRow: {display: 'flex',gap: '10px',justifyContent: 'space-around',},
    qrCodeContainer: {textAlign: 'center',marginTop: '20px',},
    qrCodeImage: {width: '150px',height: '150px',marginBottom: '10px',}
};

// ซ่อนแถบเลื่อนใน WebKit browsers (Chrome, Safari และ Opera)

    // เพิ่ม CSS เข้าไปในหัวของเอกสาร
    if (typeof document !== 'undefined') {
        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = `
            /* ตัวจัดการพื้นหลังของเว็บไซต์ */
            body {font-family: 'Roboto', sans-serif; background: linear-gradient(to bottom, #eef2f3, #f7fbff); margin: 0; padding: 0; overflow-x: hidden; color: #333;
            }
            .receiptItems::-webkit-scrollbar {display: none; /* ซ่อน scrollbar ใน Chrome/Safari */
            }

    .receiptItems {max-height: 150px;overflow-y: auto;
        scrollbar-width: none; /* ซ่อน Scrollbar ใน Firefox */
        -ms-overflow-style: none; /* ซ่อน Scrollbar ใน IE และ Edge */
        position: relative; /* ป้องกันการขยายเกิน container */
        padding: 0; /* ลบ Padding ที่อาจทำให้เกิดเส้น */
        margin: 0; /* ลบ Margin ที่อาจทำให้เกิดเส้น */
    }
        .receiptItems::-webkit-scrollbar {
        display: none; /* ซ่อน Scrollbar ใน WebKit (Chrome/Safari) */
    }
            /* เพิ่มเอฟเฟกต์แถบเลื่อน */
            .cartItems::-webkit-scrollbar {
                width: 8px;
            }
            .cartItems::-webkit-scrollbar-thumb {
                background: linear-gradient(45deg, #b0bec5, #ffffff);
                border-radius: 10px;
            }
            .cartItems::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(45deg, #90a4ae, #607d8b);
            }
            .categoryCircle:active {
        transform: scale(0.95);
        box-shadow: 0 0 20px rgba(255, 127, 36, 0.8);
    }
            /* เพิ่มเอฟเฟกต์ hover ให้ปุ่ม */
            button {
                transition: all 0.3s ease-in-out;
            }
            button:hover {
                transform: translateY(-3px);
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
            }

            /* สไตล์กล่องสินค้า */
            .productCard:hover {
                transform: scale(1.05);
                box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
                background: linear-gradient(to bottom, #ffffff, #f3f4f7);
            }
                .shake-and-highlight {
        animation: shake 0.5s ease, highlight 1s ease !important;
        background-color: #f1c40f !important;
    }
        
            /* เพิ่มมุมมนและเงาให้กับใบเสร็จ */
            .receiptContainer {
                background: #ffffff;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
                border-radius: 20px;
                padding: 30px;
            }
            
            /* เพิ่มเอฟเฟกต์ใบเสร็จ */
            .receiptContainer {
                animation: fadeIn 0.5s ease;
            }
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            @keyframes shake {
                    0%, 100% {
                        transform: translateX(0);
                    }
                    25% {
                        transform: translateX(-5px);
                    }
                    50% {
                        transform: translateX(5px);
                    }
                    75% {
                        transform: translateX(-5px);
                    }
                }

                @keyframes highlight {
                    0% {
                        background-color: #d9f1ea;
                    }
                    100% {
                        background-color: #fff;
                    }
                }

                .shake-and-highlight {
                    animation: shake 0.5s ease, highlight 1s ease;
                    background-color: #d1f4e8;
                }
        @keyframes pulse {
        0% {transform: scale(1); box-shadow: 0 0 0 rgba(0, 0, 0, 0.7);
        }
        50% {transform: scale(1.05); box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        }
        100% {transform: scale(1); box-shadow: 0 0 0 rgba(0, 0, 0, 0.7);
        }
    }

    .pulse-effect {animation: pulse 0.5s ease-out;background-color: #d9f7be !important;}
    `;
        document.head.appendChild(styleSheet);
    }
