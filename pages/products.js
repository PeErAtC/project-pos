"use client";

import { useEffect, useState, useRef ,useMemo} from 'react';
import axios from 'axios';
import Sidebar from './components/sidebar';
import Image from 'next/image';
import { FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css'; // โหลด CSS ของ SweetAlert2
import { useRouter } from 'next/router';
import { FaArrowLeft, FaArrowRight } from "react-icons/fa"; // ✅ เพิ่มไอคอน
import Keyboard from './keyboard'; 



export default function SalesPage() {
    const [products, setProducts] = useState([]);
    const router = useRouter();
    const [showPopup, setShowPopup] = useState(false); // สำหรับแสดงป๊อบอัพ
    const { tableCode, tableId } = router.query; // ✅ ตรวจสอบค่าก่อนใช้
    const [cart, setCart] = useState([]);
    const [order, setOrder] = useState(null); // เก็บข้อมูลออเดอร์
    const [receivedAmount, setReceivedAmount] = useState(0);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [billDiscount, setBillDiscount] = useState(0);
    const [billDiscountType, setBillDiscountType] = useState("THB");
    const [showReceipt, setShowReceipt] = useState(false);
    const [orderReceived, setOrderReceived] = useState(false);
    const [selectedQuantity, setSelectedQuantity] = useState(1); // เก็บค่าจำนวนที่เลือก
    const [isBillPaused, setIsBillPaused] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [orderNumber, setOrderNumber] = useState("");
    const [categories, setCategories] = useState([]);
    // const [isCategoryPopupOpen, setIsCategoryPopupOpen] = useState(false);
    const [orderId, setOrderId] = useState(null);
    // const VAT_RATE = 0.07;
    const [paymentMethod, setPaymentMethod] = useState(''); // เก็บวิธีการชำระเงินที่เลือก
    const [qrCodeData, setQrCodeData] = useState(null);
    const [showQRCode, setShowQRCode] = useState(false);
    const [vatType, setVatType] = useState('noTax'); // ค่าเริ่มต้นเป็นไม่มีภาษี
    const [totalWithVAT, setTotalWithVAT] = useState(0);
    const [payments, setPayments] = useState([]); // State เก็บข้อมูลการชำระเงินที่ทำไปแล้ว
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [temporaryPayments, setTemporaryPayments] = useState([]); // เก็บข้อมูลการแยกชำระเงินชั่วคราว
    const [isSplitPaymentPopupOpen, setIsSplitPaymentPopupOpen] = useState(false);
    const [splitPaymentCount, setSplitPaymentCount] = useState(0); // เก็บจำนวนรายการแยกชำระ
    const categoryRowRef = useRef(null); // ใช้ reference เพื่อจัดการการเลื่อน
    const [activeCategory, setActiveCategory] = useState(null);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [partialPayments, setPartialPayments] = useState([]);
    const [remainingDue, setRemainingDue] = useState(0); // สร้าง state สำหรับยอดคงเหลือ
    const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
    const [promptPayAPI, setPromptPayAPI] = useState("");
    const [promptPayAcc, setPromptPayAcc] = useState("");
    const [showKeyboard, setShowKeyboard] = useState(false);
    const [activeField, setActiveField] = useState(null);
    const [keyboardPosition, setKeyboardPosition] = useState({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
    });
    const [showAddItemPopup, setShowAddItemPopup] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [orderDetails, setOrderDetails] = useState(null);
    const [tableName, setTableName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const inputRef = useRef(null);
    const searchInputRef = useRef(null);
    const inputRefPopup = useRef(null);

    // const [change, setChange] = useState(0); // ประกาศ state สำหรับเงินทอน

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

      useEffect(() => {
        const storedTableName = localStorage.getItem("selected_table");
        console.log("📌 ดึงค่าจาก LocalStorage ใน products.js:", storedTableName);
        console.log("📌 ค่า tableId ที่รับจาก query:", tableId);

        if (storedTableName) {
            setTableName(storedTableName);
        }
    }, [tableId]);
    
    

    // ฟังก์ชัน fetchProducts
    const fetchProducts = async () => {
        try {
            const { api_url, slug, authToken } = getApiConfig();
            const response = await axios.get(`${api_url}/${slug}/products`, {
                headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${authToken}` },
            });
    
            if (Array.isArray(response.data)) {
                setProducts(response.data);
            } else {
                console.warn('API response format is incorrect');
                setProducts([]);
            }
        } catch (error) {
            console.error('Error fetching products:', error.message);
            setProducts([]);
        }
    };
    
    useEffect(() => {
        if (typeof window !== "undefined") {
            fetchProducts();
            fetchCategories();
            const interval = setInterval(fetchProducts, 60000);
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

        const response = await axios.get(`${api_url}/${slug}/orders/${tableId}/table_lastorder`, {
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
        // ✅ ดึงค่าทั้ง tableId และ tableCode
        const storedTableId = localStorage.getItem("selected_table_id");
        const storedTableCode = localStorage.getItem("selected_table");
        
        const finalTableId = tableId || storedTableId; 
        const finalTableCode = tableCode || storedTableCode;

        if (!finalTableId || !finalTableCode) {
            console.warn('❌ ไม่มี tableId หรือ tableCode');
            return;
        }

        try {
            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';

            if (!api_url.endsWith('/api')) api_url += '/api';

            // ✅ ใช้ tableId สำหรับ API
            const url = `${api_url}/${slug}/orders/${finalTableId}/table_lastorder`;
            console.log("🔍 API URL:", url);
            console.log("📌 tableId:", finalTableId, " | tableCode:", finalTableCode);

            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            if (response.data && response.data.order) {
                const lastOrder = response.data.order;

                if (lastOrder.status === 'N') {
                    console.log("✅ ออเดอร์ล่าสุด:", lastOrder);
                    setOrderId(lastOrder.id);
                    setOrderNumber(lastOrder.order_number);
                    setCart(lastOrder.items || []);
                    setTableName(finalTableCode); // ✅ ใช้ tableCode ในการแสดงผล
                } else {
                    console.warn("⚠️ ออเดอร์ล่าสุดไม่ใช่สถานะ 'N'");
                    setCart([]);
                }
            } else {
                console.warn("⚠️ ไม่มีข้อมูลออเดอร์ล่าสุด");
                setCart([]);
            }
        } catch (error) {
            console.error("❌ เกิดข้อผิดพลาดในการดึงออเดอร์ล่าสุด:", error.response?.data || error.message);
            setCart([]);
        }
    };

    loadTableLastOrder();
}, [tableId, tableCode]);  // ✅ ฟังการเปลี่ยนแปลงของทั้ง tableId และ tableCode


// ฟังก์ชันสำหรับบันทึกข้อมูลตะกร้าใน LocalStorage
useEffect(() => {
    if (tableCode && cart.length > 0) {
        console.log(`💾 บันทึกตะกร้าลง LocalStorage`, cart);
        localStorage.setItem(`cart_${tableCode}`, JSON.stringify(cart));
    }
}, [cart, tableCode]); 



// ใช้ useEffect ดึงข้อมูลออเดอร์เมื่อ tableCode เปลี่ยนแปลง
useEffect(() => {
    if (tableCode) {
        loadTableLastOrder(tableCode); // เมื่อ tableCode เปลี่ยนให้โหลดออเดอร์ล่าสุด
    }
}, [tableCode]);

// ฟังก์ชันโหลดข้อมูลออเดอร์ล่าสุดจาก API ตาม tableCode
const loadTableLastOrder = async (tableCode) => {
    if (!tableCode) {
        console.warn('ไม่มี tableCode');
        return;
    }

    try {
        // ดึงข้อมูลจาก localStorage
        let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
        const slug = localStorage.getItem('slug') || 'default_slug';
        const authToken = localStorage.getItem('token') || 'default_token';

        if (!api_url.endsWith('/api')) api_url += '/api';

        const url = `${api_url}/${slug}/orders/${tableCode}/table_lastorder`;

        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (response.data && response.data.order) {
            const lastOrder = response.data.order;

            if (lastOrder.status === 'N') {
                console.log("ออเดอร์ล่าสุด:", lastOrder);
                loadOrderDetails(lastOrder.id);  // เรียกฟังก์ชันเพื่อดึงข้อมูลออเดอร์มาแสดง
                setCart(lastOrder.items || []);  // อัปเดตตะกร้าด้วยรายการสินค้าจากออเดอร์ล่าสุด
            } else {
                console.warn("ออเดอร์ล่าสุดไม่ใช่สถานะ 'N'");
                setCart([]);  // ล้างตะกร้าหากออเดอร์ไม่ใช่สถานะ 'N'
            }
        } else {
            console.warn("ไม่มีข้อมูลออเดอร์ล่าสุด");
            setCart([]); // ล้างตะกร้าหากไม่มีข้อมูลออเดอร์
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงออเดอร์ล่าสุด:', error.message);
        setCart([]); // ล้างตะกร้าหากเกิดข้อผิดพลาด
    }
};

const handleInputFocus = (field, itemId = null, ref = null) => {
    setActiveField({ field, itemId }); // ตั้งค่าฟิลด์ที่ใช้งาน
    setShowKeyboard(true); // แสดงคีย์บอร์ด

    // โฟกัสที่ช่องกรอกที่ถูกคลิก
    if (ref && ref.current) {
        ref.current.focus();
    }

    // ตั้งตำแหน่งของคีย์บอร์ด
    setTimeout(() => {
        const inputElement = document.activeElement;
        if (inputElement) {
            const rect = inputElement.getBoundingClientRect();
            setKeyboardPosition({
                top: `${rect.bottom + window.scrollY + 10}px`, // ตั้งตำแหน่งคีย์บอร์ดให้ตรงกับช่องกรอก
                left: `${rect.left + window.scrollX}px`, // ตำแหน่งคีย์บอร์ดชิดกับช่องกรอก
            });
        }
    }, 100);
};

const handlePopupInputFocus = (ref) => {
    // เมื่อคลิกที่ช่องกรอกในป๊อปอัพ ปิดคีย์บอร์ด
    setActiveField({ field: 'popupSearch' });
    setShowKeyboard(false);  // ปิดคีย์บอร์ด

    if (ref && ref.current) {
        ref.current.focus();  // โฟกัสที่ช่องกรอกที่คลิก
    }
};



    // ฟังก์ชันให้ Input ได้รับโฟกัสช่องกรอกในเพิ่มรายการอาหาร
    const focusInput = () => {
        if (inputRef.current) {
            inputRef.current.focus(); // โฟกัสไปที่ input
        }
    };

    // ✅ โหลดข้อมูลออเดอร์ใหม่เมื่อ `orderId` เปลี่ยน
    useEffect(() => {
        if (orderId) {
            fetchOrderDetails(orderId);  // เรียกฟังก์ชันเพื่อดึงข้อมูลออเดอร์เมื่อ `orderId` เปลี่ยนแปลง
            localStorage.removeItem(`cart_${tableCode}`);  // ลบตะกร้าเก่าออกจาก LocalStorage
        }
    }, [orderId]);  // ฟังการเปลี่ยนแปลงของ `orderId`

    const fetchOrderDetails = async (orderId) => {
        if (!orderId) {
            console.error("❌ Order ID ไม่ถูกต้อง");
            return;
        }
    
        const api_url = localStorage.getItem('url_api');
        const slug = localStorage.getItem('slug');
        const authToken = localStorage.getItem('token');
    
        if (!api_url || !slug) {
            console.error("⚠️ API URL หรือ Slug ไม่ถูกต้อง");
            return;
        }
    
        const endpoint = `${api_url}/api/${slug}/orders/${orderId}`.replace(/\/api\/api\//, "/api/");
        console.log("📡 กำลังดึงข้อมูลออเดอร์ที่:", endpoint);
    
        try {
            const response = await axios.get(endpoint, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
    
            console.log("📦 API Response:", response.data);
    
            if (response.data && Array.isArray(response.data.items)) {
                // ตรวจสอบและเพิ่ม URL รูปภาพให้กับสินค้าที่อยู่ในตะกร้า
                setCart(response.data.items.map(item => {
                    const productData = products.find(prod => prod.id === item.product_id);
                    return {
                        ...item,
                        image: productData ? productData.image : null // ใช้ URL รูปภาพจากสินค้า
                    };
                }));
            } else {
                console.warn("⚠️ ไม่มีข้อมูลสินค้าในออเดอร์");
                setCart([]);  // ล้างตะกร้าหากไม่มีรายการสินค้า
            }
        } catch (error) {
            console.error("❌ Error fetching order details:", error);
            setCart([]); // ล้างตะกร้าหากเกิดข้อผิดพลาด
        }
    };
    
    const handleKeyPress = (key) => {
        if (!activeField || !activeField.field) return; // ป้องกัน error ถ้า activeField ไม่มีค่า
    
        if (activeField.field === "search") {
            setSearchTerm((prev) => (key === "DELETE" ? prev.slice(0, -1) : prev + key));
        } 
        else if (activeField.field === "discount") {
            setCart((prevCart) =>
                prevCart.map((item) =>
                    item.product_id === activeField.itemId
                        ? (() => {
                            let updatedDiscount = key === "DELETE"
                                ? String(item.discount || "").slice(0, -1)
                                : String(item.discount || "") + key;
    
                            let newDiscount = parseFloat(updatedDiscount) || 0;
                            let discountType = item.discountType || "THB"; // ✅ ตั้งค่า "บาท" เป็นค่าเริ่มต้น
    
                            let newPrice = item.price;
                            if (discountType === "%") {
                                newPrice = item.price - (item.price * newDiscount / 100);
                            } else {
                                newPrice = item.price - newDiscount;
                            }
    
                            return {
                                ...item,
                                discount: newDiscount, // ✅ อัปเดตส่วนลด
                                discountType, // ✅ ตั้งค่าเป็น "บาท" หากยังไม่มีค่า
                                finalPrice: Math.max(newPrice, 0) // ✅ ป้องกันราคาติดลบ
                            };
                        })()
                        : item
                )
            );
        } 
        else if (activeField.field === "billDiscount") {
            setBillDiscount((prev) => {
                const updatedValue = key === "DELETE" ? String(prev || "").slice(0, -1) : String(prev || "") + key;
                return updatedValue === "" ? 0 : parseFloat(updatedValue);
            });
        } 
        else if (activeField.field === "receivedAmount") {
            setReceivedAmount((prev) => {
                const updatedValue = key === "DELETE" ? String(prev || "").slice(0, -1) : String(prev || "") + key;
                return updatedValue === "" ? 0 : parseFloat(updatedValue);
            });
        }
    };
    
    
    
    
    
    


    //******ดึงข้อมูลออเดอร์ที่ยังไม่ได้ทำการชำระเงิน****** */
    
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
        // ดึงข้อมูลประวัติการแยกชำระก่อนเปิดหน้าต่าง
        if (orderId) {  // ตรวจสอบว่า orderId มีค่าหรือไม่
            fetchPartialPayments(orderId); // เรียกฟังก์ชันดึงข้อมูลการแยกชำระ
        }
        
        // เปิดหรือปิดหน้าต่างการแยกชำระ
        setIsSplitPaymentPopupOpen((prev) => !prev);
    };
    useEffect(() => {
        if (orderId) {
            fetchPartialPayments(orderId); // ดึงข้อมูลการแยกชำระใหม่หลังจากการชำระ
        }
    }, [temporaryPayments]);  // ใช้ temporaryPayments เพื่ออัปเดตเมื่อข้อมูลการชำระใหม่ถูกเพิ่มเข้ามา
    
    useEffect(() => {
        // อัปเดตจำนวนการแยกชำระเมื่อ `payments` เปลี่ยนแปลง
        setSplitPaymentCount(payments.length);
    }, [payments]);

    useEffect(() => {
        fetchPaymentChanels();
    }, []);

    const fetchPaymentChanels = async () => {
        try {
            let api_url = localStorage.getItem('url_api') || 'https://easyapp.clinic/pos-api/api';
            const slug = localStorage.getItem('slug') || 'abc';
            const authToken = localStorage.getItem('token') || '';
    
            const endpoint = `${api_url}/${slug}/payChanels`; // ✅ แก้ไขให้ถูกต้อง
            console.log(`📌 เรียก API: ${endpoint}`);
    
            const response = await axios.get(endpoint, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
    
            console.log("📌 Response Status:", response.status);
            console.log("📌 Response Data:", response.data);
    
            if (!response.data || response.status !== 200) {
                throw new Error('❌ API Response ไม่ถูกต้อง หรือไม่มีข้อมูล');
            }
    
            setPaymentMethods(response.data);
        } catch (error) {
            console.error("❌ Error fetching payment channels:", error.response?.data || error.message);
            Swal.fire('ผิดพลาด', `ไม่สามารถดึงข้อมูลช่องทางการชำระเงินได้: ${error.message}`, 'error');
        }
    };
    
    
    
// ฟังก์ชัน fetchCategories
    const fetchCategories = async () => {
        try {
            const { api_url, slug, authToken } = getApiConfig();
            const response = await axios.get(`${api_url}/${slug}/category`, {
                headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
            });
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error.message);
        }
    };

    const updateOrderItems = async () => {
        if (!orderId) {
            console.warn("⚠️ Order ID ไม่ถูกต้อง กำลังสร้างออเดอร์ใหม่...");
            await receiveOrder();
            if (!orderId) return; // หากไม่สามารถสร้าง Order ID ได้
        }
    
        const userId = localStorage.getItem('userId') || "1";
        console.log("📌 User ID ที่ใช้ส่งไปยัง API:", userId);
    
        let apiUrl = localStorage.getItem('url_api') || 'https://default.api.url';
        const slug = localStorage.getItem('slug') || 'default_slug';
        const authToken = localStorage.getItem('token') || 'default_token';
    
        if (!apiUrl.endsWith('/api')) apiUrl += '/api';
    
        const endpoint = `${apiUrl}/${slug}/orders/${orderId}`;
    
        try {
            // ดึงข้อมูลสินค้าที่มีอยู่ในออเดอร์ก่อน
            const existingResponse = await axios.get(endpoint, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
    
            // สร้าง Map ของสินค้าที่มีอยู่ในออเดอร์
            const existingItemsMap = new Map(
                existingResponse.data.items.map(item => [item.product_id, item.quantity])
            );
    
            // รวมสินค้าซ้ำในตะกร้า
            const cartItemsMap = cart.reduce((acc, item) => {
                if (acc.has(item.id)) {
                    acc.get(item.id).quantity += item.quantity; // รวมจำนวนสินค้าหากมีสินค้าเดียวกัน
                } else {
                    acc.set(item.id, {
                        ...item,
                    });
                }
                return acc;
            }, new Map());
    
            const itemsToAdd = [];
    
            // ตรวจสอบสินค้าที่มีอยู่ในตะกร้าและอัปเดต
            cartItemsMap.forEach((item, productId) => {
                // ตรวจสอบว่ามีสินค้านี้ในฐานข้อมูลหรือไม่
                if (!existingItemsMap.has(productId)) {
                    // เพิ่มสินค้าลงฐานข้อมูล
                    itemsToAdd.push({
                        product_id: item.id,
                        p_name: item.p_name || 'ไม่มีชื่อสินค้า',
                        quantity: item.quantity,
                        price: item.price || 0,
                        created_by: userId,
                        total: calculateDiscountedPrice(item.price, item.discount, item.discountType) * item.quantity,
                    });
                } else {
                    console.log(`รายการสินค้า ${item.p_name} มีอยู่แล้วในออเดอร์และไม่ต้องเพิ่มซ้ำ.`);
                }
            });
    
            // บันทึกการเพิ่มสินค้าหากมี
            if (itemsToAdd.length > 0) {
                await addItemsToDatabase(orderId, itemsToAdd);
            }
    
            // รีเฟรชข้อมูลออเดอร์ใหม่และเคลียร์ตะกร้า
            setTimeout(async () => {
                await fetchOrderDetails(orderId); // ดึงข้อมูลใหม่
                setCart([]); // เคลียร์ตะกร้าหลังการดึงข้อมูล
            }, 500);
    
            Swal.fire({
                icon: 'success',
                title: 'อัปเดตออเดอร์สำเร็จ!',
                text: 'รายการอาหารถูกอัปเดตเรียบร้อยแล้ว',
            });
    
        } catch (error) {
            console.error("❌ เกิดข้อผิดพลาดในการอัปเดตออเดอร์:", error);
            Swal.fire('ผิดพลาด', 'ไม่สามารถอัปเดตออเดอร์ได้', 'error');
        }
    };
    
    
    const handleCategorySelect = (categoryId) => {
        console.log("Selected category:", categoryId);  // ตรวจสอบว่า categoryId ที่เลือกมีค่า
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
    
        setCart((prevCart) => {
            // ค้นหาสินค้าว่ามีอยู่ในตะกร้าหรือไม่
            const existingItem = prevCart.find((item) => item.id === product.id);
    
            if (existingItem) {
                // ถ้ามีอยู่แล้ว ให้เพิ่มจำนวน
                return prevCart.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                // ถ้ายังไม่มี ให้เพิ่มใหม่
                return [
                    ...prevCart,
                    {
                        ...product,
                        quantity: 1,
                        discount: product.discount || 0,
                        discountType: product.discountType || "THB",
                    },
                ];
            }
        });
    
        console.log("อาหารถูกเพิ่มลงในตะกร้า:", product);
    };
    
    useEffect(() => {
        if (paymentMethod === 'qr') {
            fetchPaymentChanels(); // ดึง URL QR Code
        }
    }, [paymentMethod]);


    
    useEffect(() => {
        console.log("📦 ตะกร้าสินค้า:", cart);
    }, [cart]);
    
    
    const updateQuantity = (productId, delta) => {
        if (!productId) {
            console.error("❌ ไม่พบ productId");
            return;
        }
    
        setCart(prevCart =>
            prevCart.map(item =>
                item.product_id === productId
                    ? { ...item, quantity: Math.max(1, (item.quantity ?? 0) + delta) }
                    : item
            )
        );
    };
   
    
    
    
    const handlePaymentChange = (selectedMethod) => {
        setPaymentMethod(selectedMethod); // บันทึกวิธีการชำระเงินที่เลือก
    
        // ถ้าเลือก PromptPay ให้ดึงข้อมูล API และ Account
        const selectedPayment = paymentMethods.find(method => method.id.toString() === selectedMethod);
        
        if (selectedPayment?.pay_name === "promptpay") {
            setPromptPayAPI(selectedPayment.promptpay_api);
            setPromptPayAcc(selectedPayment.promptpay_acc);
            generateQRCode(selectedPayment.promptpay_acc);
        } else {
            setPromptPayAPI(null);
            setPromptPayAcc(null);
        }
    };
    // สร้าง QRcode
    const generateQRCode = (accountNumber) => {
        const qrData = `https://promptpay.io/${accountNumber}`;
        setQrCodeData(qrData);
    };
    
    const checkPassword = (password) => {
        const api_url = localStorage.getItem('url_api'); // เอา URL API จากที่เก็บไว้
        const slug = localStorage.getItem('slug'); // เอา slug จากที่เก็บไว้
    
        // URL ที่ใช้ในการตรวจสอบรหัสผ่านของผู้ใช้ที่มี owner = 'Y'
        const url = `${api_url}/${slug}/users/password`;
    
        console.log("Checking password at:", url); // ล็อก URL เพื่อให้แน่ใจว่าเป็น URL ที่ถูกต้อง
    
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                password: password,  // รหัสผ่านที่ผู้ใช้กรอก
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // ตรวจสอบว่าเจ้าของมีสถานะ 'Y' หรือไม่
            if (data && data.owner === 'Y') {
                return true; // ผู้ใช้นั้นมีสิทธิ์ในการยกเลิกออเดอร์
            } else {
                return false; // ผู้ใช้นั้นไม่มีสิทธิ์
            }
        })
        .catch(error => {
            console.error("Error checking password:", error);
            throw new Error("ไม่สามารถตรวจสอบข้อมูลได้");
        });
    };
    
    
    const clearCart = () => {
        Swal.fire({
            title: 'กรุณากรอกรหัสผ่านเพื่อยืนยันการยกเลิกออเดอร์',
            input: 'password',  // ใช้ช่องกรอกรหัสผ่าน
            inputPlaceholder: 'กรอกรหัสผ่านของคุณ',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันการยกเลิก',
            cancelButtonText: 'ยกเลิก',
            showLoaderOnConfirm: true,
            preConfirm: (password) => {
                return new Promise((resolve, reject) => {
                    const storedPassword = localStorage.getItem('password');
                    if (password === storedPassword) {
                        resolve();
                    } else {
                        reject('รหัสผ่านไม่ถูกต้อง');
                    }
                });
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'คุณแน่ใจหรือไม่?',
                    text: "คุณต้องการยกเลิกออเดอร์และเคลียร์เมนูทั้งหมดออกหรือไม่?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'ใช่, ยกเลิกออเดอร์!',
                    cancelButtonText: 'ยกเลิก',
                }).then((result) => {
                    if (result.isConfirmed) {
                        if (orderId) {
                            console.log("Order ID:", orderId);
    
                            // เปลี่ยนสถานะออเดอร์เป็น 'C' เมื่อยกเลิกออเดอร์
                            updateOrderStatus(orderId, 'C')
                                .then(() => {
                                    // เปลี่ยนสถานะโต๊ะให้เป็นว่าง (tableFree = 1 และ status = 'Y')
                                    updateTableStatus(tableCode, tableId, 1, 'Y')  // ใช้ tableCode, tableId, tableFreeStatus = 1 และ tableStatus = 'Y'
                                        .then(() => {
                                            // รีเซ็ตค่าต่าง ๆ ในตะกร้า
                                            setCart([]);
                                            setReceivedAmount(0);
                                            setBillDiscount(0);
                                            setBillDiscountType("THB");
                                            setOrderReceived(false);
                                            setIsBillPaused(false);
                                            setOrderNumber(null);  // เคลียร์เลขที่ออเดอร์
    
                                            Swal.fire({
                                                title: 'ออเดอร์ถูกยกเลิก!',
                                                text: 'เมนูทั้งหมดถูกลบและออเดอร์ถูกยกเลิกเรียบร้อยแล้ว',
                                                icon: 'success',
                                                timer: 2000,
                                                showConfirmButton: false
                                            });
                                        })
                                        .catch((error) => {
                                            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตสถานะโต๊ะได้', 'error');
                                            console.error("Error updating table status:", error);
                                        });
                                })
                                .catch((error) => {
                                    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถยกเลิกออเดอร์ได้', 'error');
                                    console.error("Error cancelling order:", error);
                                });
                        } else {
                            Swal.fire('ไม่พบหมายเลขออเดอร์', 'ไม่สามารถยกเลิกออเดอร์ได้', 'error');
                        }
                    }
                });
            }
        }).catch((error) => {
            Swal.fire('เกิดข้อผิดพลาด', error, 'error');
        });
    };
    
    // ฟังก์ชันอัปเดตสถานะออเดอร์
    const updateOrderStatus = async (orderId, status) => {
        if (!orderId) {
            console.error("Order ID is missing");
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่พบหมายเลขออเดอร์ กรุณาลองอีกครั้ง', 'error');
            return false;
        }
    
        try {
            const { api_url, slug, authToken } = getApiConfig();
    
            const response = await axios.put(
                `${api_url}/${slug}/orders/${orderId}`,
                { status: status },
                {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                }
            );
    
            if (response.status === 200) {
                console.log(`✅ อัปเดตสถานะของออเดอร์ ${orderId} เป็น ${status}`);
                return true;
            } else {
                console.error('❌ ข้อผิดพลาดในการอัปเดตสถานะ:', response.data);
                return false;
            }
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการอัปเดตสถานะ:', error.response ? error.response.data : error.message);
            return false;
        }
    };
    
    // ฟังก์ชันอัปเดตสถานะโต๊ะ
    const updateTableStatus = async (tableCode, tableId, tableFreeStatus, tableStatus) => {
        try {
            const { api_url, slug, authToken } = getApiConfig();
            const tableUpdateURL = `${api_url}/${slug}/table_codes/${tableCode}?tableId=${tableId}`;
            console.log("🔄 กำลังกำหนดสถานะโต๊ะ:", tableUpdateURL);
    
            const tableResponse = await axios.put(
                tableUpdateURL,
                { status: tableStatus, tableFree: tableFreeStatus },
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );
    
            if (tableResponse.status === 200 || tableResponse.status === 204) {
                console.log(`✅ โต๊ะ ${tableCode} (ID: ${tableId}) ถูกอัปเดตเป็นสถานะ "ว่าง"`);
                return true;
            } else {
                // ตรวจสอบข้อมูลจากเซิร์ฟเวอร์เมื่อเกิดข้อผิดพลาด
                console.error('❌ ข้อผิดพลาดจากเซิร์ฟเวอร์:', tableResponse.data);
                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตสถานะโต๊ะได้', 'error');
                return false;
            }
        } catch (error) {
            // แสดงข้อมูลที่มากขึ้นเมื่อเกิดข้อผิดพลาด
            console.error('❌ เกิดข้อผิดพลาดในการอัปเดตสถานะโต๊ะ:', error.response ? error.response.data : error.message);
            Swal.fire('เกิดข้อผิดพลาด', `ไม่สามารถอัปเดตสถานะโต๊ะได้: ${error.message}`, 'error');
            return false;
        }
    };
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const calculateTotalPaid = () => {
        const totalPaid = payments.reduce((acc, payment) => acc + payment.amount, 0); // รวมยอดการชำระทั้งหมดจากประวัติการชำระ
        return totalPaid;
    };
    
    
    const calculateDiscountedPrice = (price, discount, discountType) => {
        if (discountType === 'THB') {
            return Math.max(price - discount, 0);
        } else if (discountType === '%') {
            return Math.max(price - (price * discount) / 100, 0);
        }
        return price;
    };

    const savePartialPaymentToDatabase = async (orderId, paymentMethod, amount, balances, moneyChanges, receivedAmount) => {
        try {
            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';
        
            // ตรวจสอบว่า api_url มี /api ต่อท้ายหรือไม่
            if (!api_url.endsWith('/api')) api_url += '/api';
        
            // ใช้เส้นทาง /payments แทน /payments/{order_id}/list
            const url = `${api_url}/${slug}/payments`;
        
            // ตรวจสอบข้อมูลที่จำเป็น
            if (!orderId || !paymentMethod || typeof amount !== "number" || isNaN(amount) || amount <= 0) {
                console.error('❌ ข้อมูลไม่ถูกต้อง:', { orderId, paymentMethod, amount });
                throw new Error('ข้อมูลชำระเงินไม่ถูกต้อง');
            }
        
            const paymentData = {
                order_id: orderId,
                pay_channel_id: paymentMethod, // ใช้ค่าที่เลือกจาก dropdown
                payment_date: new Date().toISOString(), // บันทึกวันที่และเวลาปัจจุบัน
                amount: parseFloat(amount), // ตรวจสอบว่าเป็นจำนวนจริง
                icome: parseFloat(receivedAmount), // จำนวนที่ได้รับจากลูกค้า
                balances: balances, // ยอดคงเหลือที่ต้องชำระ
                money_changes: moneyChanges.toFixed(2), // เงินทอนที่ต้องคืนให้ลูกค้า
                status: 'PARTIAL', // สถานะการชำระเงิน
            };
    
            console.log("📤 ส่งข้อมูลแยกชำระ:", paymentData);
        
            // ส่งข้อมูลการชำระเงินไปยัง API
            const response = await axios.post(url, paymentData, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
        
            // ตรวจสอบการตอบกลับจาก API
            if (response.data && response.data.success) {
                console.log('✅ บันทึกข้อมูลการแยกชำระสำเร็จ:', response.data);
                Swal.fire({
                    title: 'สำเร็จ',
                    text: 'ข้อมูลการแยกชำระถูกบันทึกแล้ว',
                    icon: 'success',
                });
            } else {
                throw new Error('API ไม่สามารถบันทึกข้อมูลการแยกชำระได้');
            }
        } catch (error) {
            console.error('❌ Error saving partial payment:', error.response?.data || error.message);
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลการแยกชำระได้', 'error');
        }
    };
    
    
    const paymentDate = new Date('2025-02-06T03:33:15.615Z');  // ใช้เวลา UTC

    // แสดงวันที่และเวลาในรูปแบบที่ต้องการ โดยกำหนดเขตเวลา
    const formattedDate = paymentDate.toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',  // เปลี่ยนเขตเวลาเป็น Bangkok
        weekday: 'long',           // วันในสัปดาห์ (long format)
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    });
    
    
   
    
    //ดึงประวัติการเเยกชำระ
    const fetchPartialPayments = async (orderId) => {
        try {
            if (!orderId) {
                console.error('❌ orderId ไม่ถูกต้อง');
                return;
            }
    
            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';
    
            if (!api_url.endsWith('/api')) api_url += '/api';
    
            const response = await axios.get(`${api_url}/${slug}/payments/${orderId}/list`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
    
            console.log("📥 รับข้อมูลจาก API:", response.data);
    
            if (response.status === 200 && response.data && Array.isArray(response.data)) {
                const formattedPayments = response.data.map(payment => {
                    const paymentDate = new Date(payment.payment_date);
                    const formattedDate = paymentDate.toLocaleString('th-TH', {
                        timeZone: 'Asia/Bangkok',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    });
    
                    return {
                        ...payment,
                        formattedDate: formattedDate,
                        amount: parseFloat(payment.amount) || 0,
                    };
                });
    
                console.log("✅ แปลงข้อมูลเรียบร้อย:", formattedPayments);
    
                // อัปเดตข้อมูลการแยกชำระ
                setPayments(formattedPayments);
                recalculateRemainingDue(formattedPayments);  // อัปเดตยอดคงเหลือ
            } else {
                console.warn('⚠️ ไม่มีข้อมูลการแยกชำระ หรือข้อมูลไม่ถูกต้อง');
                setPayments([]);  // ตั้งค่าสำหรับ UI กรณีไม่มีข้อมูล
            }
        } catch (error) {
            console.error('🚨 เกิดข้อผิดพลาดในการดึงประวัติการแยกชำระ:', error);
            setPayments([]);  // ตั้งค่าเป็นอาร์เรย์ว่างเพื่อป้องกันปัญหา
        }
    };

    const previousRemainingDue = useRef(null); // เก็บค่าล่าสุดของ remainingDue

    
    // ✅ ใช้ useEffect ดึงข้อมูลเฉพาะเมื่อ orderId เปลี่ยนแปลง
    useEffect(() => {
        if (orderId) {
            fetchPartialPayments(orderId);
        }
    }, [orderId]);
    
    // ✅ คำนวณยอดคงเหลือใหม่เฉพาะเมื่อ cart, billDiscount, หรือ VAT เปลี่ยน
    useEffect(() => {
        const newRemainingDue = calculateRemainingDue();
    
        // ✅ ตรวจสอบว่าค่ามีการเปลี่ยนแปลงก่อนอัปเดต
        if (previousRemainingDue.current !== newRemainingDue) {
            console.log("🔄 ยอดคงเหลือที่ต้องชำระ (อัปเดต):", newRemainingDue);
            setRemainingDue(newRemainingDue);
            previousRemainingDue.current = newRemainingDue; // ✅ อัปเดตค่าใน useRef()
        }
    }, [cart, billDiscount, billDiscountType, vatType]);
    
    // ✅ ใช้ useMemo เพื่อหลีกเลี่ยงการคำนวณซ้ำ
    const calculateTotalAfterItemDiscounts = () => {
        return cart.reduce((acc, item) => 
            acc + calculateDiscountedPrice(Number(item.price), Number(item.discount), item.discountType) * Number(item.quantity)
        , 0) || 0;
    };
    
    
    // ✅ ใช้ useMemo เพื่อลดการคำนวณที่ไม่จำเป็น
    const calculateChange = () => {
        const remainingDue = calculateRemainingDue(partialPayments);
        return Math.max(receivedAmount - remainingDue, 0).toFixed(2);
    };
    
    // ✅ อัปเดต remainingDue เฉพาะเมื่อมีการชำระเงินเปลี่ยนแปลง
    useEffect(() => {
        const totalDue = calculateTotalWithBillDiscountAndVAT(); // คำนวณยอดรวมที่ต้องชำระ
        const totalPaid = calculateTotalPaid() + receivedAmount; // คำนวณยอดที่ชำระไปแล้ว
        
        // ตรวจสอบก่อนอัปเดต state เพื่อลดการ re-render
        if (remainingDue !== totalDue - totalPaid) {
            console.log("ยอดคงเหลืออัปเดต:", totalDue - totalPaid);
            setRemainingDue(totalDue - totalPaid);
        }
    }, [receivedAmount, cart, billDiscount, billDiscountType, vatType]);
    
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
    
        return Math.ceil(discountedTotal + vatAmount); // ✅ ปัดเศษขึ้นให้เป็นจำนวนเต็มบาท
    };
    
    useEffect(() => {
        const totalDue = calculateTotalWithBillDiscountAndVAT(); // คำนวณยอดรวมที่ต้องชำระ
        const totalPaid = calculateTotalPaid() + receivedAmount; // คำนวณยอดที่ชำระไปแล้ว
    
        // แสดงยอดคงเหลือใน console
        console.log("ยอดคงเหลือ:", totalDue - totalPaid);
        
        setRemainingDue(totalDue - totalPaid); // เก็บยอดคงเหลือใน state
    }, [receivedAmount, cart, billDiscount, billDiscountType, vatType]);
    
    
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
    
        return Math.round(vatAmount); // ✅ ปัดเศษค่าภาษีให้เป็นจำนวนเต็มบาท
    };



    // ✅ ประกาศฟังก์ชันก่อน
    const calculateRemainingDue = (partialPayments = []) => {
        const totalDue = calculateTotalWithBillDiscountAndVAT(); // ✅ ยอดรวมทั้งหมดที่ต้องชำระ
        const totalPaid = calculateTotalPaid(); // ✅ ยอดที่ชำระไปแล้ว
    
        // ✅ รวมยอดที่ชำระจากประวัติการแยกชำระ (ถ้ามี)
        const totalPartialPayments = Array.isArray(partialPayments)
            ? partialPayments.reduce((acc, payment) => acc + (Number(payment.amount) || 0), 0)
            : 0;
    
        // ✅ ยอดคงเหลือ = ยอดรวมทั้งหมด - ยอดที่ชำระไปแล้วทั้งหมด
        const remainingDue = Math.max(totalDue - totalPaid - totalPartialPayments, 0);
    
        // ✅ ส่งข้อมูลไปที่ console เฉพาะเมื่อยอดคงเหลือเปลี่ยนแปลง
        if (previousRemainingDue.current !== remainingDue) {
            console.log("🔄 ยอดคงเหลือที่คำนวณได้:", remainingDue);
            previousRemainingDue.current = remainingDue; // ✅ อัปเดตค่าใน useRef()
        }
    
        return remainingDue;
    };
    
   // เปลี่ยนชื่อ remainingDue เพื่อลดการประกาศซ้ำ
    const memoizedRemainingDue = useMemo(() => {
        return calculateRemainingDue(partialPayments);
    }, [partialPayments]);

    const changeAmount = useMemo(() => {
        return Math.max(receivedAmount - memoizedRemainingDue, 0).toFixed(2);
    }, [receivedAmount, memoizedRemainingDue]);

    useEffect(() => {
        console.log("🔄 ยอดคงเหลือที่ต้องชำระ:", memoizedRemainingDue);
        console.log("💰 เงินทอนที่คำนวณได้:", changeAmount);
    }, [memoizedRemainingDue, changeAmount]);
        const calculateTotalWithBillDiscount = () => {
            const baseTotal = calculateTotalAfterItemDiscounts(); // ยอดรวมหลังส่วนลดสินค้า
            return calculateDiscountedPrice(baseTotal, billDiscount, billDiscountType); // ยอดรวมหลังส่วนลดบิล
    };
        
    const calculateTotalWithVAT = () => {
        const baseTotal = calculateTotalAfterItemDiscounts();
        const vatAmount = calculateVAT();
    
        return Math.ceil(vatType.includes('include') ? baseTotal : baseTotal + vatAmount); // ✅ ปัดขึ้นยอดรวมเป็นจำนวนเต็มบาท
    };
    
    const recalculateRemainingDue = () => {
        const totalPaid = temporaryPayments.reduce((acc, payment) => acc + payment.amount, 0);
        const totalDue = calculateTotalWithBillDiscountAndVAT();
        const remainingDue = totalDue - totalPaid;
        
        setRemainingDue(Math.max(remainingDue, 0)); // ป้องกันค่าติดลบ
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
    const receiveOrder = async () => {
        try {
            const { api_url, slug, authToken } = getApiConfig(); 
            const userId = 1; 
            const totalAmountWithVAT = Number(calculateTotalAfterItemDiscounts()) || 0;
    
            console.log("📌 Total Amount with VAT:", totalAmountWithVAT);
    
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
    
            // ✅ ดึง tableId จาก localStorage ถ้าไม่มีใน state
            const storedTableId = localStorage.getItem("selected_table_id"); 
            const finalTableId = tableId || storedTableId; 
    
            if (!finalTableId) {
                console.error('❌ ไม่มี tableId ที่จะอัปเดต');
                Swal.fire('Error', 'ไม่พบหมายเลขโต๊ะ กรุณาลองอีกครั้ง', 'error');
                return;
            }
    
            const orderData = {
                total_amount: totalAmountWithVAT.toFixed(2),
                vat_per: vatPercentage,
                vat_amt: vatAmount.toFixed(2),
                total_amount_with_vat: totalAmountWithVAT.toFixed(2),
                discount: Number(billDiscountType === 'THB' ? billDiscount : 0).toFixed(2),
                discount_per: Number(billDiscountType === '%' ? billDiscount : 0).toFixed(2),
                net_amount: totalAmountWithVAT.toFixed(2),
                status: 'N',
                tables_id: finalTableId, // ✅ ใช้ tableId แทน tableCode
                created_by: localStorage.getItem('userId'),
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
    
            console.log("📤 Order Data to send:", orderData);
    
            // ✅ ส่งคำขอสร้างออเดอร์
            const newOrder = await sendOrder(orderData, api_url, slug, authToken); 
    
            // ✅ เคลียร์ตะกร้าหลังจากรับออเดอร์สำเร็จ
            setCart([]); 
    
            // ✅ โหลดข้อมูลออเดอร์ที่เพิ่งสร้าง
            fetchOrderData(newOrder.id); 
    
            setOrderNumber(newOrder.order_number);
            setOrderId(newOrder.id);
            setOrderReceived(true);
    
            // ✅ ตรวจสอบว่า tableId มีค่าหรือไม่ ก่อนอัปเดตสถานะโต๊ะ
            if (finalTableId) {
                const tableUpdateData = { status: 'N' };
                const url = `${api_url}/${slug}/table_codes/${finalTableId}`; // ✅ ใช้ tableId แทน tableCode
    
                console.log("🔍 Updating table status with URL:", url);
    
                try {
                    const response = await axios.put(url, tableUpdateData, {
                        headers: {
                            Accept: 'application/json',
                            Authorization: `Bearer ${authToken}`,
                        },
                    });
    
                    if (response.status === 200 || response.status === 204) {
                        console.log(`✅ โต๊ะ ${finalTableId} ถูกอัปเดตเป็น "Not Available"`);
                    } else {
                        throw new Error(`Unexpected response status: ${response.status}`);
                    }
                } catch (error) {
                    console.error('❌ Failed to update table status:', error.response?.data || error.message);
                    Swal.fire(
                        'Error',
                        `Failed to update table status: ${error.response?.data?.message || error.message}`,
                        'error'
                    );
                }
            }
        } catch (error) {
            console.error('❌ Error receiving order:', error);
    
            if (error.response) {
                console.error("Response Data:", error.response.data);
                console.error("Response Status:", error.response.status);
            }
    
            Swal.fire('Error', `Could not receive order: ${error.message}`, 'error');
        }
    };
    
    

    const fetchOrderData = async (orderId) => {
        try {
            const { api_url, slug, authToken } = getApiConfig();
            const response = await axios.get(`${api_url}/${slug}/orders/${orderId}`, {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
            });
    
            if (response.status === 200) {
                console.log("Order Data:", response.data);
                setOrderDetails(response.data); // สมมติว่ามี state `setOrderDetails`
            } else {
                throw new Error(`Unexpected response status: ${response.status}`);
            }
        } catch (error) {
            console.error("Error fetching order data:", error);
            Swal.fire('Error', `Could not load order data: ${error.message}`, 'error');
        }
    };
    useEffect(() => {
        if (orderId) {
            setOrderReceived(true);  // เมื่อออเดอร์ถูกดึงมาแล้ว ให้แสดงบล็อกคำนวณ
        }
    }, [orderId]);
    const addItemsToDatabase = async (orderId, items, retry = 2) => {
        const apiUrl = localStorage.getItem('url_api');
        const slug = localStorage.getItem('slug');
        const authToken = localStorage.getItem('token');
    
        if (!apiUrl || !slug || !authToken) {
            console.error("❌ API URL หรือ Slug ไม่ถูกต้อง");
            return;
        }
    
        // ✅ แก้ปัญหา URL ซ้ำ `/api/api/`
        let endpoint = `${apiUrl}/api/${slug}/orders/${orderId}`;
        endpoint = endpoint.replace(/\/api\/api\//, "/api/");
    
        console.log("📡 กำลังส่งข้อมูลไปยัง API:", endpoint);
    
        try {
            const response = await axios.post(endpoint, { items }, {
                headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
            });
    
            console.log("✅ API Response:", response.data);
            return response.data;
        } catch (error) {
            console.error("❌ เกิดข้อผิดพลาด:", error.response?.data || error.message);
    
            if (retry > 0) {
                console.warn(`⚠️ ลองส่ง API อีกครั้ง... เหลือ ${retry} ครั้ง`);
                return addItemsToDatabase(orderId, items, retry - 1);
            }
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

    const closePaymentHistory = () => {
        setIsPaymentHistoryOpen(false);
    };

    const closeReceipt = async () => {
        try {
            const totalDue = parseFloat(calculateTotalWithBillDiscountAndVAT());
            const amountToPay = receivedAmount ? parseFloat(receivedAmount) : parseFloat(calculateTotalPaid());
            const moneyChanges = amountToPay > totalDue ? amountToPay - totalDue : 0;
    
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
    
            // ✅ ใช้ `tables_id` แทน `tableCode`
            let finalTableId = tableId || localStorage.getItem("selected_table_id");
    
            console.log("📌 ค่า tableId ที่ใช้ในการอัปเดตโต๊ะ:", finalTableId);
    
            if (!finalTableId) {
                Swal.fire('ผิดพลาด', 'ไม่สามารถระบุ ID โต๊ะได้', 'error');
                return;
            }
    
            const response = await axios.put(
                `${api_url}/${slug}/orders/${orderId}`,
                {
                    status: 'Y',
                    vat_amt: vatType.includes('exclude') ? calculateVAT() : 0,
                    vat_per: vatType.includes('7') ? 7 : vatType.includes('3') ? 3 : 0,
                    net_amount: totalDue,
                    discount: parseFloat(billDiscount).toFixed(2),
                    payment_method: paymentMethod,
                    money_changes: moneyChanges.toFixed(2),
                    updated_by: 1,
                    created_by: 1
                },
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );
    
            console.log("📌 API Response:", response.data);
    
            if (response && (response.status === 200 || response.status === 201) && response.data?.order) {
                console.log("✅ บันทึกข้อมูลบิลสำเร็จ:", response.data.order);
            } else {
                Swal.fire("แจ้งเตือน", "บิลถูกบันทึกแต่ไม่มีข้อมูล order", "warning");
            }
    
            // ✅ ใช้ `tables_id` แทน `tableCode` ในการอัปเดตโต๊ะ
            if (finalTableId) {
                try {
                    const tableUpdateURL = `${api_url}/${slug}/table_codes/${finalTableId}`;
                    console.log("🔄 กำลังอัปเดตสถานะโต๊ะ:", tableUpdateURL);
    
                    const tableResponse = await axios.patch(
                        tableUpdateURL,
                        { status: 'Y' },
                        {
                            headers: {
                                Accept: "application/json",
                                Authorization: `Bearer ${authToken}`,
                            },
                        }
                    );
    
                    if (tableResponse.status === 200 || tableResponse.status === 204) {
                        console.log(`✅ โต๊ะ ${finalTableId} ถูกอัปเดตเป็น "ว่าง" สำเร็จ`);
                    } else {
                        throw new Error(`❌ Response status: ${tableResponse.status}`);
                    }
                } catch (error) {
                    console.error(`❌ ไม่สามารถอัปเดตสถานะโต๊ะได้: ${error.message}`);
                }
            }
    
            setCart([]);
            localStorage.removeItem(`cart_${finalTableId}`);
            closePaymentHistory();
    
            Swal.fire({
                icon: 'success',
                title: 'บันทึกบิลสำเร็จ',
                text: `บิลถูกปิดเรียบร้อยแล้ว! ยอดสุทธิ: ${totalDue.toFixed(2)} บาท และเงินทอน: ${moneyChanges.toFixed(2)} บาท`,
                confirmButtonText: 'ตกลง',
            }).then(() => {
                resetStateAfterSuccess();
            });
    
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาด:', error.message);
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกบิลได้ กรุณาลองอีกครั้ง', 'error');
        }
    };
    
    
    useEffect(() => {
        if (paymentMethod === "2") {
            const promptPayData = paymentMethods.find(method => method.id.toString() === "2");
            if (promptPayData) {
                setPromptPayAPI(promptPayData.promptpay_api);
                setPromptPayAcc(promptPayData.promptpay_acc);
            }
        }
    }, [paymentMethod]);
    
    
    const formattedTableCode = `T${String(tableCode).padStart(3, '0')}`;

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
    
    const handleItemDiscountChange = (productId, discount, discountType) => {
        setCart((prevCart) =>
            prevCart.map((item) => {
                if (item.product_id === productId) {
                    let newPrice = item.price; // ราคาสินค้าตั้งต้น
    
                    if (discountType === "%") {
                        newPrice = item.price - (item.price * discount / 100); // ✅ หักส่วนลดเป็นเปอร์เซ็นต์
                    } else {
                        newPrice = item.price - discount; // ✅ หักส่วนลดเป็นบาท
                    }
    
                    return { 
                        ...item, 
                        discount, 
                        discountType, 
                        finalPrice: Math.max(newPrice, 0) // ✅ ป้องกันราคาติดลบ
                    };
                }
                return item;
            })
        );
    };
    
    
 
    useEffect(() => {
        console.log("📌 อัปเดตค่าของ paymentMethods:", paymentMethods);
    }, [paymentMethods]);
    
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
        const totalDue = calculateTotalWithBillDiscountAndVAT(); // ยอดรวมทั้งหมด
        const totalPaid = calculateTotalPaid(); // ยอดที่ชำระไปแล้ว
        let remainingDue = totalDue - totalPaid; // ยอดคงเหลือก่อนชำระ
        const change = Math.max(receivedAmount - remainingDue, 0); // คำนวณเงินทอน
        
        if (receivedAmount <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'ยอดเงินไม่ถูกต้อง',
                text: 'กรุณาระบุยอดเงินที่ถูกต้อง (ยอดเงินต้องมากกว่า 0 บาท)',
            });
            return;
        }
    
        // คำนวณยอดคงเหลือใหม่หลังหักยอดชำระแล้ว
        const newRemainingDue = Math.max(remainingDue - receivedAmount, 0);
    
        try {
            // ✅ บันทึกค่ารับเงิน (`receivedAmount`) ลงในฟิลด์ `icome`
            await savePartialPaymentToDatabase(orderId, paymentMethod, receivedAmount, newRemainingDue, change, receivedAmount);
    
            // เพิ่มข้อมูลการแยกชำระใน state
            const newPayment = {
                amount: receivedAmount,
                paymentMethod,
                timestamp: new Date(),
                balances: newRemainingDue, // ✅ ใช้ยอดคงเหลือที่ถูกต้อง
                icome: receivedAmount, // ✅ บันทึกค่ารับเงิน
            };
    
            setTemporaryPayments((prevPayments) => [...prevPayments, newPayment]);
    
            // อัปเดตยอดคงเหลือให้ถูกต้อง
            setRemainingDue(newRemainingDue);
    
            Swal.fire({
                icon: 'success',
                title: 'ชำระเรียบร้อย',
                html: `
                    ยอดที่ชำระ: ${receivedAmount.toFixed(2)} บาท<br>
                    ยอดคงเหลือ: ${newRemainingDue.toFixed(2)} บาท<br>
                    ${change > 0 ? `เงินทอน: ${change.toFixed(2)} บาท` : ''}
                `,
            });
    
            setReceivedAmount(0); // รีเซ็ตช่องกรอกเงิน
    
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลการแยกชำระ:', error.message);
            Swal.fire('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลการแยกชำระเงินได้', 'error');
        }
    };
    
    const scrollCategory = (direction) => {
        if (categoryRowRef.current) {
            const scrollAmount = 250; // ปรับค่าตามความเหมาะสม
            categoryRowRef.current.scrollLeft += direction === "left" ? -scrollAmount : scrollAmount;
        }
    };
    
    const keyboardStyles = {
        position: 'fixed', // ใช้ fixed เพื่อให้อยู่บนหน้าจอ
        top: '50%', // จัดให้อยู่กึ่งกลางแนวตั้ง
        left: '50%', // จัดให้อยู่กึ่งกลางแนวนอน
        transform: 'translate(-1100%, -1000%)', // ใช้ transform เพื่อให้ตำแหน่งเป็นจุดศูนย์กลาง
        zIndex: 9999, // ให้ keyboard อยู่ด้านหน้าสุด
        padding: '15px',
        borderRadius: '10px',
    };
    
    const processCreditCardPayment = async () => {
        try {
            if (!orderId) {
                Swal.fire('ผิดพลาด', 'ไม่พบเลขที่ออเดอร์ กรุณาลองอีกครั้ง', 'error');
                return;
            }
    
            const totalDue = calculateTotalWithBillDiscountAndVAT(); // ยอดที่ต้องชำระ
            const receivedAmount = totalDue; // บัตรเครดิตจะคิดเต็มจำนวน
    
            let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
            const slug = localStorage.getItem('slug') || 'default_slug';
            const authToken = localStorage.getItem('token') || 'default_token';
    
            if (!api_url.endsWith('/api')) api_url += '/api';
    
            const paymentData = {
                order_id: orderId,
                pay_channel_id: paymentMethod, // ช่องทางการชำระเงินเป็นบัตรเครดิต
                payment_date: new Date().toISOString(),
                amount: parseFloat(receivedAmount),
                icome: parseFloat(receivedAmount),
                balances: 0, // ยอดคงเหลือเป็น 0
                money_changes: 0, // ไม่มีเงินทอนสำหรับบัตรเครดิต
                status: 'PAID', // กำหนดสถานะเป็น "PAID"
            };
    
            console.log("📤 กำลังส่งข้อมูลชำระบัตรเครดิต:", paymentData);
    
            // ส่งข้อมูลไปยัง API
            const response = await axios.post(`${api_url}/${slug}/payments`, paymentData, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
    
            if (response.data && response.data.success) {
                console.log('✅ ชำระเงินด้วยบัตรเครดิตสำเร็จ:', response.data);
                Swal.fire('สำเร็จ', 'ชำระเงินด้วยบัตรเครดิตเรียบร้อยแล้ว', 'success');
    
                // อัปเดตสถานะออเดอร์เป็น "ชำระแล้ว"
                await axios.put(
                    `${api_url}/${slug}/orders/${orderId}`,
                    { status: 'Y', net_amount: totalDue, payment_method: paymentMethod },
                    { headers: { Accept: "application/json", Authorization: `Bearer ${authToken}` } }
                );
    
                // อัปเดตสถานะโต๊ะเป็น "ว่าง" หลังจากชำระเงินแล้ว
                if (tableCode) {
                    await axios.patch(
                        `${api_url}/${slug}/table_codes/${tableCode}`,
                        { status: 'Y' },
                        { headers: { Accept: "application/json", Authorization: `Bearer ${authToken}` } }
                    );
                }
    
                // รีเซ็ตค่าและแสดงบิล
                resetStateAfterSuccess();
                setShowReceipt(true);
            } else {
                throw new Error('API ไม่สามารถบันทึกการชำระเงินได้');
            }
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการชำระบัตรเครดิต:', error);
            Swal.fire('ผิดพลาด', 'ไม่สามารถดำเนินการชำระเงินด้วยบัตรเครดิตได้', 'error');
        }
    };
    
    // ฟังก์ชันสำหรับเปิดป๊อบอัพเพิ่มรายการอาหาร
 // ✅ 1. ฟังก์ชันเปิด Popup เพิ่มสินค้า
const handleAddOrderItemsPopup = () => {
    setShowAddItemPopup(true);
};

// ✅ 2. ฟังก์ชันเพิ่มสินค้าเข้าไปในออเดอร์
const handleAddToOrder = (product, selectedQuantity) => {
    setSelectedItems(prevItems => {
        const exists = prevItems.find(item => item.id === product.id);
        if (exists) {
            return prevItems.map(item =>
                item.id === product.id 
                    ? { ...item, quantity: item.quantity + selectedQuantity } 
                    : item
            );
        } else {
            return [...prevItems, { ...product, quantity: selectedQuantity }];
        }
    });
};

// ✅ 3. ฟังก์ชันลบสินค้าออกจากออเดอร์
const handleRemoveItem = (productId) => {
    setSelectedItems(selectedItems.filter(item => item.id !== productId));
};

// ✅ 4. ฟังก์ชันดึงรายการสินค้าในออเดอร์ที่มีอยู่แล้ว
const fetchExistingOrderItems = async () => {
    try {
        const { api_url, slug, authToken } = getApiConfig();
        const response = await axios.get(
            `${api_url}/${slug}/orders/${orderId}`,
            { headers: { 'Authorization': `Bearer ${authToken}` } }
        );
        return response.data.items || [];
    } catch (error) {
        console.error("Error fetching existing order items:", error);
        return [];
    }
};

// ✅ 5. ฟังก์ชันยืนยันการเพิ่มสินค้า
const handleConfirm = async () => {
    try {
        console.log('handleConfirm ถูกเรียก!');
        console.log('Selected Items:', selectedItems);

        const result = await Swal.fire({
            title: 'ยืนยันการเพิ่มอาหาร?',
            text: 'ต้องการเพิ่มรายการนี้หรือไม่?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isDismissed) {
            console.log("❌ ผู้ใช้กดยกเลิก");
            return;
        }

        console.log("✅ ผู้ใช้กดยืนยัน");

        const existingOrderItems = await fetchExistingOrderItems();

        const updatedItems = selectedItems.map(item => {
            const existingItem = existingOrderItems.find(orderItem => orderItem.product_id === item.id);
            const newQuantity = existingItem ? existingItem.quantity + item.quantity : item.quantity;
            return {
                product_id: item.id,
                p_name: item.p_name,
                quantity: newQuantity,
                price: item.price || 0,
                total: newQuantity * (item.price || 0),
            };
        });

        const { api_url, slug, authToken } = getApiConfig();
        const dataToSend = { items: updatedItems };

        console.log("Sending data to API:", dataToSend);

        const response = await axios.post(
            `${api_url}/${slug}/orders/${orderId}`,
            dataToSend,
            { 
                headers: { 
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                } 
            }
        );

        if (response.status === 200) {
            await Swal.fire({
                icon: 'success',
                title: 'เพิ่มรายการสำเร็จ!',
                text: 'รายการของคุณได้รับการอัปเดตเรียบร้อยแล้ว',
                confirmButtonColor: '#2ecc71',
            });

            setSelectedItems([]); 
            setShowAddItemPopup(false);

            await loadTableLastOrder(tableCode);
            await refreshOrderData(response.data.order.id);
        }
    } catch (error) {
        await Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถเพิ่มรายการได้ กรุณาลองใหม่',
            confirmButtonColor: '#e74c3c',
        });
    }
};





// ✅ 6. ฟังก์ชันดึงข้อมูลออเดอร์ล่าสุดหลังจากบันทึกสำเร็จ
const refreshOrderData = async (orderId) => {
    if (!orderId) {
        console.error("❌ Order ID ไม่ถูกต้อง");
        return;
    }

    const api_url = localStorage.getItem('url_api');
    const slug = localStorage.getItem('slug');
    const authToken = localStorage.getItem('token');

    if (!api_url || !slug) {
        console.error("⚠️ API URL หรือ Slug ไม่ถูกต้อง");
        return;
    }

    const endpoint = `${api_url}/api/${slug}/orders/${orderId}`.replace(/\/api\/api\//, "/api/");
    console.log("📡 กำลังดึงข้อมูลออเดอร์ที่:", endpoint);

    try {
        const response = await axios.get(endpoint, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log("📦 API Response:", response.data);

        if (response.data && Array.isArray(response.data.items)) {
            // ✅ อัปเดตรายการสินค้าและเติม URL รูปภาพ
            const updatedCart = response.data.items.map(item => {
                const productData = products.find(prod => prod.id === item.product_id);
                return {
                    ...item,
                    image: productData ? productData.image : `${api_url}/storage/app/public/product/${slug}/${item.product_id}.jpg`, // ดึงจาก API ถ้าไม่มี
                };
            });

            setCart(updatedCart);  // ✅ อัปเดตตะกร้าให้มีรูปภาพ
        } else {
            console.warn("⚠️ ไม่มีข้อมูลสินค้าในออเดอร์");
            setCart([]);  // ✅ ล้างตะกร้าหากไม่มีสินค้า
        }

    } catch (error) {
        console.error("❌ Error fetching order details:", error);
        setCart([]); // ✅ ล้างตะกร้าหากเกิดข้อผิดพลาด
    }
};


// ✅ 7. ฟังก์ชันยกเลิกการเพิ่มสินค้า
const handleCancel = () => {
    Swal.fire({
        icon: 'info',
        title: 'ปิดหน้าเพิ่มอาหาร',
        text: 'ไม่มีการเพิ่มรายการ',
        confirmButtonColor: '#f39c12',
    }).then((result) => {
        if (result.isConfirmed) {
            setShowPopup(false); // ปิดป๊อบอัพหลักหลังจากกด "OK"
        }
    });
};

// ✅ 8. ใช้ useEffect ปิด Popup เมื่อไม่มีสินค้าใน selectedItems
useEffect(() => {
    if (selectedItems.length === 0) {
        setShowAddItemPopup(false);
    }
}, [selectedItems]);
                   
    



    
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { api_url, slug, authToken } = getApiConfig();  // ดึงข้อมูลจาก getApiConfig()
                const response = await axios.get(`${api_url}/${slug}/products`, {
                    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${authToken}` },
                });
    
                if (Array.isArray(response.data)) {
                    setProducts(response.data);  // เก็บข้อมูลที่ได้จาก API
                } else {
                    console.warn('API response format is incorrect');
                    setProducts([]);  // หากข้อมูลไม่ถูกต้อง ให้ตั้งค่าเป็นอาเรย์ว่าง
                }
            } catch (error) {
                console.error('Error fetching products:', error.message);
                setProducts([]);  // หากเกิดข้อผิดพลาด ให้ตั้งค่าเป็นอาเรย์ว่าง
            }
        };
    
        fetchProducts();  // เรียกฟังก์ชัน fetchProducts
    
    }, []);  // ใช้ [] เป็นการ run ฟังก์ชันนี้แค่ครั้งเดียวตอน component mount
    // 

    return (
        <div style={styles.pageContainer}>
           {showAddItemPopup && (
    <div style={{
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 999, backdropFilter: 'blur(10px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
        <div style={{
            backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', 
            boxShadow: '0px 15px 30px rgba(0, 0, 0, 0.1)', zIndex: 1000, 
            width: '100%', maxWidth: '1100px', display: 'flex', gap: '20px', 
            overflow: 'hidden', transition: 'all 0.3s ease-in-out', maxHeight: '80vh'
        }}>
            {/* ✅ ฝั่งซ้าย: รายการอาหารทั้งหมด พร้อมช่องค้นหา */}
            <div style={{
                flex: 1, overflowY: 'auto', maxHeight: '400px', paddingRight: '20px', padding: '0 50px',    overflowX: 'hidden', // ปิดการเลื่อนในแกน X

                display: 'flex', flexDirection: 'column', gap: '10px' // ✅ ช่องค้นหาอยู่ห่างจากรายการ
            }}>
                <h3 style={{
                    fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '10px', textAlign: 'center',
                    position: 'sticky', top: '0', backgroundColor: '#fff', zIndex: 2
                }}>เลือกอาหาร</h3>

                {/* ช่องกรอกในป๊อปอัพที่ต้องการใช้งาน */}
               <input
                    ref={inputRefPopup} // กำหนด ref สำหรับช่องกรอกในป๊อปอัพ
                    type="text"
                    placeholder="ค้นหาชื่ออาหาร..."
                    value={searchQuery}
                    onFocus={() => handlePopupInputFocus(inputRefPopup)} // เรียกใช้ handlePopupInputFocus
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '10px', fontSize: '16px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                />
                
                {/* {showKeyboard && activeField === "popupSearch" && (
                    <div style={{
                        position: 'fixed', bottom: '10%', left: '50%',
                        transform: 'translateX(-50%)', zIndex: 9999
                    }}>
                        <Keyboard
                            onKeyPress={(key) => {
                                setSearchQuery((prev) => {
                                    if (key === "DELETE") {
                                        return prev.slice(0, -1); // ลบตัวอักษร
                                    } else {
                                        return prev + key; // เพิ่มตัวอักษร
                                    }
                                });

                                setTimeout(() => {
                                    inputRefPopup.current?.focus(); // ทำให้ช่องกรอกในป๊อบอัพได้รับโฟกัส
                                }, 100);
                            }}
                            onClose={() => setShowKeyboard(false)} // ปิดคีย์บอร์ด
                        />
                    </div>
                )} */}




                {/* ✅ รายการอาหารที่สามารถเลื่อนแนวตั้งได้ */}
                <div style={{ overflowY: 'auto', maxHeight: '300px', marginTop: '10px' }}>
                    {products
                        .filter(product => product.p_name && product.p_name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((product) => (
                            <div key={product.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                borderBottom: '1px solid #eee', transition: 'all 0.3s ease',
                            }}>
                                <p style={{ fontSize: '16px', color: '#000000', flex: 1 }}>{product.p_name}</p>
                                <p style={{ fontSize: '16px', color: '#000000', marginRight: '20px' }}>{product.price} บาท</p>
                                <button
                                    onClick={() => handleAddToOrder(product, selectedQuantity)}
                                    style={{
                                        backgroundColor: '#0c9fa9', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '5px',
                                        cursor: 'pointer', transition: 'background-color 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2980b9'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0f7b82'}
                                >
                                    เพิ่ม
                                </button>
                            </div>
                        ))
                    }
                </div>
            </div>

            {/* ✅ ฝั่งขวา: รายการที่เลือก และปุ่ม (ไม่มีการเลื่อนแนวนอน) */}
                            <div style={{
                    flex: 1, 
                    backgroundColor: '#f9f9f9', 
                    boxShadow: '0px 15px 30px rgba(0, 0, 0, 0.1)', 
                    height: '100%', 
                    maxHeight: '450px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    overflowY: 'auto', 
                    gap: '10px', 
                    overflowX: 'hidden'
                }}>
                    <h3 style={{
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        color: '#333', 
                        marginBottom: '10px', 
                        textAlign: 'center', 
                        position: 'sticky', 
                        top: '1px', 
                        backgroundColor: '#ffffff',
                    }}>รายการที่เลือก</h3>

                    {selectedItems.length > 0 ? (
                        <div style={{
                            height: '700px', 
                            overflowY: 'auto', 
                            paddingRight: '10px', 
                        }}>
                            {selectedItems.map((item) => (
                                 <div key={item.id} style={{
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    borderBottom: '5px solid #ffffff',
                                    width: '100%', 
                                    backgroundColor: '#ececec4b', 
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'flex-start' 
                                    }}>
                                        <p style={{ 
                                            fontSize: '16px', 
                                            color: '#000000', 
                                            marginBottom: '5px' 
                                        }}>{item.p_name}</p>
                                        <p style={{ 
                                            fontSize: '0.9em', 
                                            color: '#555', 
                                            marginTop: '0',
                                            marginRight: '230px' 

                                        }}>x {item.quantity} ชิ้น</p>
                                    </div>
                                    <p style={{ 
                                        fontSize: '16px', 
                                        color: '#333', 
                                    }}>{item.price} บาท</p>
                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        style={{
                                            backgroundColor: '#e30d0d', 
                                            color: 'white', 
                                            padding: '10px 10px', 
                                            border: 'none', 
                                            borderRadius: '7px',
                                            marginLeft:'10px',
                                            cursor: 'pointer', 
                                            transition: 'background-color 0.3s ease',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c0392b'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d3200c'}
                                    >
                                        ลบ
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontSize: '16px', color: '#777', textAlign: 'center' }}>ยังไม่มีรายการที่เลือก</p>
                    )}

                    <div style={{
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '20px', 
                        marginTop: '20px', 
                        width: '100%'
                    }}>
                        <button
                            onClick={handleConfirm}
                            style={{
                                backgroundColor: '#0c9fa9', 
                                color: 'white', 
                                padding: '12px 24px', 
                                border: 'none', 
                                borderRadius: '5px', 
                                cursor: 'pointer',
                                fontSize: '16px', 
                                transition: 'background-color 0.3s ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#073278'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1388a9'}
                        >
                            ยืนยัน
                        </button>
                        <button
                            onClick={() => {
                                handleCancel();
                                setShowAddItemPopup(false);
                            }}
                            style={{
                                backgroundColor: '#f39c12', 
                                color: 'white', 
                                padding: '12px 24px', 
                                border: 'none', 
                                borderRadius: '5px', 
                                cursor: 'pointer',
                                fontSize: '16px', 
                                transition: 'background-color 0.3s ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b46017'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ea9205'}
                        >
                            ยกเลิก
                        </button>
                    </div>
                </div>

        </div>
    </div>
)}


            {showQRCode && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, width: '100vw', height: '100vh',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.5)', 
                    backdropFilter: 'blur(10px)',
                    zIndex: 9999,
                }}>
                    <div style={{
                        background: '#fff', padding: '20px', borderRadius: '15px',
                        textAlign: 'center', boxShadow: '0px 10px 25px rgba(0,0,0,0.3)',
                        position: 'relative', width: '350px',
                    }}>
                        <button onClick={() => setShowQRCode(false)} style={{
                            position: 'absolute', top: '10px', right: '10px',
                            background: 'none', border: 'none', fontSize: '18px',
                            cursor: 'pointer', color: '#e74c3c'
                        }}>✖</button>

                        <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px', color: '#333' }}>
                            ชำระเงินผ่าน PromptPay 💳
                        </h3>
                        <p style={{ color: '#666', marginBottom: '10px' }}>
                            เบอร์พร้อมเพย์: <strong>{promptPayAcc}</strong>
                        </p>

                        <img src={`https://promptpay.io/${promptPayAcc}/${receivedAmount}`} 
                            alt="PromptPay QR Code" 
                            style={{ width: '200px', height: '200px', borderRadius: '5px', background: '#f9f9f9', padding: '10px' }}
                        />

                        <p style={{ color: '#777', fontSize: '14px', marginTop: '10px' }}>
                            กรุณาสแกน QR Code เพื่อชำระเงิน
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
                            <button 
                                onClick={() => {
                                    setShowQRCode(false);
                                    handlePartialPayment(); // ✅ ดำเนินการชำระเงินเมื่อกดยืนยัน
                                }}
                                style={{
                                    padding: '10px 15px', background: '#2ecc71', color: '#fff',
                                    border: 'none', borderRadius: '5px', cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}>
                                ยืนยันการชำระ
                            </button>

                            <button 
                                onClick={() => setShowQRCode(false)} 
                                style={{
                                    padding: '10px 15px', background: '#e74c3c', color: '#fff',
                                    border: 'none', borderRadius: '5px', cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}>
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}
        <div style={styles.sidebarContainer}>
            <Sidebar onCategorySelect={(categoryId) => setSelectedCategoryId(categoryId)} />
        </div>
            {showKeyboard && (
                <div style={keyboardStyles}>
                    <Keyboard
                        onKeyPress={handleKeyPress}
                        onClose={() => setShowKeyboard(false)}
                    />
                </div>
            )}
            <div style={styles.mainContent}>
                <div style={styles.productListContainer}>
                <div style={styles.headerContainer}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
                <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   {/* ปุ่มเลื่อนซ้าย */}
                <button
                    onClick={() => scrollCategory("left")}
                    style={{
                        position: "absolute",
                        left: "10px",
                        zIndex: 10,
                        background: "#347cae",
                        border: "none",
                        cursor: "pointer",
                        padding: "14px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "3px 6px 12px rgba(0, 0, 0, 0.2)",
                        transition: "0.3s ease-in-out",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.2)";
                        e.currentTarget.style.borderRadius = "30%";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.borderRadius = "50%";
                    }}
                >
                    <FaArrowLeft size={15} color="#fff" />
                </button>

                {/* ปุ่มเลื่อนขวา */}
                <button
                    onClick={() => scrollCategory("right")}
                    style={{
                        position: "absolute",
                        right: "10px",
                        zIndex: 10,
                        background: "#347cae",
                        border: "none",
                        cursor: "pointer",
                        padding: "14px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "3px 6px 12px rgba(0, 0, 0, 0.2)",
                        transition: "0.3s ease-in-out",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.2)";
                        e.currentTarget.style.borderRadius = "30%";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.borderRadius = "50%";
                    }}
                >
                    <FaArrowRight size={15} color="#fff" />
                </button>


                    <div
                        ref={categoryRowRef}
                        style={{
                            display: "flex",
                            overflowX: "auto",
                            whiteSpace: "nowrap",
                            marginRight:'0px',
                            scrollBehavior: "smooth",
                            width: "85%",
                            maxWidth: "920px",
                            scrollbarWidth: "none",
                            position: "relative",
                            maskImage: "linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1) 1%, rgba(255,255,255,1) 99%, rgba(255,255,255,0))",
                            WebkitMaskImage: "linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1) 1%, rgba(255,255,255,1) 99%, rgba(255,255,255,0))"
                        }}
                    >
                        {/* หมวดหมู่ "ทั้งหมด" */}
                        <div
                            key="all"
                            onClick={() => handleCategorySelect(null)}
                            style={{
                                padding: "12px 20px",
                                cursor: "pointer",
                                minWidth: "90px",
                                height: "15px",
                                textAlign: "center",
                                fontSize: "14px",
                                fontWeight: "bold",
                                backgroundColor: selectedCategoryId === null ? "#35aace" : "#ffffff",
                                color: selectedCategoryId === null ? "#fff" : "#333",
                                borderRadius: "10px",
                                transition: "0.3s ease-in-out",
                                boxShadow: selectedCategoryId === null ? "0px 4px 10px rgba(108, 92, 231, 0.3)" : "none",
                                transform: selectedCategoryId === null ? "scale(1.05)" : "scale(1)",
                                position: "relative",
                                border: selectedCategoryId === null ? "1px solid #ecfffe" : "2px solid #ddd",
                                margin:"5px",

                            }}
                        >
                            ทั้งหมด
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: "-5px",
                                    left: "10%",
                                    width: "80%",
                                    height: "4px",
                                    backgroundImage: selectedCategoryId === null
                                        ? "linear-gradient(to right, #ffa20b 0%, #36d6fa 100%)"
                                        : "linear-gradient(to right, #ddd 0%, #ddd 100%)",
                                    borderRadius: "2px",
                                    transition: "0.3s"
                                }}
                            />
                        </div>

                        {/* แสดงหมวดหมู่จาก API */}
                        {categories.map((category, index) => {
                            const colors = ['#4c9eff', '#78d259', '#ff7dbf', '#ff9f0f', '#ffeb4b', '#ff9f0f', '#b97aff'];
                            const borderColor = colors[index % colors.length];

                            return (
                                <div
                                    key={category.id}
                                    onClick={() => handleCategorySelect(category.id)}
                                    style={{
                                        padding: "12px 20px",
                                        cursor: "pointer",
                                        minWidth: "90px",
                                        height: "15px",
                                        textAlign: "center",
                                        fontSize: "14px",
                                        fontWeight: "bold",
                                        backgroundColor: selectedCategoryId === category.id ? "#35aace" : "#fff",
                                        border: selectedCategoryId === category.id 
                                            ? "1px solid #b9fffa"  // ✅ เส้นขอบหนาขึ้นเมื่อเลือก
                                            : "2px solid #ddd",
                                        color: selectedCategoryId === category.id ? "#fff" : "#333",
                                        borderRadius: "10px",
                                        transition: "0.3s ease-in-out",
                                        boxShadow: selectedCategoryId === category.id ? "0px 4px 10px rgba(108, 92, 231, 0.3)" : "none",
                                        transform: selectedCategoryId === category.id ? "scale(1.1)" : "scale(1)", // ✅ ขยายขนาดให้เด่นขึ้น
                                        position: "relative",
                                        margin: "5px",
                                    }}
                                >
                                    {category.c_name || "หมวดหมู่"}
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: "-5px",
                                            left: "10%",
                                            width: "80%",
                                            height: "4px",
                                            backgroundImage: selectedCategoryId === category.id
                                                ? `linear-gradient(to right, ${borderColor} 0%, #ffb400 100%)`
                                                : "linear-gradient(to right, #ddd 0%, #ddd 100%)",
                                            borderRadius: "2px",
                                            transition: "0.3s"
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    
                </div>



                </div>
                        <div style={styles.searchAndTableCodeContainer}>
                            <div style={styles.searchContainer}>
                                <h5 style={styles.tableCode}>โต๊ะ: {tableName}</h5>
                                <input 
                                    type="text" 
                                    placeholder="ค้นหาชื่ออาหาร..." 
                                    style={styles.searchInput} 
                                    value={searchTerm}
                                    onFocus={() => handleInputFocus('search')} // ✅ เปิด Keyboard เมื่อกดที่ช่องค้นหา
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
                                cursor: orderReceived ? 'not-allowed' : (product.status === 'Y' ? 'pointer' : 'not-allowed'),
                                opacity: orderReceived ? 0.5 : 1, // ลดความชัดเจนเมื่อถูกล็อก
                            }}
                            onClick={() => {
                                if (orderReceived) {
                                    Swal.fire({
                                        icon: 'warning',
                                        title: 'ไม่สามารถเลือกสินค้าได้',
                                        text: 'ออเดอร์นี้ได้รับการยืนยันแล้ว กรุณากด "เพิ่มรายการอาหาร" หากต้องการเพิ่ม',
                                        confirmButtonColor: '#f39c12',
                                    });
                                    return; // หยุดทำงาน
                                }
                                addToCart(product); // ถ้าไม่ถูกล็อก ให้เพิ่มสินค้าได้
                            }}
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
                        flexDirection: 'column',  
                        minHeight: '100px',  
                        flexGrow: 1,  
                        overflowY: 'auto',  
                        marginTop: '0px', 
                    }}>
                        {cart.length > 0 ? (
                            cart.map((item) => (
                                <div key={String(item.product_id)} style={styles.cartItem}>  
                                    {/* ✅ ตรวจสอบว่ามีภาพหรือไม่ */}
                                    {item.image ? (
                                        <Image
                                        src={`${api_url.replace("/api", "")}/storage/app/public/product/${slug}/${item.image}`}
                                        alt={item.p_name ?? "ไม่มีชื่อสินค้า"}
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
                                        <p style={styles.cartItemName}>{item.p_name ?? "ไม่มีชื่อสินค้า"}</p>
                                        <div style={styles.cartItemPriceDiscountRow}>
                                            <p style={styles.cartItemPrice}>
                                                ราคา {parseFloat(item.price ?? 0).toFixed(2)} บาท
                                            </p>
                                            <div style={styles.discountContainer}>
                                                <input
                                                
                                                    type="text" // เปลี่ยนเป็น text เพื่อรองรับคีย์บอร์ดเสมือน
                                                    value={item.discount === 0 ? '' : item.discount}
                                                    placeholder="ส่วนลด"
                                                    onFocus={() => handleInputFocus("discount", item.product_id)}
                                                    onChange={(e) => {
                                                        let newDiscount = e.target.value.replace(/[^0-9]/g, ""); // กรองเฉพาะตัวเลข
                                                        setCart((prevCart) =>
                                                            prevCart.map((cartItem) =>
                                                                cartItem.product_id === item.product_id
                                                                    ? {
                                                                        ...cartItem,
                                                                        discount: parseFloat(newDiscount) || 0, // ✅ อัปเดตส่วนลด
                                                                        discountType: cartItem.discountType || "THB", // ✅ ตั้งค่า "บาท" เป็นค่าเริ่มต้น
                                                                    }
                                                                    : cartItem
                                                            )
                                                        );
                                                    }}
                                                    style={{ width: '60px', textAlign: 'right' }}
                                                />

                                                <select
                                                    value={item.discountType ?? "THB"} // ✅ ถ้ายังไม่มีค่า ให้ใช้ "THB"
                                                    onChange={(e) =>
                                                        handleItemDiscountChange(item.product_id, item.discount, e.target.value)
                                                    }
                                                    style={{ width: '50px' }}
                                                >
                                                    <option value="THB">บาท (฿)</option>
                                                    <option value="%">%</option>
                                                </select>
                                            </div>



                                        </div>
                                    </div>

                                    {/* จัดให้อยู่ในบรรทัดเดียวกัน */}
                                    <div style={{ display: "flex", alignItems: "center", fontWeight: "bold", gap: "4px" }}>
                                        <span style={{ whiteSpace: "nowrap" }}>x {item.quantity ?? 1}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>ไม่มีสินค้าในตะกร้า</p>
                        )}
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
                        marginTop: '0',
                        marginBottom: '0',
                        color: '#444',
                        paddingLeft: '5px',
                        lineHeight: '1.2',
                        fontFamily: 'Impact, sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                    }}
                >
                    รวม: {calculateTotalWithBillDiscountAndVAT()} ฿ {/* ✅ เอาทศนิยมออก */}
                </h3>

                    <div style={{ width: '220px', marginRight: '-70px' }}>
                        <select
                            value={paymentMethod}
                            onChange={(e) => handlePaymentChange(e.target.value)}
                            style={{
                                padding: '7px 10px',
                                width: '100%',
                                border: '2px solid #6c5ce7',
                                borderRadius: '5px',
                                background: 'linear-gradient(145deg, #ffffff, #f2f2f2)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                fontSize: '13px',
                                color: '#010101',
                                cursor: 'pointer',
                                maxWidth: '160px',
                                transition: 'all 0.3s ease',
                                marginBottom: '7px',
                                marginLeft: '-10px',
                                textAlign: 'left',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#6c5ce7')}
                            onBlur={(e) => (e.target.style.borderColor = '#ccc')}
                        >
                            <option value="" style={{ color: '#000000' }}>เลือกวิธีการชำระเงิน</option>
                            {paymentMethods.length > 0 ? (
                                paymentMethods.map((method) => (
                                    <option key={method.id} value={method.id} style={{ color: '#0b0a0c' }}>
                                        {method.pay_name}
                                    </option>
                                ))
                            ) : (
                                <option disabled style={{ color: 'red' }}>ไม่มีข้อมูล</option>
                            )}
                        </select> 
                    </div>
                </div>

    {orderReceived && (
        <>
            <div style={styles.discountAndReceivedAmountRow}>
                {/* ปุ่มเลือก VAT */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}
                >
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
                            flex: 1,
                        }}
                    >
                        <option value="noTax">ไม่มีภาษี</option>
                        <option value="includeVat7">รวมภาษีมูลค่าเพิ่ม 7%</option>
                        <option value="excludeVat7">ไม่รวมภาษีมูลค่าเพิ่ม 7%</option>
                        <option value="includeVat3">รวมภาษีมูลค่าเพิ่ม 3%</option>
                        <option value="excludeVat3">ไม่รวมภาษีมูลค่าเพิ่ม 3%</option>
                    </select>

                    <input
                        type="number"
                        placeholder="ส่วนลดรวม"
                        value={billDiscount === 0 ? '' : billDiscount} // แก้ให้ช่องว่างเมื่อไม่มีส่วนลด
                        onFocus={() => {
                            setActiveField({ field: 'billDiscount' }); // ✅ กำหนดให้ Keyboard ใช้กับช่องส่วนลดรวม
                            setShowKeyboard(true); // ✅ เปิด Keyboard เสมือน
                        }}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*\.?\d*$/.test(value)) { // ✅ ตรวจสอบให้เป็นตัวเลขเท่านั้น
                                setBillDiscount(parseFloat(value) || 0);
                            }
                        }}
                        style={{
                            backgroundColor: 'white',
                            border: '1px solid #cccccc',
                            borderRadius: '4px',
                            padding: '8px 1px',
                            fontSize: '13px',
                            width: '75px',
                            color: '#333',
                            outline: 'none',
                            flex: 1,
                            textAlign: 'right', // ✅ จัดข้อความให้อยู่ด้านขวา
                        }}
                    />



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
                            flex: 1,
                        }}
                    >
                        <option value="THB">บาท (฿)</option>
                        <option value="%">%</option>
                    </select>
                </div>
            </div>

            <div style={styles.amountButtons}>
                {[1, 20, 50, 100, 500, 1000].map((amount) => (
                    <button key={amount} onClick={() => handleAmountButton(amount)} style={styles.amountButton}>
                        +{amount}.00
                    </button>
                ))}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '3px',
                    }}
                >
                   <input
                        type="number"
                        placeholder="รับเงิน"
                        value={receivedAmount === 0 ? '' : receivedAmount} // ✅ ช่องว่างถ้าไม่มีค่า
                        onFocus={() => {
                            setActiveField({ field: 'receivedAmount' }); // ✅ กำหนดให้ Keyboard ใช้กับช่องรับเงิน
                            setShowKeyboard(true); // ✅ เปิด Keyboard เสมือน
                        }}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*\.?\d*$/.test(value)) { // ✅ ตรวจสอบให้เป็นตัวเลขเท่านั้น
                                setReceivedAmount(parseFloat(value) || 0);
                            }
                        }}
                        style={{
                            ...styles.amountInputHalf,
                            flex: 2,
                            textAlign: 'right', // ✅ ตัวเลขจัดชิดขวา
                        }}
                    />
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
                            padding: '8px 20px',
                            transition: 'all 0.3s ease',
                            flex: 1,
                        }}
                    >
                        C
                    </button>
                </div>
            </div>

            <div style={styles.changeDi}>
                <p>ยอดคงเหลือ: {calculateRemainingDue().toFixed(2)} บาท</p>
            </div>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                }}
            >
                <div
                    style={{
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: '#0d1b13',
                        marginRight: '10px',
                    }}
                >
                    เงินทอน: {calculateChange()} บาท
                </div>

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
                            border: 'none',
                            boxShadow: 'none',
                        }}
                        onClick={toggleSplitPaymentPopup}
                    >
                        ดูประวัติการชำระ
                    </button>

                </div>
            </div>
        </>
    )}


        {/* ปุ่มการทำงาน */}
        <div style={styles.paymentRow}>
            {orderReceived ? (
                <button
                        style={styles.receiveOrderButton}
                        onClick={handleAddOrderItemsPopup} // เมื่อกดปุ่มให้แสดงป๊อบอัพ
                    >
                        เพิ่มรายการอาหาร
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
           <button
                style={{
                    ...styles.paymentButton,
                    backgroundColor:
                        orderReceived && calculateRemainingDue() === 0
                            ? '#3498db' // ✅ สีปุ่ม "แสดงบิล"
                            : paymentMethod === "2"
                            ? '#2ecc71' // ✅ สีปุ่ม "ชำระ QR Code"
                            : paymentMethod === "credit_card"
                            ? '#e67e22' // ✅ สีปุ่ม "ชำระด้วยบัตรเครดิต"
                            : '#d2c809',
                    ...(orderReceived && paymentMethod && (receivedAmount > 0 || calculateRemainingDue() === 0)
                        ? {}
                        : styles.paymentButtonDisabled),
                }}
                onClick={() => {
                    if (orderReceived && calculateRemainingDue() === 0) {
                        setShowReceipt(true); // ✅ แสดงใบเสร็จ
                    } else if (orderReceived && paymentMethod === "2") {
                        setShowQRCode(true); // ✅ แสดง QR Code
                    } else if (orderReceived && paymentMethod === "credit_card") {
                        Swal.fire({
                            title: 'ยืนยันการชำระเงิน?',
                            text: "คุณต้องการดำเนินการชำระด้วยบัตรเครดิตหรือไม่?",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#e67e22',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'ใช่, ดำเนินการ',
                            cancelButtonText: 'ยกเลิก'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                processCreditCardPayment(); // ✅ ดำเนินการชำระผ่านบัตรเครดิต
                            }
                        });
                    } else if (orderReceived) {
                        handlePartialPayment(); // ✅ ดำเนินการแยกชำระ
                    }
                }}
                disabled={
                    !orderReceived || 
                    !paymentMethod || 
                    ((receivedAmount <= 0 && calculateRemainingDue() !== 0) && calculateRemainingDue() > 0)
                }
            >
                {orderReceived && calculateRemainingDue() === 0
                    ? 'แสดงบิล'
                    : orderReceived && paymentMethod === "2"
                    ? 'ชำระ QR Code'
                    : orderReceived && paymentMethod === "credit_card"
                    ? 'ชำระด้วยบัตรเครดิต'
                    : 'ชำระเงิน'}
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
                        borderRadius: '12px',
                        boxShadow: '0px 15px 30px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        width: '450px',
                        maxHeight: '950px',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'relative',
                        marginBottom: '15px',
                    }}>
                        <h3 style={{
                            margin: 0,
                            color: '#34495e',
                            fontSize: '22px',
                            fontWeight: '600',
                            letterSpacing: '1px',
                            textAlign: 'center',
                            width: '100%',
                        }}>
                            ประวัติการชำระ
                        </h3>
                        <button
                            onClick={toggleSplitPaymentPopup}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '0px',
                                padding: '6px 12px',
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                borderRadius: '10%',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
                                transition: 'background-color 0.3s ease',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c0392b'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e74c3c'}
                        >
                            ×
                        </button>
                    </div>

                    <div style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        paddingRight: '10px',
                        marginBottom: '10px',
                    }}>
                       {payments && payments.length > 0 ? (
    payments.map((payment, index) => {
        // ✅ ตรวจสอบว่ามี `created_at` หรือไม่ และแปลงเป็นวันที่ที่อ่านง่าย
        const paymentDate = payment.created_at ? new Date(payment.created_at) : null;
        const formattedDate = paymentDate
            ? paymentDate.toLocaleString('th-TH', {
                timeZone: 'Asia/Bangkok',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            })
            : "ไม่พบวันที่"; // ถ้าไม่มีข้อมูล created_at

        return (
            <div
                key={index}
                style={{
                    marginBottom: '20px',
                    padding: '20px',
                    backgroundColor: '#ecf0f1',
                    borderRadius: '12px',
                    boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease-in-out',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                {/* ✅ แสดงวันที่จาก `created_at` ที่ถูกแปลงแล้ว */}
                <div style={{
                    fontSize: '16px',
                    color: '#2c3e50',
                    fontWeight: '500',
                    marginBottom: '10px',
                }}>
                    {formattedDate}
                </div>
                <div style={{
                    fontSize: '18px',
                    color: '#16a085',
                    fontWeight: '600',
                    marginBottom: '5px',
                }}>
                    จำนวนเงิน: {payment.amount ? payment.amount.toFixed(2) : "0.00"} บาท
                </div>
                <div style={{
                    fontSize: '16px',
                    color: '#2980b9',
                    fontWeight: '500',
                }}>
                    ช่องทาง: {payment.pay_name ? payment.pay_name : "ไม่พบข้อมูลช่องทาง"}
                </div>
            </div>
        );
    })
) : (
    <p style={{
        color: '#7f8c8d',
        textAlign: 'center',
        fontSize: '16px',
        fontWeight: '400',
    }}>
        ไม่มีประวัติการชำระ
    </p>
)}

                    </div>
                </div>
            )}

    {showReceipt && (
        <div style={styles.receiptOverlay}>
            <div style={styles.receiptContainer}>
                <div style={styles.header}>
                    <Image src="/images/POS SHOP.png" alt="POS SHOP" width={50} height={50} />
                    <h2 style={styles.shopName}>Easy POS</h2>
                    <p style={styles.receiptTitle}>บิลการชำระเงิน</p>
                </div>

                <div style={styles.info}>
                    <p style={styles.billId}>No: {orderNumber ?? "N/A"}</p>
                    <p style={styles.date}>{new Date().toLocaleString()}</p>
                </div>

                <div style={styles.tableHeader}>
                    <p style={styles.tableColumn}>รายการ</p>
                    <p style={styles.tableColumn}>จำนวน</p>
                    <p style={styles.tableColumn}>ราคา</p>
                </div>

                <div className="receiptItems" style={styles.receiptItems}>
                    {cart.map((item) => (
                        <div key={String(item.product_id)} style={styles.receiptItem}>
                            <p style={styles.itemName}>{item.p_name ?? "ไม่มีชื่อสินค้า"}</p>
                            <p style={styles.itemQuantity}>{item.quantity ?? 1}</p>
                            <p style={styles.itemPrice}>
                                <span style={{ textDecoration: item.discount > 0 ? 'line-through' : 'none' }}>
                                    {parseFloat(item.price || 0).toFixed(2)}
                                </span>
                                {item.discount > 0 && (
                                    <>
                                        <br />
                                        <span>{`ลด ${item.discountType === 'THB' ? parseFloat(item.discount || 0).toFixed(2) + ' บาท' : item.discount + '%'}`}</span>
                                        <br />
                                        <span>{`${calculateDiscountedPrice(parseFloat(item.price || 0), parseFloat(item.discount || 0), item.discountType).toFixed(2)} บาท`}</span>
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
                            {billDiscountType === 'THB' ? `${parseFloat(billDiscount || 0).toFixed(2)} บาท` : `${billDiscount}%`}
                        </strong>
                    </p>
                </div>

                <div style={styles.receiptSummary}>
                <p>โต๊ะ: {tableCode.startsWith("T") ? tableCode : `T${String(tableCode ?? "000").padStart(3, '0')}`}</p>
                <p>
                        ยอดบิล: 
                        <span style={styles.summaryValue}>
                            {parseFloat(calculateTotalWithBillDiscountAndVAT() || 0).toFixed(2)} บาท
                        </span>
                    </p>
                    <p>
                        ยอดภาษีมูลค่าเพิ่ม ({vatType?.includes('7') ? '7%' : vatType?.includes('3') ? '3%' : '0%'} 
                        {vatType?.includes('include') ? ' รวม' : vatType?.includes('exclude') ? ' ไม่รวม' : ''}): 
                        <span style={styles.summaryValue}>
                            {parseFloat(calculateVAT() || 0).toFixed(2)} บาท
                        </span>
                    </p>
                    <p>
                        รับเงิน: 
                        <span style={styles.summaryValue}>
                            {parseFloat(receivedAmount + calculateTotalPaid() || 0).toFixed(2)} บาท
                        </span>
                    </p>
                    <p>
                        เงินทอน: 
                        <span style={styles.summaryValue}>
                            {parseFloat(calculateTotalPaidWithChange()?.change || 0).toFixed(2)} บาท
                        </span>
                    </p>
                </div>

                <div style={styles.receiptItem}>
                    <p style={styles.itemName}><strong>วิธีการชำระเงิน</strong></p>
                    <p style={styles.itemQuantity}></p>
                    <p style={styles.itemPrice}>
                        <strong>
                            {payments?.length > 0 
                                ? payments.length > 1 
                                    ? 'ชำระหลายวิธี'  
                                    : payments.map(payment => payment.pay_name).join(', ') || 'ไม่พบข้อมูลช่องทาง'
                                : 'ยังไม่ได้เลือก' 
                            }
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
                                onClick={closeReceipt} 
                            >
                                บันทึกบิล
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
    labelText: { fontSize: '14px', fontWeight: 'bold', color: '#333' },
    circleItem: { width: '140px', height: '140px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer' },
    popupTitle: { fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', color: '#333', margin: '0px' },
    icon: { margin: '20px 0', cursor: 'pointer', borderRadius: '12px', padding: '5px', width: '10px', height: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s ease' },
    categoryRow: { display: 'flex', justifyContent: 'center', gap: '10px', margin: '0 auto', flexWrap: 'wrap', alignItems: 'center', width: '100%',},
    searchAndTableCodeContainer: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', },
    pageContainer: { display: 'flex', padding: '10px', height: '92vh',overflow: 'hidden', },
    sidebarContainer: { flex: '0 0 100px', zIndex: 800  },
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
    productListContainer: { flex: 1, maxHeight: '92vh', overflowY: 'auto',overflowX: 'hidden', marginLeft: '20px', paddingTop: '0px' },
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
    noImage: { width: '100px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: '5px', marginBottom: '8px' },
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
    @@keyframes colorTransitionBlue {
    0% { border-color: #4c9eff; }
    50% { border-color: #80b9ff; }
    100% { border-color: #4c9eff; }
    }

    @keyframes colorTransitionPurple {
        0% { border-color: #b97aff; }
        50% { border-color: #d09eff; }
        100% { border-color: #b97aff; }
    }

    @keyframes colorTransitionPink {
        0% { border-color: #ff7dbf; }
        50% { border-color: #ff99d9; }
        100% { border-color: #ff7dbf; }
    }

    @keyframes colorTransitionGreen {
        0% { border-color: #78d259; }
        50% { border-color: #98e78b; }
        100% { border-color: #78d259; }
    }

    @keyframes colorTransitionYellow {
        0% { border-color: #ffeb4b; }
        50% { border-color: #ffea76; }
        100% { border-color: #ffeb4b; }
    }

    @keyframes colorTransitionOrange {
        0% { border-color: #ff9f0f; }
        50% { border-color: #ffb84f; }
        100% { border-color: #ff9f0f; }
    }

    /* กำหนดเอฟเฟกต์การคลิกและการโฟกัส */
    .categoryCircle:active {
        transform: scale(0.95);
        box-shadow: 0px 5px 15px rgba(0, 123, 255, 0.8); /* เอฟเฟกต์เมื่อกด */
    }

    .categoryCircle:focus {
        outline: none; /* ลบเส้นขอบของเบราว์เซอร์ */
        box-shadow: 0px 0px 12px rgba(0, 123, 255, 0.8); /* แสงเมื่อโฟกัส */
    }
        .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.4); /* พื้นหลังเบลอ */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
    animation: fadeIn 0.3s ease-out;
}

.modal-container {
    background-color: white;
    width: 90%;
    max-width: 500px;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 80%;
    animation: slideIn 0.3s ease-out;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    font-size: 1.5rem;
    color: #333;
    font-weight: bold;
}

.close-button {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #e74c3c;
}

.product-list {
    flex-grow: 1;
    overflow-y: auto;
    margin-top: 20px;
}

.product-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
}

.select-button {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 5px;
    transition: background-color 0.3s ease;
}

.select-button:hover {
    background-color: #2980b9;
}

.selected {
    background-color: #e74c3c;
}

.popup-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
}

.confirm-button, .close-popup-button {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
}

.confirm-button {
    background-color: #2ecc71;
    color: white;
}

.close-popup-button {
    background-color: #e74c3c;
    color: white;
}

.confirm-button:hover {
    background-color: #27ae60;
}

.close-popup-button:hover {
    background-color: #c0392b;
}

/* Animations */
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes slideIn {
    from {
        transform: translateY(-30px);
    }
    to {
        transform: translateY(0);
    }
}
.popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5); /* มืดเบื้องหลัง */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.popup-container {
    background-color: white;
    padding: 20px;
    border-radius: 10px;
    width: 400px;
    box-shadow: 0px 10px 15px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    justify-content: space-between; /* ทำให้ปุ่มอยู่ด้านล่าง */
    height: 100%; /* ให้ครอบคลุมพื้นที่ทั้งหมด */
}

.product-list {
    flex-grow: 1; /* ทำให้ส่วนนี้เติบโตเต็มที่ */
    overflow-y: auto; /* ถ้ารายการเยอะเกินก็สามารถเลื่อนลงได้ */
}

.popup-actions {
    margin-top: 20px; /* ช่องว่างระหว่างรายการอาหารกับปุ่ม */
    display: flex;
    justify-content: space-between;
}


h3 {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 20px;
}

.product-list {
    width: 100%;
    margin-bottom: 20px;
    overflow-y: auto;
    max-height: 250px;
}

.product-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #ddd;
}

.select-button {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;
}

.select-button.selected {
    background-color: #e74c3c;
}

.popup-actions {
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin-top: 20px;
}

.confirm-button, .close-popup-button {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
}

.confirm-button {
    background-color: #2ecc71;
    color: white;
}

.confirm-button:hover {
    background-color: #27ae60;
}

.close-popup-button {
    background-color: #e74c3c;
    color: white;
}

.close-popup-button:hover {
    background-color: #c0392b;
}



    .pulse-effect {animation: pulse 0.5s ease-out;background-color: #d9f7be !important;}
    `;
        document.head.appendChild(styleSheet);
    }
