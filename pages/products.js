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
    
    const VAT_RATE = 0.07;
    
    
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

    // Add this function inside SalesPage component
    const toggleCategoryPopup = () => {
        setIsCategoryPopupOpen(prevState => !prevState);
    };
    const handleCategorySelect = (categoryId) => {
        setSelectedCategoryId(categoryId);
    };

    const addToCart = (product) => {
        if (product.status !== 'Y') return;
        setCart((prevCart) => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                return [...prevCart, { ...product, quantity: 1, discount: 0, discountType: "THB" }];
            }
        });
    };

    const updateQuantity = (productId, delta) => {
        setCart((prevCart) =>
            prevCart
                .map((item) =>
                    item.id === productId ? { ...item, quantity: item.quantity + delta } : item
                )
                .filter(item => item.quantity > 0)
        );
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
        const totalAfterItemDiscounts = calculateTotalAfterItemDiscounts();
        return calculateDiscountedPrice(totalAfterItemDiscounts, billDiscount, billDiscountType);
    };

    const calculateVAT = () => {
        return calculateTotalWithBillDiscount() * VAT_RATE;
    };

    const handlePayment = () => {
        const totalWithBillDiscount = calculateTotalWithBillDiscount();
        if (receivedAmount < totalWithBillDiscount) {
            alert('ยอดเงินที่รับมายังไม่เพียงพอ');
            return;
        }
        setShowReceipt(true);
    };

    const filteredProducts = products.filter(product =>
        (!selectedCategoryId || product.category_id === selectedCategoryId) &&
        (product.p_name ? product.p_name.toLowerCase().includes(searchTerm.toLowerCase()) : false)
    );


    
    // ฟังก์ชันสำหรับสร้างคำสั่งซื้อใหม่และรับ order_id กลับมา
    const sendOrder = async (orderData) => {
        try {
            const response = await axios.post(`${api_url}/api/${slug}/orders`, orderData, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
    
            // Debug response
            console.log('API Response from sendOrder:', response.data);
    
            // ตรวจสอบว่าโครงสร้าง JSON มี "order.id"
            if (response.data && response.data.order && response.data.order.id) {
                return response.data.order.id; // ดึง order_id จาก response
            } else {
                throw new Error(`Invalid response format: ${JSON.stringify(response.data)}`);
            }
        } catch (error) {
            console.error('Error while creating order:', error.response?.data || error.message);
            throw new Error(`Failed to create order: ${error.response?.data?.message || error.message}`);
        }
    };
    
    
    
    const sendOrderItems = async (itemsData) => {
        if (!orderId) {
            throw new Error('Failed to get a valid order_id');
          }
        try {
            const url = `${api_url}/api/${slug}/order_items`;
            console.log('POST URL for order items:', url);
    
            const response = await axios.post(url, itemsData, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            console.log('Order items created successfully:', response.data);

            console.log('Order items successfully saved:', response.data);
        } catch (error) {
            console.error('Error while creating order items:', error.response?.data || error.message);
    
            // เพิ่มข้อความแจ้งเตือนที่ชัดเจนขึ้น
            if (error.response?.status === 404) {
                throw new Error('API endpoint for creating order items not found (404). Please check the URL.');
            } else {
                throw new Error(`Failed to create order items: ${error.response?.data?.message || error.message}`);
            }
        }
    };
    
    
    
    
    // ฟังก์ชันหลักสำหรับรับคำสั่งซื้อ (สร้าง order และบันทึกรายการ order_items)
    const receiveOrder = async () => {
        try {
            // สร้างหมายเลขคำสั่งซื้อแบบสุ่ม
            const generatedOrderNumber = `RE${Math.floor(100000 + Math.random() * 900000)}`;
            setOrderNumber(generatedOrderNumber);
    
            const userId = 1; // รหัสผู้ใช้ (ปรับให้เหมาะสมกับระบบของคุณ)
            
            // ข้อมูลคำสั่งซื้อ (Order)
            const orderData = {
                // order_number: generatedOrderNumber, // หมายเลขคำสั่งซื้อ
                // order_date: new Date().toISOString().split('T')[0], // วันที่ของคำสั่งซื้อ
                total_amount: calculateTotalAfterItemDiscounts(), // ราคารวมก่อนส่วนลด
                discount: billDiscountType === "THB" ? billDiscount : 0, // ส่วนลดแบบบาท
                discount_per: billDiscountType === "%" ? billDiscount : 0, // ส่วนลดแบบเปอร์เซ็นต์
                vat_per: VAT_RATE * 100, // อัตราภาษีมูลค่าเพิ่ม (VAT)
                vat_amt: calculateVAT(), // จำนวนภาษีที่ต้องชำระ
                net_amount: calculateTotalWithBillDiscount(), // ราคารวมสุทธิ
                status: 'N', // สถานะคำสั่งซื้อ ('N' = ยังไม่ชำระเงิน)
                tables_id: tableCode || null, // รหัสโต๊ะ (ถ้ามี)
                created_by: userId,
                items: cart.map((item) => ({
                    product_id: item.id || 0, // รหัสสินค้า
                    p_name: item.p_name || 'ไม่มีชื่อสินค้า', // ชื่อสินค้า
                    quantity: item.quantity || 1, // จำนวนที่สั่งซื้อ
                    price: item.price || 0, // ราคาต่อหน่วย
                    total: calculateDiscountedPrice(item.price, item.discount, item.discountType) * item.quantity || 0, // รวมราคา
                    discount: item.discountType === "THB" ? item.discount || 0 : 0, // ส่วนลดแบบบาท
                    discount_per: item.discountType === "%" ? item.discount || 0 : 0, // ส่วนลดแบบเปอร์เซ็นต์
                    net_total: calculateDiscountedPrice(item.price, item.discount, item.discountType) * item.quantity || 0, // ราคาสุทธิหลังส่วนลด
                    status: 'Y', // สถานะ ('Y' = ใช้งานได้)
                    created_at: new Date().toISOString(), // เวลาที่สร้าง
                // created_at: new Date().toISOString(), // เวลาที่สร้าง
                // updated_at: new Date().toISOString(), // เวลาที่อัปเดตล่าสุด
            }))
            };
    
            console.log('Order Data:', orderData); // Debugging: แสดงข้อมูล Order
            await sendOrder(orderData);
            // Step 1: สร้าง Order และรับ order_id กลับมา
            // const orderId = await sendOrder(orderData);
    
            // if (!orderId) {
            //     throw new Error('Failed to get order_id from the order creation response.');
            // }
    
            // Step 2: เตรียมข้อมูลรายการสินค้า (Order Items)
            // const itemsData = cart.map((item) => ({
            //     order_id: orderId, // ใช้ order_id จาก Order ที่สร้างขึ้น
            //     product_id: item.id || 0, // รหัสสินค้า
            //     p_name: item.p_name || 'ไม่มีชื่อสินค้า', // ชื่อสินค้า
            //     quantity: item.quantity || 1, // จำนวนที่สั่งซื้อ
            //     price: item.price || 0, // ราคาต่อหน่วย
            //     total: calculateDiscountedPrice(item.price, item.discount, item.discountType) * item.quantity || 0, // รวมราคา
            //     discount: item.discountType === "THB" ? item.discount || 0 : 0, // ส่วนลดแบบบาท
            //     discount_per: item.discountType === "%" ? item.discount || 0 : 0, // ส่วนลดแบบเปอร์เซ็นต์
            //     net_total: calculateDiscountedPrice(item.price, item.discount, item.discountType) * item.quantity || 0, // ราคาสุทธิหลังส่วนลด
            //     status: 'Y', // สถานะ ('Y' = ใช้งานได้)
            //     created_by: userId, // ผู้สร้าง
            //     created_at: new Date().toISOString(), // เวลาที่สร้าง
            //     updated_at: new Date().toISOString(), // เวลาที่อัปเดตล่าสุด
            // }));
    
            // console.log('Order Items Data to be sent:', itemsData); // Debugging: แสดงข้อมูล Order Items
    
            // Step 3: บันทึกข้อมูล Order Items
            //await sendOrderItems(itemsData);
    
            // แสดงข้อความสำเร็จ
            Swal.fire({
                icon: 'success',
                title: 'รับออเดอร์สำเร็จ',
                text: 'คำสั่งซื้อและรายการสินค้าถูกบันทึกเรียบร้อยแล้ว!',
                confirmButtonText: 'ตกลง',
            }).then(() => {
                setShowReceipt(true); // แสดงใบเสร็จ
            });
        } catch (error) {
            // แสดงข้อความ error หากเกิดข้อผิดพลาด
            console.error('Error while processing order:', error.message);
            Swal.fire('ผิดพลาด', error.message, 'error');
            console.log(orderData);
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
        try {
            const url = `${api_url}/api/${slug}/orders/${orderNumber}`;
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            
            if (response.data && response.data.status === 'N') {
                await axios.put(url, {
                    status: 'Y',
                }, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                });

                Swal.fire({
                    icon: 'success',
                    title: 'ชำระเงินสำเร็จ',
                    text: 'การชำระเงินดำเนินการเรียบร้อยแล้ว!',
                    confirmButtonText: 'ตกลง',
                }).then(() => {
                    setShowReceipt(false);
                    setOrderReceived(true);
                    setCart([]);
                    setReceivedAmount(0);
                    setBillDiscount(0);
                    setBillDiscountType("THB");
                    setIsBillPaused(false);
                });
            } else {
                Swal.fire('ผิดพลาด', 'ไม่พบข้อมูลบิล หรือบิลนี้ถูกชำระแล้ว', 'error');
            }
        } catch (error) {
            Swal.fire('ผิดพลาด', `ไม่สามารถอัปเดตบิลได้: ${error.response?.data?.message || error.message}`, 'error');
        }
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

    return (
        <div style={styles.pageContainer}>
            <div style={styles.sidebarContainer}>
                <Sidebar onCategorySelect={(categoryId) => setSelectedCategoryId(categoryId)} />
            </div>
            <div style={styles.mainContent}>
                <div style={styles.productListContainer}>
                <div style={styles.headerContainer}>
    <div style={styles.categoryContainer}>
        <div style={styles.categoryRow}>
            <div onClick={() => handleCategorySelect(null)} style={{ ...styles.categoryCircle, backgroundColor: '#27ae60' }}>
                <span style={styles.iconText}>🍽️</span>
                <span style={styles.labelText}>ทั้งหมด</span>
            </div>
            <div onClick={() => handleCategorySelect(1)} style={{ ...styles.categoryCircle, backgroundColor: '#e74c3c' }}>
                <span style={styles.iconText}>🍛</span>
                <span style={styles.labelText}>เมนูผัด</span>
            </div>
            <div onClick={() => handleCategorySelect(2)} style={{ ...styles.categoryCircle, backgroundColor: '#f1c40f' }}>
                <span style={styles.iconText}>🍚</span>
                <span style={styles.labelText}>ข้าวผัด</span>
            </div>
            <div onClick={() => handleCategorySelect(3)} style={{ ...styles.categoryCircle, backgroundColor: '#2980b9' }}>
                <span style={styles.iconText}>🥗</span>
                <span style={styles.labelText}>เมนูยำ</span>
            </div>
            <div onClick={() => handleCategorySelect(4)} style={{ ...styles.categoryCircle, backgroundColor: '#1abc9c' }}>
                <span style={styles.iconText}>🍲</span>
                <span style={styles.labelText}>ข้าวต้ม</span>
            </div>
            <div onClick={() => handleCategorySelect(5)} style={{ ...styles.categoryCircle, backgroundColor: '#8e44ad' }}>
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
                                style={{
                                    ...styles.productCard,
                                    position: 'relative',
                                    cursor: product.status === 'Y' ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() => addToCart(product)}
                            >
                                {product.status === 'N' && (
                                    <div style={{
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
                                    }}>
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
                                    <p style={styles.productPrice}> {product.price.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div style={styles.cart}>
                <div style={styles.cartHeader}>
                    <div style={{ display: 'flex', alignItems: 'center' ,fontSize:'11px',color:'#d33' }}>
                        <Image src="/images/shopping.png" alt="รายการสั่งซื้อ" width={24} height={24} />
                        <h2 style={{ marginLeft: '10px' }}>({cart.reduce((acc, item) => acc + item.quantity, 0)})</h2>
                    </div>
                    <button onClick={clearCart} style={styles.clearCartButton}>
                        <FaTrash />
                    </button>
                </div>
                <div style={styles.cartItems}>
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
                                            onChange={(e) => handleItemDiscountChange(item.id, parseFloat(e.target.value) || 0, item.discountType)}
                                            style={{ flex: '1', width: '60px' }}
                                        />
                                        <select
                                            value={item.discountType}
                                            onChange={(e) => handleItemDiscountChange(item.id, item.discount, e.target.value)}
                                            style={{ flex: '1', width: '50px' }}
                                        >
                                            <option value="THB">บาท (฿)</option>
                                            <option value="%">%</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div style={styles.quantityControls}>
                                <button onClick={() => updateQuantity(item.id, -1)} style={styles.quantityButton}>-</button>
                                <span style={styles.quantityDisplay}>{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} style={styles.quantityButton}>+</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={styles.totalContainer}>
                    <h3 style={styles.totalText}>รวม: {calculateTotalWithBillDiscount().toFixed(2)} บาท</h3>
                    <div style={styles.discountAndReceivedAmountRow}>
                        <input
                            type="number"
                            placeholder="รับเงิน"
                            value={receivedAmount === 0 ? '' : receivedAmount}
                            onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                            style={styles.amountInputHalf}
                        />
                        <input 
                            type="number" 
                            placeholder="ส่วนลดรวม" 
                            value={billDiscount === 0 ? '' : billDiscount} 
                            onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)} 
                            style={styles.discountInputSmall}
                        />
                        <select 
                            value={billDiscountType} 
                            onChange={(e) => setBillDiscountType(e.target.value)} 
                            style={styles.discountSelectSmall}
                        >
                            <option value="THB">บาท (฿)</option>
                            <option value="%">%</option>
                        </select>
                    </div>
                    <div style={styles.amountButtons}>
                        {[1, 5, 10, 20, 50, 100].map((amount) => (
                            <button key={amount} onClick={() => handleAmountButton(amount)} style={styles.amountButton}>
                                +{amount}.00
                            </button>
                        ))}
                        <button onClick={resetAmount} style={{ ...styles.amountButton, background: 'linear-gradient(to right, #ff7f7f, #ff0000)', color: '#ffffff' }}>C</button>
                        <button onClick={handleFullAmount} style={{ ...styles.amountButton, background: 'linear-gradient(to right, #50de75, #038a26)', gridColumn: 'span 2', color: '#ffffff' }}>รับเงินเต็มจำนวน</button>
                    </div>
                    <div style={styles.changeDisplay}>
                        เงินทอน: {(receivedAmount ? (receivedAmount - calculateTotalWithBillDiscount()).toFixed(2) : "0.00")} บาท
                    </div>
                    <div style={styles.paymentRow}>
                        <button style={styles.receiveOrderButton} onClick={receiveOrder}>
                            รับออเดอร์
                        </button>                    
                        <button style={styles.paymentButton} onClick={handlePayment}>
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
                        <div style={styles.receiptItems}>
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
                            <p style={styles.itemPrice}><strong>{billDiscountType === 'THB' ? billDiscount.toFixed(2) + ' บาท' : billDiscount + '%'}</strong></p>
                        </div>
                        <div style={styles.receiptSummary}>
                            <p>โต๊ะ: {tableCode}</p>
                            <p>ยอดบิล: <span style={styles.summaryValue}>{calculateTotalWithBillDiscount().toFixed(2)} บาท</span></p>
                            <p>ยอดภาษีมูลค่าเพิ่ม (VAT) 7%: <span style={styles.summaryValue}>{calculateVAT().toFixed(2)} บาท</span></p>
                            <p>รับเงิน: <span style={styles.summaryValue}>{receivedAmount.toFixed(2)} บาท</span></p>
                            <p>เงินทอน: <span style={styles.summaryValue}>{(receivedAmount - calculateTotalWithBillDiscount()).toFixed(2)} บาท</span></p>
                        </div>
                        <div style={styles.buttonContainer}>
                            <button style={styles.actionButton} onClick={closeReceipt}>ดำเนินการ</button>
                            <button style={styles.pauseButton} onClick={handlePauseBill}>พักบิล</button>
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
    categoryRow: { display: 'flex', justifyContent: 'flex-start', gap: '10px', marginBottom: '5px', flexWrap: 'wrap' },
    searchAndTableCodeContainer: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%' },
    pageContainer: { display: 'flex', padding: '10px', height: '92vh' },
    sidebarContainer: { flex: '0 0 100px' },
    cart: { width: '400px', overflowY: 'auto', backgroundColor: '#ffffff', padding: '15px', borderRadius: '8px', marginTop: '-8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    discountAndTotal: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' },
    totalText: { fontSize: '16px', fontWeight: 'bold', color: '#333' },
    discountInputSmall: { width: '40%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd' },
    discountSelectSmall: { width: '20%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd' },
    discountAndReceivedAmountRow: { display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' },
    discountContainerHalf: { display: 'flex', alignItems: 'center', gap: '2px', flex: 1, marginTop: '-12px' },
    amountInputHalf: { flex: 1, padding: '6px', borderRadius: '1px', border: '1px solid #ddd' },
    amountInputSmall: { width: '40%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd' },
    cartItemPriceDiscountRow: { display: 'flex', alignItems: 'center', gap: '3px', flexDirection: 'row', marginTop: '-27px' },
    categoryRow: { display: 'flex', justifyContent: 'center', gap: '19px', marginBottom: '1px', flexWrap: 'wrap' },
    categoryCircle: { width: '95px', height: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '5px', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', textAlign: 'center', lineHeight: '1', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)', margin: '5px',marginLeft:'25px' },
    headerContainer: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'sticky', top: '0', backgroundColor: '#f5f5f5', zIndex: 10, padding: '10px 0', width: '100%' },
    searchContainer: { display: 'flex', alignItems: 'center', width: '100%', gap: '10px', marginTop: '-10px' },
    mainContent: { display: 'flex', flex: 1, backgroundColor: '#f5f5f5', padding: '5px' },
    productListContainer: { flex: 1, maxHeight: '92vh', overflowY: 'auto', marginLeft: '20px', paddingTop: '0px' },
    pageTitle: { fontSize: '24px', fontWeight: 'bold', color: '#333' },
    tableCode: { fontSize: '15px', color: '#333' },
    receiveOrderButton: { flex: 1, padding: '10px', backgroundColor: '#347cae', color: '#ffffff', border: 'none', cursor: 'pointer', borderRadius: '5px', fontWeight: 'bold', marginTop: '5px' },
    paymentButton: { flex: 1, padding: '10px', backgroundColor: '#499cae', color: '#ffffff', border: 'none', cursor: 'pointer', borderRadius: '5px', fontWeight: 'bold', marginTop: '5px' },
    receiptContainer: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', marginTop: '20px' },
    searchBar: { marginBottom: '10px', position: 'sticky', top: '40px', backgroundColor: '#f5f5f5', zIndex: 1, marginLeft: '100px' },
    searchInput: { width: 'calc(890px - 150px)', padding: '9px', borderRadius: '5px', border: '1px solid #ddd' },
    products: { display: 'flex', flexWrap: 'wrap', gap: '15px', paddingTop: '5px', marginTop: '0px' },
    productCard: { width: '100px', height: '100px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#ffffff', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px', transition: 'transform 0.2s ease', overflow: 'hidden' },
    productImage: { width: '100px', height: '70px', objectFit: 'cover', borderRadius: '3px', },
    noImage: { width: '100%', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: '5px', marginBottom: '8px' },
    noImageText: { fontSize: '14px', color: '#aaa' },
    productDetails: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', padding: '0 5px' },
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
    receiptItems: { maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', fontSize: '12px', marginBottom: '5px' },
    itemName: { flex: 2, textAlign: 'left' },
    itemQuantity: { flex: 1, textAlign: 'center' },
    itemPrice: { flex: 1, textAlign: 'right' },
    receiptSummary: { fontSize: '14px', textAlign: 'right', marginTop: '10px', borderTop: '1px solid #ddd', paddingTop: '10px', color: '#333' },
    summaryValue: { fontWeight: 'bold', color: '#000' },
    proceedButton: { marginTop: '20px', backgroundColor: '#499cae', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', width: '100%', fontSize: '16px', fontWeight: 'bold' },
    cartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    cartItems: { maxHeight: '300px', overflowY: 'scroll', marginBottom: '15px', position: 'relative', scrollbarWidth: 'none', msOverflowStyle: 'none' },
    cartItemsGradient: { position: 'absolute', bottom: '0', left: '0', right: '0', height: '20px', background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1))', pointerEvents: 'none' },
    totalContainer: { position: 'sticky', bottom: '0', backgroundColor: '#ffffff', paddingTop: '1px', paddingBottom: '10px', marginTop: '-30px', boxShadow: '0 -4px 20px rgba(2, 9, 9, 0.2)', borderRadius: '5px', border: '1px solid #ddd', padding: '8px' },
    cartItem: { display: 'flex', alignItems: 'center', marginBottom: '10px', padding: '10px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', border: '1px solid #ddd' },
    cartItemImage: { width: '40px', height: '40px', borderRadius: '3px', margin:'2px' },
    cartItemDetails: { display: 'flex', flexDirection: 'column', gap: '1px', width: '100%', marginTop: '-18px' },
    cartItemName: { fontSize: '14px', fontWeight: 'bold', color: '#333', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginLeft:'10px' },
    cartItemPrice: { fontSize: '12px', color: '#555', marginRight: '5px' , marginLeft:'10px'},
    cartItemPriceRow: { display: 'flex', alignItems: 'center', gap: '10px' },
    discountContainer: { display: 'flex', alignItems: 'center', gap: '5px', width: '70px' },
    quantityControls: { display: 'flex', alignItems: 'center', gap: '5px' },
    quantityButton: { width: '25px', height: '25px', backgroundColor: '#555', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' },
    quantityDisplay: { fontSize: '14px', fontWeight: 'bold', color: '#333' },
    clearCartButton: { color: '#555', border: 'none', padding: '5px 10px', cursor: 'pointer', fontSize: '18px' },
    amountInput: { placeholder: 'รับเงิน', width: '100%', padding: '6px', marginTop: '10px', border: '1px solid #ddd', borderRadius: '5px' },
    amountButtons: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '15px' },
    amountButton: { width: '100%', padding: '8px', backgroundColor: '#eee', border: 'none', cursor: 'pointer', borderRadius: '5px', boxShadow: '0px 2px 1px rgba(0, 0, 0, 0.2)' },
    changeDisplay: { backgroundColor: '#b3e5fc', padding: '8px', textAlign: 'center', marginTop: '10px', borderRadius: '5px', fontWeight: 'bold' },
    buttonContainer: { display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center' },
    actionButton: { flex: 1, padding: '8px', backgroundColor: '#499cae', color: '#ffffff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
    pauseButton: { flex: 1, padding: '8px', backgroundColor: '#cccccc', color: '#333333', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
    productCount: { fontSize: '14px', color: '#333', display: 'inline', paddingRight: '10px', marginLeft: '10px' },
    paymentRow: { display: 'flex', gap: '10px', marginTop: '10px' },
};
// ซ่อนแถบเลื่อนใน WebKit browsers (Chrome, Safari และ Opera)
const stylesWithHiddenScroll = `
    .cartItems::-webkit-scrollbar {
        display: none;
    }
`;
// เพิ่ม CSS เข้าไปในหัวของเอกสาร
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = stylesWithHiddenScroll;
    document.head.appendChild(styleSheet);
}
