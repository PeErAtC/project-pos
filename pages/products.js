"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from './components/sidebar';
import Image from 'next/image';
import { FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useRouter } from 'next/router';


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
    const [vatType, setVatType] = useState('noTax'); // ค่าเริ่มต้นเป็นไม่มีภาษี
    const [totalWithVAT, setTotalWithVAT] = useState(0);
    const [payments, setPayments] = useState([]); // State เก็บข้อมูลการชำระเงินที่ทำไปแล้ว
    const [temporaryPayments, setTemporaryPayments] = useState([]); // เก็บข้อมูลการแยกชำระเงินชั่วคราว
    const [isSplitPaymentPopupOpen, setIsSplitPaymentPopupOpen] = useState(false);
    const [splitPaymentCount, setSplitPaymentCount] = useState(0); // เก็บจำนวนรายการแยกชำระ
    
    const getApiConfig = () => {
        let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
        const slug = localStorage.getItem('slug') || 'default_slug';
        const authToken = localStorage.getItem('token') || 'default_token';
    
        // ตรวจสอบว่า api_url มี /api ต่อท้ายหรือไม่
        if (!api_url.endsWith('/api')) {
            api_url += '/api';
        }
    
        return { api_url, slug, authToken };
    };
    
     // ประกาศตัวแปร api_url, slug, และ authToken ที่ส่วนต้นของคอมโพเนนต์
     let api_url = "https://default.api.url";
        let slug = "default_slug";
        let authToken = "default_token";

        // ตรวจสอบว่าอยู่ในเบราว์เซอร์ก่อนเรียกใช้ localStorage
        if (typeof window !== "undefined") {
            api_url = localStorage.getItem("url_api") || api_url;
            slug = localStorage.getItem("slug") || slug;
            authToken = localStorage.getItem("token") || authToken;
        }

        // ตรวจสอบว่า api_url มี /api ต่อท้ายหรือไม่
        if (!api_url.endsWith("/api")) {
            api_url += "/api";
    }

    // ฟังก์ชัน fetchProducts
    const fetchProducts = async () => {
        try {
            //////////////////// ประกาศตัวแปร URL CALL   
            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';
    
            // ตรวจสอบว่า api_url มี /api ต่อท้ายหรือไม่
            if (!api_url.endsWith('/api')) {
                api_url += '/api';
            }
            //////////////////// ประกาศตัวแปร  END URL CALL 
            
            const response = await axios.get(`${api_url}/${slug}/products`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
    
            if (response.data && Array.isArray(response.data)) {
                setProducts(response.data);
            } else {
                console.warn('รูปแบบข้อมูลที่ได้รับจาก API ไม่ถูกต้อง');
                setProducts([]);
            }
        } catch (error) {
            if (error.response) {
                console.error('API Error:', error.response.status, error.response.data);
                if (error.response.status === 404) {
                    console.error('API endpoint ไม่พบ:', error.response.config.url);
                }
            } else if (error.request) {
                console.error('ไม่มีการตอบสนองจากเซิร์ฟเวอร์:', error.message);
            } else {
                console.error('เกิดข้อผิดพลาดในการตั้งค่า API:', error.message);
            }
            setProducts([]); // ตั้งค่า products เป็นค่าว่างหาก API ล้มเหลว
        }
    };
    useEffect(() => {
        if (typeof window !== "undefined") {
            fetchProducts();
            fetchCategories();
            const interval = setInterval(fetchProducts, 5000);
            return () => clearInterval(interval);
        }
    }, []);
    
    
//  const response = await axios.get(`${api_url}/api/${slug}/orders/${tableId}/table_lastorder`, {

const fetchTableLastOrder = async (tableId) => {
    try {
        let api_url = "https://default.api.url";
        let slug = "default_slug";
        let authToken = "default_token";

        // ตรวจสอบว่าอยู่ในเบราว์เซอร์ก่อนเรียกใช้ localStorage
        if (typeof window !== "undefined") {
            api_url = localStorage.getItem("url_api") || api_url;
            slug = localStorage.getItem("slug") || slug;
            authToken = localStorage.getItem("token") || authToken;
        }

        // ตรวจสอบว่า api_url มี /api ต่อท้ายหรือไม่
        if (!api_url.endsWith("/api")) {
            api_url += "/api";
        }

        const response = await axios.get(`${api_url}/api/${slug}/orders/${tableId}/table_lastorder`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${authToken}`,
            },
        });

        if (response.data && response.data.order) {
            const lastOrder = response.data.order;

            if (lastOrder.status === "N") {
                console.log("ข้อมูลออเดอร์ล่าสุด:", lastOrder);
                return lastOrder;
            } else {
                console.warn("ออเดอร์ล่าสุดไม่ใช่สถานะ 'N'");
                return null;
            }
        } else {
            console.warn("ไม่มีข้อมูลออเดอร์ล่าสุด");
            return null;
        }
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงออเดอร์ล่าสุด:", error.response?.data || error.message);
        return null;
    }
};

useEffect(() => {
    const loadTableLastOrder = async () => {
        if (!tableCode) {
            console.warn('ไม่มี tableCode');
            return;
        }

        try {
            // ประกาศตัวแปร URL CALL
            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';

            // ตรวจสอบว่า api_url มี /api ต่อท้ายหรือไม่
            if (!api_url.endsWith('/api')) {
                api_url += '/api';
            }

            // แก้ไข URL ที่เรียก
            const url = `${api_url}/${slug}/orders/${tableCode}/table_lastorder`; // ตรวจสอบ URL นี้ให้แน่ใจ

            // เรียก API
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            if (response.data && response.data.order) {
                const lastOrder = response.data.order;
                if (lastOrder.status === 'N') {
                    console.log("ข้อมูลออเดอร์ล่าสุด:", lastOrder);
                    setOrderId(lastOrder.id); // เก็บ ID ของออเดอร์ล่าสุด
                    setOrderNumber(lastOrder.order_number); // เก็บหมายเลขออเดอร์
                    setCart(lastOrder.items || []); // อัปเดตรายการสินค้าในตะกร้า
                } else {
                    console.warn("ออเดอร์ล่าสุดไม่ใช่สถานะ 'N'");
                    setCart([]); // ล้างตะกร้าหากไม่มีออเดอร์ที่มีสถานะ 'N'
                }
            } else {
                console.warn("ไม่มีข้อมูลออเดอร์ล่าสุด");
                setCart([]); // ล้างตะกร้า หากไม่มีข้อมูลออเดอร์
            }
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการดึงออเดอร์ล่าสุด:", error.response?.data || error.message);
            setCart([]); // ล้างตะกร้าหากเกิดข้อผิดพลาด
        }
    };

    loadTableLastOrder(); // เรียกฟังก์ชันเพื่อโหลดข้อมูลออเดอร์

}, [tableCode]); // ทำงานเมื่อ tableCode เปลี่ยนแปลง


const loadTableLastOrder = async () => {
    if (!tableCode) {
        console.warn('ไม่มี tableCode');
        return;
    }

    try {
        // ประกาศตัวแปร URL CALL
        let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
        const slug = localStorage.getItem('slug') || 'default_slug';
        const authToken = localStorage.getItem('token') || 'default_token';

        // ตรวจสอบว่า api_url มี /api ต่อท้ายหรือไม่
        if (!api_url.endsWith('/api')) {
            api_url += '/api';
        }

        // แก้ไข URL ที่เรียก
        const url = `${api_url}/${slug}/orders/${tableCode}/table_lastorder`; // ตรวจสอบ URL นี้ให้แน่ใจ

        // เรียก API
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (response.data && response.data.order) {
            const lastOrder = response.data.order;
            if (lastOrder.status === 'N') {
                console.log("ข้อมูลออเดอร์ล่าสุด:", lastOrder);
                return lastOrder;
            } else {
                console.warn("ออเดอร์ล่าสุดไม่ใช่สถานะ 'N'");
                return null;
            }
        } else {
            console.warn("ไม่มีข้อมูลออเดอร์ล่าสุด");
            return null;
        }
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงออเดอร์ล่าสุด:", error.response?.data || error.message);
        return null;
    }
};

    //******ดึงข้อมูลออเดอร์ที่ยังไม่ได้ทำการชำระเงิน****** */
    const fetchOrdersByTable = async (tableCode) => {
        try {
            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';
        
            // ตรวจสอบว่า api_url มี /api ต่อท้ายหรือไม่
            if (!api_url.endsWith('/api')) {
                api_url += '/api';
            }
    
            const today = new Date();
            const formattedDate = today.toISOString().split("T")[0]; // YYYY-MM-DD
    
            const response = await axios.get(`${api_url}/api/${slug}/orders`, {
                params: {
                    table_code: tableCode, // กรองตามโต๊ะ
                    status: 'N', // ออเดอร์ที่ยังไม่ได้ชำระ
                    order_by: 'created_at',
                    direction: 'desc',
                    date: formattedDate, // กรองเฉพาะวันที่ปัจจุบัน
                },
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
    
            if (response.data && response.data.orders) {
                return response.data.orders; // ส่งกลับรายการออเดอร์
            } else {
                throw new Error('ไม่มีข้อมูลออเดอร์');
            }
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์:', error.message);
            return [];
        }
    };
                                                                             

    const fetchOrderItems = async (orderId) => {
        try {
            //////////////////// ประกาศตัวแปร URL CALL   
            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';
    
            // ตรวจสอบว่า api_url มี /api ต่อท้ายหรือไม่
            if (!api_url.endsWith('/api')) {
                api_url += '/api';
            }
            //////////////////// ประกาศตัวแปร  END URL CALL 
            const response = await axios.get(`${api_url}/api/${slug}/order-items`, {
                params: { order_id: orderId },
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            if (response.data && response.data.items) {
                setCart(
                    response.data.items.map((item) => ({
                        id: item.product_id,
                        p_name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        discount: 0,
                        discountType: "THB",
                    }))
                );
            } else {
                console.warn('ไม่มีข้อมูลรายการสินค้า');
            }
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการดึงรายการสินค้า:', error);
            setCart([]);
        }
    };
    
    
    useEffect(() => {
        const loadOrdersForTable = async () => {
            if (!tableCode) return;
        
            try {
                const lastOrder = await fetchTableLastOrder(tableCode);
        
                if (lastOrder && lastOrder.items) {
                    setOrderId(lastOrder.id); // เก็บ ID ออเดอร์ล่าสุด
                    setOrderNumber(lastOrder.order_number); // เก็บหมายเลขออเดอร์
                    setCart(
                        lastOrder.items.map((item) => ({
                            id: item.product_id,
                            p_name: item.p_name,
                            price: item.price,
                            quantity: item.quantity,
                            discount: 0, // ค่าเริ่มต้น
                            discountType: "THB", // ค่าเริ่มต้น
                        }))
                    );
                } else {
                    setCart([]); // หากไม่มี items ให้เคลียร์ตะกร้า
                }
            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการโหลดออเดอร์:", error);
            }
        };
        
    
        loadOrdersForTable();
    }, [tableCode]);

    const toggleSplitPaymentPopup = () => {
        setIsSplitPaymentPopupOpen((prev) => !prev);
    };
    
    useEffect(() => {
        // อัปเดตจำนวนการแยกชำระเมื่อ `payments` เปลี่ยนแปลง
        setSplitPaymentCount(payments.length);
    }, [payments]);
                                                                                   //******************** */
    const closeOrder = async (orderId) => {
        try {
            console.log("🔍 Debug: กำลังปิดออเดอร์...");
            console.log("📌 Order ID:", orderId);

            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';

            // ตรวจสอบว่า api_url, slug, และ authToken มีค่า
            if (!api_url || !slug || !authToken) {
                Swal.fire('ผิดพลาด', 'ไม่พบข้อมูลสำหรับการเชื่อมต่อกับ API', 'error');
                return;
            }

            if (!api_url.endsWith('/api')) api_url += '/api';

            // เรียก API เพื่อปิดออเดอร์
            const response = await axios.put(
                `${api_url}/${slug}/orders/${orderId}`,
                { status: 'Y' }, // เปลี่ยนสถานะเป็น 'Y' (ชำระเงินแล้ว)
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                }
            );

            // ตรวจสอบการตอบกลับจาก API
            if (response.status === 200 && response.data && response.data.success) {
                Swal.fire('สำเร็จ', 'ปิดออเดอร์เรียบร้อยแล้ว', 'success');
            } else {
                console.error("❌ API Response Error:", response.data);
                throw new Error('ไม่สามารถปิดออเดอร์ได้');
            }
        } catch (error) {
            console.error("❌ Error closing order:", error.response?.data || error.message);
            Swal.fire('ผิดพลาด', `ไม่สามารถปิดออเดอร์ได้: ${error.message}`, 'error');
        }
    };



    
// ฟังก์ชัน fetchCategories
const fetchCategories = async () => {
    try {
        //////////////////// ประกาศตัวแปร URL CALL   
        let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
        const slug = localStorage.getItem('slug') || 'default_slug';
        const authToken = localStorage.getItem('token') || 'default_token';

        // ตรวจสอบว่า api_url มี /api ต่อท้ายหรือไม่
        if (!api_url.endsWith('/api')) {
            api_url += '/api';
        }
        //////////////////// ประกาศตัวแปร  END URL CALL 

        const url = `${api_url}/${slug}/category`;

        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });
        setCategories(response.data.categories || []);
    } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
    }
};


    
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
                return [
                    ...prevCart,
                    {
                        ...product,
                        quantity: 1,
                        discount: product.discount || 0, // กำหนดส่วนลดเริ่มต้น (ถ้ามี)
                        discountType: product.discountType || "THB", // กำหนดประเภทส่วนลดเริ่มต้น
                    },
                ];
            }
        });
    
        // ส่งข้อมูลสินค้าไปที่ฐานข้อมูล
        try {
            await addItemToDatabase(product);
        } catch (error) {
            console.error("ไม่สามารถเพิ่มสินค้าไปที่ฐานข้อมูลได้:", error);
        }
    };
    
    // ฟังก์ชันเพื่อเพิ่มสินค้าลงในฐานข้อมูล
    const addItemToDatabase = async (product) => {
        try {
            //////////////////// ประกาศตัวแปร URL CALL   
            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';
    
            // ตรวจสอบว่า api_url มี /api ต่อท้ายหรือไม่
            if (!api_url.endsWith('/api')) {
                api_url += '/api';
            }
            //////////////////// ประกาศตัวแปร  END URL CALL 
            // ตรวจสอบค่า product ก่อนใช้
            if (!product || !product.id || !product.price) {
                console.error('ข้อมูลสินค้าไม่ครบถ้วน:', product);
                throw new Error('ข้อมูลสินค้าไม่ครบถ้วน');
            }
    
            // สร้างข้อมูลที่จะส่ง
            const orderData = {
                product_id: product.id,
                quantity: 1, // กำหนดจำนวนสินค้าเริ่มต้นเป็น 1
                price: Number(product.price), // ตรวจสอบให้เป็นตัวเลข
                total: Number(product.price), // ตรวจสอบให้เป็นตัวเลข
            };
    
            console.log('Preparing to send orderData:', orderData);
    
            // ส่งข้อมูลไปยัง API
            const response = await axios.post(`${api_url}/api/${slug}/order-items`, orderData, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
    
            // ตรวจสอบการตอบกลับ
            if (response.data && response.data.success) {
                console.log('สินค้าถูกเพิ่มในฐานข้อมูลออร์เดอร์ไอเท็มเรียบร้อยแล้ว:', response.data);
            } else {
                console.error('เกิดข้อผิดพลาดในการเพิ่มสินค้าในฐานข้อมูล:', response.data?.message || 'Unknown error');
            }
        } catch (error) {
            // Handle error อย่างละเอียด
            if (error.response) {
                console.error('API Error:', error.response.status, error.response.data);
                console.error('URL:', `${api_url}/api/${slug}/order-items`);
            } else {
                console.error('Network Error:', error.message);
            }
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
    const calculateTotalPaid = () => {
        return temporaryPayments.reduce((acc, payment) => acc + payment.amount, 0); // รวมยอดชำระจากทุกการแยกจ่าย
    };
    
    const calculateDiscountedPrice = (price, discount, discountType) => {
        if (discountType === 'THB') {
            return Math.max(price - discount, 0);
        } else if (discountType === '%') {
            return Math.max(price - (price * discount) / 100, 0);
        }
        return price;
    };
    
    const savePartialPaymentToDatabase = async (orderId, paymentMethod, amount) => {
        try {
            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';
    
            if (!api_url.endsWith('/api')) api_url += '/api';
    
            const url = `${api_url}/api/${slug}/partial-payments`;
    
            if (!orderId || !paymentMethod || typeof amount !== "number" || amount <= 0) {
                console.error('❌ ข้อมูลไม่ถูกต้อง:', { orderId, paymentMethod, amount });
                throw new Error('ข้อมูลชำระเงินไม่ถูกต้อง');
            }
    
            const paymentData = {
                order_id: orderId,
                pay_channel_id: paymentMethod === 'cash' ? 1 : 2, 
                payment_date: new Date().toISOString(),
                amount: parseFloat(amount).toFixed(2),
                status: 'PARTIAL', 
            };
    
            console.log("📤 ส่งข้อมูลแยกชำระ:", paymentData);
    
            const response = await axios.post(url, paymentData, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
    
            if (response.data && response.data.success) {
                console.log('✅ บันทึกข้อมูลการแยกชำระสำเร็จ:', response.data);
            } else {
                throw new Error('API ไม่สามารถบันทึกข้อมูลแยกชำระได้');
            }
        } catch (error) {
            console.error('❌ Error saving partial payment:', error.response?.data || error.message);
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลการแยกชำระได้', 'error');
        }
    };
    
    
    //ดึงประวัติการเเยกชำระ
    const fetchPartialPayments = async (orderId) => {
        try {
            //////////////////// ประกาศตัวแปร URL CALL   
            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';
    
            // ตรวจสอบว่า api_url มี /api ต่อท้ายหรือไม่
            if (!api_url.endsWith('/api')) {
                api_url += '/api';
            }
            //////////////////// ประกาศตัวแปร  END URL CALL 
            const response = await axios.get(`${api_url}/api/${slug}/partial-payments`, {
                params: { order_id: orderId },
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
    
            if (response.data && Array.isArray(response.data)) {
                setPayments(response.data); // บันทึกใน state
            } else {
                console.warn('รูปแบบข้อมูลไม่ถูกต้อง');
            }
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการดึงประวัติการแยกชำระ:', error.response?.data || error.message);
        }
    };
    
    const calculateTotalAfterItemDiscounts = () => {
        return cart.reduce((acc, item) => 
            acc + calculateDiscountedPrice(Number(item.price), Number(item.discount), item.discountType) * Number(item.quantity)
        , 0) || 0;
    };
    
    // ฟังก์ชันคำนวณยอดรวมที่ต้องชำระ
    const calculateTotalWithBillDiscountAndVAT = () => {
        const baseTotal = calculateTotalAfterItemDiscounts(); // ยอดรวมหลังส่วนลดสินค้า
        const discountedTotal = calculateDiscountedPrice(baseTotal, billDiscount, billDiscountType); // ยอดรวมหลังส่วนลดบิล
    
        let vatAmount = 0;
    
        if (vatType === 'excludeVat7') {
            vatAmount = discountedTotal * 0.07; // เพิ่ม VAT 7%
        } else if (vatType === 'excludeVat3') {
            vatAmount = discountedTotal * 0.03; // เพิ่ม VAT 3%
        }
    
        return Number((discountedTotal + vatAmount).toFixed(2)); // รวม VAT (กรณีไม่รวม VAT)
    };
    
    const calculateVAT = () => {
        const baseTotal = Number(calculateTotalAfterItemDiscounts()) || 0; // ตรวจสอบว่า baseTotal เป็นตัวเลข
        let vatAmount = 0;
    
        switch (vatType) {
            case 'includeVat7':
                vatAmount = baseTotal * (7 / 107); // คำนวณ VAT กรณีรวมในยอดแล้ว
                break;
            case 'excludeVat7':
                vatAmount = baseTotal * 0.07; // คำนวณ VAT 7%
                break;
            case 'includeVat3':
                vatAmount = baseTotal * (3 / 103); // คำนวณ VAT กรณีรวมในยอดแล้ว
                break;
            case 'excludeVat3':
                vatAmount = baseTotal * 0.03; // คำนวณ VAT 3%
                break;
            default:
                vatAmount = 0; // ไม่มี VAT
        }
    
        return parseFloat(vatAmount.toFixed(2)) || 0; // คืนค่า VAT เป็นตัวเลข หรือ 0 หากมีปัญหา
    };
    const CartItem = ({ item, handleItemDiscountChange, updateQuantity }) => (
        <div style={styles.cartItem}>
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
    );
    
    const handleAmountInput = (amount) => {
        setReceivedAmount(Number(amount) || 0); // อนุญาตให้ใส่จำนวนเงินใด ๆ
    };
    const calculateChange = () => {
        const remainingDue = calculateRemainingDue(); // ยอดคงเหลือที่ต้องชำระ
        return Math.max(receivedAmount - remainingDue, 0).toFixed(2); // เงินทอน = รับเงิน - ยอดคงเหลือ
    };
    
    const handlePayment = () => {
        try {
            const totalDue = calculateTotalWithBillDiscountAndVAT(); // ยอดรวมที่ต้องชำระ
            const totalPaid = calculateTotalPaid() + receivedAmount; // รวมยอดที่ชำระทั้งหมด
    
            if (isNaN(totalDue) || isNaN(totalPaid) || isNaN(receivedAmount)) {
                console.error("❌ Error: ค่าที่ใช้คำนวณเป็น NaN", { totalDue, totalPaid, receivedAmount });
                Swal.fire({
                    icon: "error",
                    title: "เกิดข้อผิดพลาด",
                    text: "ข้อมูลการชำระเงินไม่ถูกต้อง กรุณาลองใหม่",
                });
                return;
            }
    
            if (totalPaid < totalDue) {
                Swal.fire({
                    icon: "error",
                    title: "ยอดเงินไม่เพียงพอ",
                    text: `กรุณาชำระเงินให้ครบ: ${(totalDue - totalPaid).toFixed(2)} บาท`,
                });
                return;
            }
    
            const change = Math.max(totalPaid - totalDue, 0); // คำนวณเงินทอน
    
            Swal.fire({
                icon: "success",
                title: "ชำระเงินสำเร็จ!",
                text: `ยอดชำระ: ${receivedAmount.toFixed(2)} บาท\nเงินทอน: ${change.toFixed(2)} บาท`,
                timer: 2000, // ปิดการแจ้งเตือนอัตโนมัติหลัง 2 วินาที
                showConfirmButton: false,
            }).then(() => {
                if (!temporaryPayments || !Array.isArray(temporaryPayments)) {
                    console.error("❌ Error: temporaryPayments ไม่ใช่อาร์เรย์", { temporaryPayments });
                    return;
                }
    
                // อัปเดตเงินทอนและยอดชำระไปยังใบเสร็จ
                setTemporaryPayments([
                    ...temporaryPayments,
                    {
                        amount: receivedAmount,
                        paymentMethod,
                        timestamp: new Date(),
                    },
                ]);
    
                // บันทึกการชำระและเปิดหน้าต่างใบเสร็จ
                setShowReceipt(true);
                setReceivedAmount(0); // รีเซ็ตยอดเงินที่รับหลังชำระ
            });
        } catch (error) {
            console.error("❌ Error ใน handlePayment:", error);
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด",
                text: "ไม่สามารถดำเนินการชำระเงินได้ กรุณาลองใหม่",
            });
        }
    };
    
    
    const calculateTotalWithBillDiscount = () => {
        const baseTotal = calculateTotalAfterItemDiscounts(); // ยอดรวมหลังส่วนลดสินค้า
        return calculateDiscountedPrice(baseTotal, billDiscount, billDiscountType); // ยอดรวมหลังส่วนลดบิล
    };
    
    const calculateTotalWithVAT = () => {
        const baseTotal = calculateTotalAfterItemDiscounts();
        const vatAmount = calculateVAT();
    
        return vatType.includes('include') ? baseTotal : baseTotal + vatAmount;
    };
    
    
    useEffect(() => {
        const updatedTotal = calculateTotalWithBillDiscountAndVAT();
        setTotalWithVAT(updatedTotal);
    }, [billDiscount, billDiscountType, vatType, cart]);
    
    
    const filteredProducts = products.filter(product =>
        (!selectedCategoryId || product.category_id === selectedCategoryId) &&
        (product.p_name ? product.p_name.toLowerCase().includes(searchTerm.toLowerCase()) : false)
    );
    
    const sendOrder = async (orderData) => {
        try {
            //////////////////// ประกาศตัวแปร URL CALL   
            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';
        
            // ตรวจสอบว่า api_url มี /api ต่อท้ายหรือไม่
            if (!api_url.endsWith('/api')) {
                api_url += '/api';
            }
            //////////////////// ประกาศตัวแปร  END URL CALL 
    
            console.log("API URL:", api_url);
            console.log("Slug:", slug);
            console.log("Auth Token:", authToken);
            console.log("Order Data to send:", orderData);
    
            // ส่งคำขอ POST ไปยัง API
            const response = await axios.post(`${api_url}/${slug}/orders`, orderData, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
    
            if (response.data && response.data.order) {
                console.log('Order sent successfully:', response.data.order);
                return response.data.order; // Return the created order
            } else {
                console.error('Invalid API response format:', response.data);
                throw new Error('API response format is invalid');
            }
        } catch (error) {
            console.error('Error creating order:', error.message);
    
            if (error.response) {
                // กรณีที่เซิร์ฟเวอร์ตอบกลับแต่มีข้อผิดพลาด
                console.error('Response Data:', error.response.data);
                console.error('Response Status:', error.response.status);
            } else if (error.request) {
                // กรณีที่คำขอส่งไป แต่ไม่มีการตอบกลับจากเซิร์ฟเวอร์
                console.error('Network Error: No response received from server.');
            }
    
            throw new Error(`Unable to create order: ${error.message}`);
        }
    };
    
    
    
    useEffect(() => {
        calculateTotalWithVAT();
    }, [vatType]); // ใช้ useEffect ติดตามค่า vatType
    
    // ฟังก์ชันหลักสำหรับรับคำสั่งซื้อ (สร้าง order และบันทึกรายการ order_items)
    // ฟังก์ชันหลักสำหรับรับคำสั่งซื้อ (สร้าง order และบันทึกรายการ order_items)
    const receiveOrder = async () => {
        try {
            const { api_url, slug, authToken } = getApiConfig(); // ดึงค่าจากฟังก์ชัน getApiConfig
    
            const userId = 1; // ตัวอย่าง ID ผู้ใช้งาน
            const totalAmountWithVAT = Number(calculateTotalAfterItemDiscounts()) || 0;
            console.log("Total Amount with VAT (ยอดรวม):", totalAmountWithVAT);
    
            let vatAmount = 0;
    
            if (vatType === 'includeVat7') {
                vatAmount = totalAmountWithVAT * (7 / 107);
            } else if (vatType === 'includeVat3') {
                vatAmount = totalAmountWithVAT * (3 / 103);
            } else if (vatType === 'excludeVat7') {
                vatAmount = totalAmountWithVAT * 0.07;
            } else if (vatType === 'excludeVat3') {
                vatAmount = totalAmountWithVAT * 0.03;
            }
    
            const vatPercentage = vatType.includes('7') ? 7 : vatType.includes('3') ? 3 : 0;
    
            const orderData = {
                total_amount: totalAmountWithVAT.toFixed(2),
                vat_per: vatPercentage,
                vat_amt: vatAmount.toFixed(2),
                total_amount_with_vat: totalAmountWithVAT.toFixed(2),
                discount: Number(billDiscountType === 'THB' ? billDiscount : 0).toFixed(2),
                discount_per: Number(billDiscountType === '%' ? billDiscount : 0).toFixed(2),
                net_amount: totalAmountWithVAT.toFixed(2),
                status: 'N',
                tables_id: tableCode || null,
                created_by: userId,
                vatType,
                items: cart.map((item) => ({
                    product_id: item.id || 0,
                    p_name: item.p_name || 'Unnamed Product',
                    quantity: Number(item.quantity) || 0,
                    price: Number(item.price) || 0,
                    discount: item.discount || 0,
                    discountType: item.discountType || 'THB',
                    total: calculateDiscountedPrice(
                        Number(item.price),
                        Number(item.discount),
                        item.discountType
                    ) * Number(item.quantity) || 0,
                })),
                payment_method: paymentMethod || 'cash',
            };
    
            console.log("Order Data to send:", orderData);
    
            // ส่งคำขอสร้างออเดอร์
            const newOrder = await sendOrder(orderData, api_url, slug, authToken); 
            setOrderNumber(newOrder.order_number);
            setOrderId(newOrder.id);
            setOrderReceived(true);
    
            // ตรวจสอบว่า tableCode มีค่าหรือไม่
            if (tableCode) {
                const tableUpdateData = { status: 'N' }; // กำหนดสถานะใหม่ของโต๊ะ
                const url = `${api_url}/${slug}/table_codes/${tableCode}`; // แก้ไข URL ให้ถูกต้อง
                console.log("Updating table status with URL:", url);
    
                try {
                    const response = await axios.put(url, tableUpdateData, {
                        headers: {
                            Accept: 'application/json',
                            Authorization: `Bearer ${authToken}`,
                        },
                    });
    
                    if (response.status === 200 || response.status === 204) {
                        console.log(`Table ${tableCode} status updated to "Not Available"`);
                    } else {
                        throw new Error(`Unexpected response status: ${response.status}`);
                    }
                } catch (error) {
                    console.error('Failed to update table status:', error.response?.data || error.message);
                    Swal.fire(
                        'Error',
                        `Failed to update table status: ${error.response?.data?.message || error.message}`,
                        'error'
                    );
                }
            }
        } catch (error) {
            console.error('Error receiving order:', error);
    
            if (error.response) {
                console.error("Response Data:", error.response.data);
                console.error("Response Status:", error.response.status);
            }
    
            Swal.fire('Error', `Could not receive order: ${error.message}`, 'error');
        }
    };
    
    
    
    const saveOrderData = async (orderId, paymentMethod, receivedAmount, cart, billDiscount, billDiscountType, vatType, calculateTotalWithBillDiscountAndVAT, calculateVAT) => {
        try {
            //////////////////// ประกาศตัวแปร URL CALL   
            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';
    
            // ตรวจสอบว่า api_url มี /api ต่อท้ายหรือไม่
            if (!api_url.endsWith('/api')) {
                api_url += '/api';
            }
            //////////////////// ประกาศตัวแปร  END URL CALL 
            // คำนวณส่วนลดรวมต่อสินค้า
            const totalItemDiscount = cart.reduce((acc, item) => {
                const itemDiscountAmount = (item.discountType === 'THB') 
                    ? item.discount * item.quantity 
                    : (item.price * item.discount / 100) * item.quantity;
                return acc + itemDiscountAmount;
            }, 0);
    
            // คำนวณส่วนลดรวมทั้งบิล
            const totalBillDiscount = (billDiscountType === 'THB') 
                ? billDiscount 
                : calculateTotalWithBillDiscountAndVAT() * (billDiscount / 100);
    
            const totalDiscount = totalItemDiscount + totalBillDiscount; // รวมส่วนลดทั้งหมด
    
            // คำนวณ VAT
            const vatAmount = vatType.includes('exclude') ? parseFloat(calculateVAT().toFixed(2)) : 0;
    
            // ยอดสุทธิ
            const netAmount = calculateTotalWithBillDiscountAndVAT();
    
            // บันทึกข้อมูลการชำระเงิน
            await savePaymentToDatabase(orderId, paymentMethod, receivedAmount);
    
            // อัปเดตข้อมูลบิลในฐานข้อมูล
            const response = await axios.put(
                `${api_url}/api/${slug}/orders/${orderId}`,
                {
                    status: 'Y', // บิลชำระแล้ว
                    vat_amt: vatType.includes('exclude') ? vatAmount : "", // จำนวน VAT
                    vat_per: vatType.includes('7') ? 7 : vatType.includes('3') ? 3 : 0, // เปอร์เซ็นต์ VAT
                    net_amount: netAmount, // ยอดสุทธิ
                    discount: totalDiscount.toFixed(2), // บันทึกส่วนลดรวมในฟิลด์เดียว
                },
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
                    title: 'บันทึกบิลสำเร็จ',
                    text: `บิลถูกปิดเรียบร้อยแล้ว! ยอดสุทธิ: ${netAmount.toFixed(2)} บาท`,
                    confirmButtonText: 'ตกลง',
                });
            } else {
                throw new Error('การตอบกลับจาก API ไม่ถูกต้อง');
            }
        } catch (error) {
            console.error('เกิดข้อผิดพลาด:', error.message);
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกบิลได้ กรุณาลองอีกครั้ง', 'error');
        }
    };
    
    const handleSaveReceipt = async () => {
        await saveOrderData(
            orderId,
            paymentMethod,
            receivedAmount,
            cart,
            billDiscount,
            billDiscountType,
            vatType,
            calculateTotalWithBillDiscountAndVAT,
            calculateVAT
        );
        resetStateAfterSuccess(); // รีเซ็ตสถานะหลังบันทึกสำเร็จ
    };
    
    const addOrderItems = async () => {
        if (!orderId) {
            // ถ้ายังไม่มี orderId หมายความว่าไม่มีการสร้างออเดอร์
            // ดังนั้นต้องสร้างคำสั่งซื้อใหม่
            await receiveOrder(); // สร้างคำสั่งซื้อใหม่
        }
    
        // เตรียมรายการสินค้าที่จะเพิ่มเข้าไปในออเดอร์
        const newItems = cart.map((item) => ({
            product_id: item.id || 0,
            p_name: item.p_name || 'ไม่มีชื่อสินค้า',
            quantity: item.quantity || 1,
            price: item.price || 0,
            total: calculateDiscountedPrice(item.price, item.discount, item.discountType) * item.quantity || 0,
        }));
    
        // เรียกใช้ฟังก์ชัน addToOrder เพื่อเพิ่มรายการสินค้าลงในออเดอร์ที่มีอยู่
        await addToOrder(orderId, newItems);
    };
    
    const addToOrder = async (orderId, newItems) => {
        try {
            //////////////////// ประกาศตัวแปร URL CALL   
            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';
    
            // ตรวจสอบว่า api_url มี /api ต่อท้ายหรือไม่
            if (!api_url.endsWith('/api')) {
                api_url += '/api';
            }
            //////////////////// ประกาศตัวแปร  END URL CALL 
            // ตรวจสอบให้แน่ใจว่า newItems ไม่ว่าง และมีค่า product_id
            if (!newItems || newItems.length === 0) {
                throw new Error('ไม่มีรายการสินค้าที่จะเพิ่ม');
            }
    
            // ตรวจสอบว่าแต่ละรายการใน newItems มี product_id
            for (let item of newItems) {
                if (!item.product_id) {
                    throw new Error(`สินค้า ${item.p_name || 'Unnamed Product'} ไม่มี product_id`);
                }
            }
    
            // ส่งข้อมูลสินค้าใหม่ไปยัง API เพื่อเพิ่มลงในออเดอร์ที่มีอยู่
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
    
            // ตรวจสอบว่า response มี success หรือไม่
            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'เพิ่มรายการสินค้าเรียบร้อย',
                    text: 'รายการสินค้าใหม่ถูกเพิ่มเข้าไปในออเดอร์สำเร็จ!',
                    confirmButtonText: 'ตกลง',
                });
            } else {
                throw new Error('ไม่สามารถเพิ่มรายการสินค้าได้');
            }
        } catch (error) {
            console.error('Error adding order items:', error);
            Swal.fire(
                'ผิดพลาด',
                `ไม่สามารถเพิ่มรายการสินค้าได้: ${error.response?.data?.message || error.message}`,
                'error'
            );
        }
    };
    
    const fetchPaymentMethods = async () => {
        const url = `${api_url}/api/${slug}/payChannels`; // URL สำหรับเรียกข้อมูลช่องทางการชำระเงิน
        try {
            //////////////////// ประกาศตัวแปร URL CALL   
            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';
    
            // ตรวจสอบว่า api_url มี /api ต่อท้ายหรือไม่
            if (!api_url.endsWith('/api')) {
                api_url += '/api';
            }
            //////////////////// ประกาศตัวแปร  END URL CALL 
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
            console.error('Error fetching payment channels:', error.response?.data || error.message)
        }
    };

    // ฟังก์ชันอัปเดตจำนวนเงินด้วยปุ่ม
    const handleAmountButton = (amount) => {
        setReceivedAmount((prevAmount) => {
            const updatedAmount = prevAmount + amount; // เพิ่มจำนวนเงินที่กดปุ่ม
            return updatedAmount; // อนุญาตให้ยอดรับเงินเกินยอดรวมได้
        });
    };

    const resetAmount = () => {
        setReceivedAmount(0);
    };

    // ฟังก์ชันอัปเดตจำนวนเงินเต็ม
    const handleFullAmount = () => {
        const remainingDue = calculateRemainingDue(); // คำนวณยอดคงเหลือ
        setReceivedAmount(remainingDue); // ตั้งยอดรับเงินให้เท่ากับยอดคงเหลือ
    };
    

    const closeReceipt = async () => {
        try {
            const totalDue = calculateTotalWithBillDiscountAndVAT(); 
            const amountToPay = receivedAmount || calculateTotalPaid(); // ใช้ receivedAmount หรือรวมยอดที่จ่ายไปแล้ว
    
            if (!orderId) {
                Swal.fire('ผิดพลาด', 'ไม่พบเลขที่ออเดอร์ กรุณาลองอีกครั้ง', 'error');
                return;
            }
    
            if (!paymentMethod) {
                Swal.fire('ผิดพลาด', 'กรุณาเลือกวิธีการชำระเงินก่อนปิดบิล', 'error');
                return;
            }
    
            if (amountToPay <= 0) {
                Swal.fire('ผิดพลาด', 'จำนวนเงินที่ชำระต้องมากกว่า 0', 'error');
                return;
            }
    
            console.log("📌 ค่า orderId:", orderId);
            console.log("📌 ค่า netAmount:", totalDue);
            console.log("📌 ค่า paymentMethod:", paymentMethod);
            console.log("📌 ค่า receivedAmount:", amountToPay);
    
            // ✅ ตรวจสอบให้แน่ใจว่าการบันทึกข้อมูลการชำระเงินสำเร็จ
            const paymentResponse = await savePaymentToDatabase(orderId, paymentMethod, amountToPay);
            if (!paymentResponse || !paymentResponse.success) {
                throw new Error('❌ บันทึกข้อมูลการชำระเงินล้มเหลว');
            }
    
            const response = await axios.put(
                `${api_url}/${slug}/orders/${orderId}`,
                {
                    status: 'Y',
                    vat_amt: vatType.includes('exclude') ? calculateVAT() : 0, 
                    vat_per: vatType.includes('7') ? 7 : vatType.includes('3') ? 3 : 0, 
                    net_amount: totalDue,
                    discount: billDiscount.toFixed(2),
                    payment_method: paymentMethod, 
                    updated_by: 1, // ✅ อาจต้องกำหนดค่า updated_by เพื่อให้ API ยอมรับ
                },
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );
    
            console.log("📌 API Response:", response.data);
    
            // ✅ แก้ไขเงื่อนไขการตรวจสอบ response
            if (response && (response.status === 200 || response.status === 201) && response.data?.order) {
                console.log("✅ บันทึกข้อมูลบิลสำเร็จ:", response.data.order);
            } else {
                console.warn("⚠️ API ตอบกลับสำเร็จแต่ไม่มีข้อมูล order:", response.data);
                Swal.fire("แจ้งเตือน", "บิลถูกบันทึกแต่ไม่มีข้อมูล order", "warning");
            }
    
            // ✅ ตรวจสอบ response.data.items ว่ามีสินค้าในบิลหรือไม่
            if (response.data?.items && response.data.items.length === 0) {
                console.warn("⚠️ บิลนี้ไม่มีสินค้า (Empty items array)");
            }
    
            // ✅ อัปเดตสถานะโต๊ะ
            if (tableCode) {
                try {
                    const tableResponse = await axios.patch(`${api_url}/${slug}/table_codes/${tableCode}`, { status: 'Y' }, {
                        headers: { Accept: "application/json", Authorization: `Bearer ${authToken}` },
                    });
    
                    if (tableResponse.status === 200 || tableResponse.status === 204) {
                        console.log(`✅ โต๊ะ ${tableCode} ถูกอัปเดตเป็น "ว่าง" สำเร็จ`);
                    } else {
                        throw new Error(`❌ Response status: ${tableResponse.status}`);
                    }
                } catch (error) {
                    console.error(`❌ ไม่สามารถอัปเดตสถานะโต๊ะได้: ${error.message}`);
                }
            }
    
            Swal.fire({
                icon: 'success',
                title: 'บันทึกบิลสำเร็จ',
                text: `บิลถูกปิดเรียบร้อยแล้ว! ยอดสุทธิ: ${totalDue.toFixed(2)} บาท`,
                confirmButtonText: 'ตกลง',
            }).then(() => {
                resetStateAfterSuccess();
            });
    
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาด:', error.message);
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกบิลได้ กรุณาลองอีกครั้ง', 'error');
        }
    };
    
    
    
    
    
    // ฟังก์ชันช่วยสำหรับอัปเดตสถานะโต๊ะ
    const updateTableStatus = async (tableCode, status) => {
        const url = `${api_url}/api/${slug}/table_codes/${tableCode}`;
        const tableUpdateData = { status };
    
        const response = await axios.patch(url, tableUpdateData, {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
        });
    
        if (response.status === 200 || response.status === 204) {
            console.log(`สถานะโต๊ะ ${tableCode} ถูกอัปเดตเป็น "${status}" สำเร็จ`);
        } else {
            throw new Error(`Unexpected response status: ${response.status}`);
        }
    };
    
    
    
    const formattedTableCode = `T${String(tableCode).padStart(3, '0')}`;
    // ฟังก์ชันคำนวณยอดสุทธิ
    const calculateNetAmount = (totalDue, billDiscount) => {
        return Number(totalDue.toFixed(2)); // ยอดรวมไม่ลดซ้ำ
    };

    // ฟังก์ชันรีเซ็ตสถานะหลังชำระเงินสำเร็จ
    const resetStateAfterSuccess = () => {
        setTemporaryPayments([]); // ล้างข้อมูลการแยกชำระเงิน
        setShowReceipt(false);
        setOrderReceived(false);
        setOrderId(null);
        setOrderNumber(null); // รีเซ็ตเลขที่ออร์เดอร์
        setCart([]); // ล้างตะกร้าสินค้า
        setReceivedAmount(0); // รีเซ็ตยอดเงินรับ
        setBillDiscount(0); // รีเซ็ตส่วนลด
        setBillDiscountType("THB");
        setVatType("noTax"); // ตั้ง VAT กลับเป็นค่าเริ่มต้น
        setIsBillPaused(false); // ปิดสถานะพักบิล
    };
    
    const handlePauseBill = () => {
        setShowReceipt(false);
        setIsBillPaused(true);
    };
    const calculateRemainingDue = () => {
        const totalDue = calculateTotalWithBillDiscountAndVAT(); // ยอดรวมทั้งหมดที่ต้องชำระ
        const totalPaid = calculateTotalPaid(); // ยอดรวมที่ชำระไปแล้ว
        return Math.max(totalDue - totalPaid, 0); // ยอดคงเหลือ = ยอดรวม - ยอดที่ชำระไปแล้ว
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
            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';
    
            if (!api_url.endsWith('/api')) api_url += '/api';
            const url = `${api_url}/${slug}/payments`;
    
            if (!orderId || !paymentMethod || isNaN(amount) || amount <= 0) {
                console.error("❌ ข้อมูลชำระเงินไม่ถูกต้อง:", { orderId, paymentMethod, amount });
                Swal.fire("เกิดข้อผิดพลาด", "ข้อมูลชำระเงินไม่ถูกต้อง", "error");
                return { success: false };
            }
    
            const formattedAmount = parseFloat(amount).toFixed(2);
            const paymentDate = new Date().toISOString().slice(0, 19).replace("T", " ");
    
            const payChannelId = paymentMethod === "cash" ? 1 : 2;
    
            const paymentData = {
                order_id: orderId,
                pay_channel_id: payChannelId,
                payment_date: paymentDate,
                amount: formattedAmount,
                status: "Y",
            };
    
            console.log("📤 Data ที่ส่งไปยัง API:", paymentData);
    
            const response = await axios.post(url, paymentData, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
            });
    
            console.log("✅ Response จาก API:", response.data);
            console.log("📌 Response Status:", response.status);
    
            // ✅ แก้ไขเงื่อนไขให้รองรับทั้ง 200 และ 201
            if (response && (response.status === 200 || response.status === 201) && response.data?.id) {
                console.log("✅ บันทึกข้อมูลการชำระเงินสำเร็จ:", response.data);
                return { success: true, data: response.data };
            } else {
                console.error("❌ บันทึกข้อมูลการชำระเงินล้มเหลว:", response.data);
                Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกการชำระเงินได้", "error");
                return { success: false };
            }
        } catch (error) {
            console.error("❌ Error saving payment:", error.response?.data || error.message);
            Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลการชำระเงินได้", "error");
            return { success: false };
        }
    };
    
    
    
    
    
    
    
    
    
    const fetchPaymentChannels = async () => {
        try {
            //////////////////// ประกาศตัวแปร URL CALL   
            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';
    
            // ตรวจสอบว่า api_url มี /api ต่อท้ายหรือไม่
            if (!api_url.endsWith('/api')) {
                api_url += '/api';
            }
            //////////////////// ประกาศตัวแปร  END URL CALL 
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

    const calculateTotalPaidWithChange = () => {
        const totalDue = calculateTotalWithBillDiscountAndVAT(); // ยอดรวมที่ต้องชำระ
        const totalPaid = calculateTotalPaid(); // ยอดเงินที่ชำระทั้งหมด (รวมจากทุกการแยกชำระ)
        const change = Math.max(totalPaid - totalDue, 0); // เงินทอนรวม
    
        return {
            totalPaid,
            change,
        };
    };
    
    const handlePartialPayment = async () => {
        const totalDue = calculateTotalWithBillDiscountAndVAT(); // ยอดรวมที่ต้องชำระทั้งหมด
        const totalPaid = calculateTotalPaid(); // ยอดที่ชำระแล้วในหลายครั้ง
        const remainingDue = totalDue - totalPaid; // ยอดที่เหลืออยู่
        const change = Math.max(receivedAmount - remainingDue, 0); // คำนวณเงินทอน
    
        if (receivedAmount <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'ยอดเงินไม่ถูกต้อง',
                text: `กรุณาระบุยอดเงินที่ถูกต้อง (ยอดเงินต้องมากกว่า 0 บาท)`,
            });
            return;
        }
    
        try {
            // **บันทึกข้อมูลการแยกชำระเงินลงในฐานข้อมูล**
            await savePartialPaymentToDatabase(orderId, paymentMethod, receivedAmount);
    
            // เพิ่มข้อมูลการแยกชำระใน state ชั่วคราว
            const newPayment = {
                amount: receivedAmount,
                paymentMethod,
                timestamp: new Date(),
            };
    
            setTemporaryPayments((prevPayments) => [...prevPayments, newPayment]);
    
            // อัปเดตยอดคงเหลือหลังจากกดแยกชำระ
            const updatedRemainingDue = Math.max(remainingDue - receivedAmount, 0);
    
            Swal.fire({
                icon: 'success',
                title: 'แยกชำระเรียบร้อย',
                html: `
                    ยอดที่ชำระ: ${receivedAmount.toFixed(2)} บาท<br>
                    ยอดคงเหลือ: ${updatedRemainingDue.toFixed(2)} บาท<br>
                    ${change > 0 ? `เงินทอน: ${change.toFixed(2)} บาท` : ''}
                `,
            });
    
            setReceivedAmount(0); // รีเซ็ตยอดรับเงิน
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลการแยกชำระ:', error.message);
            Swal.fire('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลการแยกชำระเงินได้', 'error');
        }
    };   
    
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
                        style={{ ...styles.categoryCircle, backgroundColor: '#fff' }}
                    >
                        <span style={styles.iconText}></span>
                        <span style={styles.labelText}>ทั้งหมด</span>
                    </div>
                    <div
                        onClick={() => handleCategorySelect(1)}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        style={{ ...styles.categoryCircle, backgroundColor: '#fff' }}
                    >
                        <span style={styles.iconText}></span>
                        <span style={styles.labelText}>เมนูผัด</span>
                    </div>
                    <div
                        onClick={() => handleCategorySelect(2)}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        style={{ ...styles.categoryCircle, backgroundColor: '#fff' }}
                    >
                        <span style={styles.iconText}></span>
                        <span style={styles.labelText}>ข้าวผัด</span>
                    </div>
                    <div
                        onClick={() => handleCategorySelect(3)}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        style={{ ...styles.categoryCircle, backgroundColor: '#fff' }}
                    >
                        <span style={styles.iconText}></span>
                        <span style={styles.labelText}>เมนูยำ</span>
                    </div>
                    <div
                        onClick={() => handleCategorySelect(4)}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        style={{ ...styles.categoryCircle, backgroundColor: '#fff' }}
                    >
                        <span style={styles.iconText}></span>
                        <span style={styles.labelText}>ข้าวต้ม</span>
                    </div>
                    <div

                        onClick={() => handleCategorySelect(5)}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        style={{ ...styles.categoryCircle, backgroundColor: '#fff' }}
                    >
                        <span style={styles.iconText}></span>
                        <span style={styles.labelText}>เครื่องดื่ม</span>
                    </div>
                </div>
            </div>
                        <div style={styles.searchAndTableCodeContainer}>
                            <div style={styles.searchContainer}>
                                <h5 style={styles.tableCode}>โต๊ะ: {formattedTableCode}</h5>
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
                                        src={`${api_url.replace("/api", "")}/storage/app/public/product/${slug}/${product.image}`}
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
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: '#499cae' }}>
                                <Image src="/images/trolley-cart.png" alt="รายการสั่งซื้อ" width={24} height={24} />
                                    <h2 style={{ marginLeft: '10px' }}>
                                        ({cart.reduce((acc, item) => acc + item.quantity, 0)})
                                    </h2>
                                    {/* แสดง order_number หากมี */}
                                    {orderNumber ? (
                                        <span style={{ marginLeft: '150px', fontSize: '12px', color: '#555', fontWeight: 'bold' }}>
                                            เลขที่ออเดอร์: {orderNumber}
                                        </span>
                                    ) : (
                                        <span style={{ marginLeft: '150px', fontSize: '12px', color: '#888' }}>
                                            ยังไม่มีเลขที่ออเดอร์
                                        </span>
                                    )}
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
                            src={`${api_url.replace("/api", "")}/storage/app/public/product/${slug}/${item.image}`}
                            alt={item.p_name}
                                width={100}
                                height={100}
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
                                <p style={styles.cartItemPrice}>
                                    ราคา {item.price.toFixed(2)} บาท
                                </p>
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
                    รวม: {calculateTotalWithBillDiscountAndVAT().toFixed(2)} ฿
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
                        <div style={styles.discountAndReceivedAmountRow}>
                {/* ปุ่มเลือก VAT */}
                <div
                style={{
                    display: 'flex', // ใช้ Flexbox จัดตำแหน่งให้อยู่ในแถวเดียวกัน
                    alignItems: 'center', // จัดให้อยู่แนวตั้งตรงกลาง
                    gap: '4px', // เพิ่มช่องว่างระหว่างองค์ประกอบ
                }}
            >  
                {/* เลือก VAT */}
                <select
                    value={vatType}
                    onChange={(e) => setVatType(e.target.value)}
                    style={{
                        backgroundColor: 'white',
                        border: '1px solid #cccccc',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        fontSize: '13px',
                        color: '#333',
                        outline: 'none',
                        boxShadow: 'none',
                        flex: 1, // ให้ขนาดพอดีกับพื้นที่
                    }}
                >
                    <option value="noTax">ไม่มีภาษี</option>
                    <option value="includeVat7">รวมภาษีมูลค่าเพิ่ม 7%</option>
                    <option value="excludeVat7">ไม่รวมภาษีมูลค่าเพิ่ม 7%</option>
                    <option value="includeVat3">รวมภาษีมูลค่าเพิ่ม 3%</option>
                    <option value="excludeVat3">ไม่รวมภาษีมูลค่าเพิ่ม 3%</option>
                </select>

                {/* ส่วนลดรวม */}
                <input
                    type="number"
                    placeholder="ส่วนลดรวม"
                    value={billDiscount || ''}
                    onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                    style={{
                        backgroundColor: 'white',
                        border: '1px solid #cccccc',
                        borderRadius: '4px',
                        padding: '8px 1px',
                        fontSize: '13px',
                        width:'75px',
                        color: '#333',
                        outline: 'none',
                        flex: 1, // ให้ขนาดพอดีกับพื้นที่
                    }}
                />

                {/* ประเภทส่วนลด */}
                <select
                    value={billDiscountType}
                    onChange={(e) => setBillDiscountType(e.target.value)}
                    style={{
                        backgroundColor: 'white',
                        border: '1px solid #cccccc',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        fontSize: '13px',
                        color: '#333',
                        outline: 'none',
                        boxShadow: 'none',
                        flex: 1, // ให้ขนาดพอดีกับพื้นที่
                    }}
                >
                    <option value="THB">บาท (฿)</option>
                    <option value="%">%</option>
                </select>
            </div>
        </div>
            {/* ปุ่มเพิ่มจำนวนเงิน */}
            <div style={styles.amountButtons}>
                {[1, 20, 50, 100, 500, 1000].map((amount) => (
                    <button key={amount} onClick={() => handleAmountButton(amount)} style={styles.amountButton}>
                        +{amount}.00
                    </button>
                ))}
               <div
                    style={{
                        display: 'flex', // ใช้ Flexbox
                        alignItems: 'center', // จัดตำแหน่งแนวตั้งให้อยู่ตรงกลาง
                        justifyContent: 'space-between', // กระจายพื้นที่ระหว่างแต่ละองค์ประกอบ
                        gap: '3px', // เพิ่มช่องว่างระหว่างองค์ประกอบ
                    }}
                >
                    {/* Input ช่องรับเงิน */}
                <input
                    type="number"
                    placeholder="รับเงิน"
                    value={receivedAmount || ''}
                    onChange={(e) => {
                        const inputAmount = parseFloat(e.target.value) || 0;
                        setReceivedAmount(inputAmount); // อนุญาตให้กรอกจำนวนเงินเกินยอดรวมได้
                    }}
                    style={{
                        ...styles.amountInputHalf,
                        flex: 2, // ปรับให้ input มีพื้นที่ใหญ่กว่า
                    }}
                />


                {/* ปุ่มรับเงินเต็มจำนวน */}
                <button
                    onClick={handleFullAmount}
                    style={{
                        ...styles.amountButton,
                        background: '#3cad13', // สีพื้นหลังแบบสีเขียวธรรมดา
                        color: '#ffffff',
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        width: 'auto',
                        padding: '8px 25px',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                    }}
                >
                    รับเงินเต็มจำนวน
                </button>

                    <button
                        onClick={resetAmount}
                        style={{
                            ...styles.amountButton,
                            background: '#e02214', // ใช้สีแดงธรรมดา
                            color: '#ffffff',
                            borderRadius: '8px',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                            cursor: 'pointer',
                            padding: '8px 20px', // เพิ่ม padding ให้ปุ่มใหญ่ขึ้น
                            transition: 'all 0.3s ease',
                            flex: 1, // ให้ปุ่มนี้มีขนาดพื้นที่รองลงมา
                        }}
                    >
                        C
                    </button>
            </div>
            </div>

            {/* การแสดงเงินทอน */}
            <div style={styles.changeDi}>
                ยอดคงเหลือ: {calculateRemainingDue().toFixed(2)} บาท
            </div>
            {/* การแสดงเงินทอน และปุ่มดูประวัติการแยกชำระ */}
            <div
            style={{
                display: 'flex', // ใช้ Flexbox จัดให้อยู่ในแถวเดียวกัน
                justifyContent: 'space-between', // กระจายพื้นที่ระหว่างองค์ประกอบ
                alignItems: 'center', // จัดตำแหน่งให้อยู่ตรงกลางในแนวตั้ง
                padding: '10px 0', // เพิ่ม Padding ด้านบนและล่าง
            }}
            >
            {/* แสดงเงินทอน */}
            <div
                style={{
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: '#0d1b13',
                    marginRight: '10px', // เพิ่มระยะห่างจากปุ่ม
                }}
            >
                เงินทอน: {calculateChange()} บาท
            </div>

            {/* ปุ่มดูประวัติการแยกชำระ */}
            <div style={{ position: 'relative', textAlign: 'right' }}>
                {splitPaymentCount > 0 && (
                    <span
                        style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            backgroundColor: 'red',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            fontSize: '12px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        {splitPaymentCount}
                    </span>
                )}
                    <button
                        style={{
                            padding: '10px',
                            borderRadius: '5px',
                            backgroundColor: '#c7a641',
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            border: 'none', // เอากรอบออก
                            boxShadow: 'none', // เอาเงาออก
                        }}
                        onClick={toggleSplitPaymentPopup}
                    >
                        ดูประวัติการแยกชำระ
                    </button>
                </div>
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
                    onClick={addOrderItems}
                    disabled={cart.length === 0}
                >
                    อัพเดทอาหาร
                </button>
            ) : (
                <button
                    style={{
                        ...styles.receiveOrderButton,
                        ...(cart.length === 0 ? styles.buttonDisabled : {}),
                    }}
                    onClick={receiveOrder}
                    disabled={cart.length === 0}
                >
                    รับออเดอร์
                </button>
            )}

                        {/* ปุ่มแยกชำระเงิน */}
            <button
                style={{
                    ...styles.paymentButton,
                    backgroundColor: orderReceived && calculateRemainingDue() === 0 ? '#2ecc71' : '#f39c12', // สีเขียวเมื่อยอดคงเหลือ 0, สีส้มเมื่อยังมีคงเหลือ
                    ...(orderReceived && paymentMethod && (receivedAmount > 0 || calculateRemainingDue() === 0) ? {} : styles.paymentButtonDisabled), // ปิดการใช้งานถ้าไม่มีการรับออเดอร์ หรือไม่เลือกวิธีชำระเงิน
                }}
                onClick={() => {
                    if (orderReceived && calculateRemainingDue() === 0) {
                        setShowReceipt(true); // เปิดหน้าต่างแสดงบิล
                    } else if (orderReceived) {
                        handlePartialPayment(); // ดำเนินการแยกชำระเงิน
                    }
                }}
                disabled={!orderReceived || !paymentMethod || (receivedAmount <= 0 && calculateRemainingDue() !== 0)} // ปิดการใช้งานถ้าไม่มีการรับออเดอร์หรือไม่เลือกวิธีชำระเงิน
            >
                {orderReceived && calculateRemainingDue() === 0 ? 'แสดงบิล' : 'แยกชำระเงิน'}
            </button>

            <button
                style={{
                    ...styles.paymentButton,
                    ...(orderReceived && cart.length > 0 && paymentMethod && receivedAmount >= calculateTotalWithBillDiscountAndVAT() 
                        ? {} 
                        : styles.paymentButtonDisabled),
                }}
                onClick={handlePayment}
                disabled={!orderReceived || !paymentMethod || cart.length === 0 || receivedAmount < calculateTotalWithBillDiscountAndVAT()}
            >
                ชำระเงิน
            </button>
            </div>
            </div>
            </div>
            {isSplitPaymentPopupOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '10px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        zIndex: 1000,
                        width: '300px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                    }}
                >
                    <h3 style={{ marginBottom: '10px', color: '#333', textAlign: 'center' }}>
                        ประวัติการแยกชำระ
                    </h3>
                    {payments && payments.length > 0 ? (
                        payments.map((payment, index) => (
                            <div
                                key={index}
                                style={{
                                    marginBottom: '10px',
                                    padding: '10px',
                                    borderBottom: '1px solid #ddd',
                                }}
                            >
                                <p>วันที่: {new Date(payment.payment_date).toLocaleString()}</p>
                                <p>จำนวนเงิน: {payment.amount.toFixed(2)} บาท</p>
                                <p>ช่องทาง: {payment.pay_channel_id === 1 ? 'เงินสด' : 'QR Code'}</p>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: '#888', textAlign: 'center' }}>ไม่มีประวัติการแยกชำระ</p>
                    )}
                    <button
                        onClick={toggleSplitPaymentPopup}
                        style={{
                            marginTop: '10px',
                            padding: '10px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            borderRadius: '5px',
                            width: '100%',
                            cursor: 'pointer',
                        }}
                    >
                        ปิด
                    </button>
                </div>
            )}
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
                        <p>โต๊ะ: {`T${String(tableCode).padStart(3, '0')}`}</p>
                        <p>
                            ยอดบิล: 
                            <span style={styles.summaryValue}>
                                {calculateTotalWithBillDiscountAndVAT().toFixed(2)} บาท
                            </span>
                        </p>
                        <p>
                            ยอดภาษีมูลค่าเพิ่ม ({vatType.includes('7') ? '7%' : vatType.includes('3') ? '3%' : '0%'} 
                            {vatType.includes('include') ? ' รวม' : vatType.includes('exclude') ? ' ไม่รวม' : ''}): 
                            <span style={styles.summaryValue}>
                                {calculateVAT().toFixed(2)} บาท
                            </span>
                        </p>
                        <p>
                            รับเงิน: 
                            <span style={styles.summaryValue}>
                                {(receivedAmount + calculateTotalPaid()).toFixed(2)} บาท
                            </span>
                        </p>
                        <p>
                            เงินทอน: 
                            <span style={styles.summaryValue}>
                                {calculateTotalPaidWithChange().change.toFixed(2)} บาท
                            </span>
                        </p>
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
                                    style={styles.actionButton}
                                    onClick={closeReceipt} // บันทึกบิลโดยไม่มีเงื่อนไข
                                >
                                    บันทึกบิล
                                </button>
                                <button style={styles.pauseButton} onClick={handlePauseBill}>
                                    พักพ์บิล
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
    labelText: { fontSize: '14px', fontWeight: 'bold', color: '#333' },
    circleItem: { width: '140px', height: '140px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer' },
    popupTitle: { fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', color: '#333', margin: '0px' },
    icon: { margin: '20px 0', cursor: 'pointer', borderRadius: '12px', padding: '5px', width: '10px', height: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s ease' },
    categoryRow: { display: 'flex', justifyContent: 'center', gap: '10px', margin: '0 auto', flexWrap: 'wrap', alignItems: 'center', width: '100%',},
    searchAndTableCodeContainer: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', },
    pageContainer: { display: 'flex', padding: '10px', height: '92vh',overflow: 'hidden', },
    sidebarContainer: { flex: '0 0 100px' },
    cart: {width: '400px',overflowY: 'auto',overflowX: 'hidden',backgroundColor: '#f8f9fa',padding: '15px',borderRadius: '12px',marginTop: '-8px',display: 'flex',flexDirection: 'column',justifyContent: 'flex-start',boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',},    
    discountAndTotal: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' },
    totalText: { fontSize: '1.1rem',fontWeight: '400', textAlign: 'left', marginTop: '2px', color: '#444', paddingLeft: '5px', lineHeight: '1', fontFamily: '   Impact, sans-serif ', textTransform: 'uppercase', paddingBottom: '5px', letterSpacing: '2px', },
    orderReceived: { display: 'flex',flexDirection: 'column',alignItems: 'center',marginTop: '20px',},
    discountInputSmall: { width: 'calc(33.33% - 10px)',padding: '2px',borderRadius: '4px',border: '1px solid #ddd', fontSize: '12px'},
    discountAndReceivedAmountRow: {display: 'flex',gap: '10px',flexWrap: 'wrap',justifyContent: 'space-between',marginBottom: '15px',marginTop:'5px'},
    discountContainerHalf: { display: 'flex', alignItems: 'center', gap: '2px', flex: 1, marginTop: '-12px' },
    amountInputHalf: { width: '8.4rem',padding: '8px',borderRadius: '4px',border: '1px solid #ddd',flex: '1',},    
    amountInputSmall: { width: '40%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd' },
    cartItemPriceDiscountRow: { display: 'flex', alignItems: 'center', gap: '3px', flexDirection: 'row', marginTop: '-27px' },
    categoryCircle: { width: '145px',height: '60px',display: 'flex',alignItems: 'center',justifyContent: 'center',borderRadius: '5px',fontWeight: 'bold',cursor: 'pointer',fontSize: '12px', textAlign: 'center',margin: '5px',background: '#fff', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',color: '#ffffff', transition: 'all 0.3s ease',':hover': {transform: 'scale(1.1)', boxShadow: '0 6px 8px rgba(0, 0, 0, 0.2)',},},
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
    searchInput: { width: 'calc(940px - 150px)', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' },
    products: { display: 'flex', flexWrap: 'wrap', gap: '15px', },
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
    changeDi: {fontSize: '1.2rem',fontWeight: 'bold',textAlign: 'center',margin: '5px 0',color: '#ef0c0c',},
    buttonContainer: { display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center' },
    changeDisplay: {fontSize: '1rem',fontWeight: 'bold',textAlign: 'center',margin: '10px 0',color: '#0d1b13',},
    actionButton: { flex: 1, padding: '8px', backgroundColor: '#499cae', color: '#ffffff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
    pauseButton: { flex: 1, padding: '8px', backgroundColor: '#cccccc', color: '#0f0e0e', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
    productCount: { fontSize: '14px', color: '#333', display: 'inline', paddingRight: '10px', marginLeft: '10px' ,fontWeight:'bold' },
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
