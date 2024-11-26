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

    // Add this function inside SalesPage component
    const toggleCategoryPopup = () => {
        setIsCategoryPopupOpen(prevState => !prevState);
    };
    const handleCategorySelect = (categoryId) => {
        setSelectedCategoryId(categoryId);
    };

    const addToCart = (product) => {
        if (product.status !== 'Y') return;
    
        const element = document.querySelector(`#product-${product.id}`);
        if (element) {
            element.style.animation = "none"; // รีเซ็ตก่อน
            requestAnimationFrame(() => {
                element.style.animation = "shake 0.5s ease, highlight 1s ease";
            });
        }
    
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

    const handlePayment = async () => {
        if (!orderReceived) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณารับออเดอร์ก่อน',
                text: 'ไม่สามารถชำระเงินได้จนกว่าจะรับออเดอร์',
                confirmButtonText: 'ตกลง',
            });
            return;
        }
    
        if (cart.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'ไม่มีสินค้าในตะกร้า',
                text: 'กรุณาเพิ่มสินค้าในตะกร้าก่อนทำการชำระเงิน',
                confirmButtonText: 'ตกลง',
            });
            return;
        }
    
        setShowReceipt(true); // แสดงบิลเพื่อให้ผู้ใช้ตรวจสอบ
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
                return response.data.order; // ส่งคืนออบเจ็กต์ order
            } else {
                throw new Error('Invalid response format from API');
            }
        } catch (error) {
            console.error('Error while creating order:', error.response?.data || error.message);
            throw new Error(`Failed to create order: ${error.response?.data?.message || error.message}`);
        }
    };
    
        
    
    // ฟังก์ชันหลักสำหรับรับคำสั่งซื้อ (สร้าง order และบันทึกรายการ order_items)
    const receiveOrder = async () => {
        try {
            const userId = 1; // ตัวอย่าง user ID
            const orderData = {
                total_amount: calculateTotalAfterItemDiscounts(),
                discount: billDiscountType === 'THB' ? billDiscount : 0,
                discount_per: billDiscountType === '%' ? billDiscount : 0,
                vat_per: VAT_RATE * 100,
                vat_amt: calculateVAT(),
                net_amount: calculateTotalWithBillDiscount(),
                status: 'N', // ออเดอร์ยังไม่ชำระเงิน
                tables_id: tableCode || null,
                created_by: userId,
                items: cart.map((item) => ({
                    product_id: item.id || 0,
                    p_name: item.p_name || 'ไม่มีชื่อสินค้า',
                    quantity: item.quantity || 1,
                    price: item.price || 0,
                    total:
                        calculateDiscountedPrice(item.price, item.discount, item.discountType) *
                        item.quantity || 0,
                    discount: item.discountType === 'THB' ? item.discount || 0 : 0,
                    discount_per: item.discountType === '%' ? item.discount || 0 : 0,
                    net_total:
                        calculateDiscountedPrice(item.price, item.discount, item.discountType) *
                        item.quantity || 0,
                    status: 'Y',
                    created_at: new Date().toISOString(),
                })),
            };
    
            console.log('Order Data:', orderData);
            const newOrder = await sendOrder(orderData);
    
            if (!newOrder) {
                throw new Error('Failed to create order. No order data returned.');
            }
    
            setOrderNumber(newOrder.order_number); // ใช้หมายเลขออร์เดอร์จาก API
            setOrderId(newOrder.id); // เก็บ orderId ใน state
            setOrderReceived(true); // เปิดใช้งานการชำระเงิน
    
            Swal.fire({
                icon: 'success',
                title: 'รับออเดอร์สำเร็จ',
                text: 'คำสั่งซื้อและรายการสินค้าถูกบันทึกเรียบร้อยแล้ว!',
                confirmButtonText: 'ตกลง',
            }).then(() => {
                setShowReceipt(true);
            });
        } catch (error) {
            console.error('Error while processing order:', error.message);
            Swal.fire('ผิดพลาด', error.message, 'error');
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
            if (!orderId) {
                throw new Error('Order ID is missing.');
            }
    
            const url = `${api_url}/api/${slug}/orders/${orderId}`;
            console.log('Closing receipt for orderId:', orderId);
    
            // Fetch Order
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
    
            console.log('Response from GET Order API:', response.data);
    
            // ดึงข้อมูล Order จาก Array
            const order = Array.isArray(response.data) ? response.data[0] : response.data;
    
            if (!order || !order.id) {
                throw new Error('Order not found.');
            }
    
            if (order.status !== 'N') {
                throw new Error('Order has already been closed or invalid status.');
            }
    
            // Update Order Status
            const updateResponse = await axios.put(url, {
                status: 'Y',
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
            });
    
            console.log('Response from PUT Order API:', updateResponse.data);
    
            if (!updateResponse.data || updateResponse.data.status !== 'Y') {
                throw new Error('Failed to update order status.');
            }
    
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
        } catch (error) {
            console.error('Error closing receipt:', error.message);
            Swal.fire('ผิดพลาด', `ไม่สามารถอัปเดตบิลได้: ${error.message}`, 'error');
        }
    };
    const confirmPayment = async () => {
        try {
            const url = `${api_url}/api/${slug}/orders/${orderId}`;
            const response = await axios.put(
                url,
                { status: 'Y' },
                {
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );
    
            if (!response.data || response.data.status !== 'Y') {
                throw new Error('Failed to update order status.');
            }
    
            Swal.fire({
                icon: 'success',
                title: 'ชำระเงินสำเร็จ',
                text: 'คำสั่งซื้อถูกบันทึกเรียบร้อยแล้ว!',
                confirmButtonText: 'ตกลง',
            }).then(() => {
                setShowReceipt(false);
                setCart([]);
                setReceivedAmount(0);
                setBillDiscount(0);
                setBillDiscountType('THB');
            });
        } catch (error) {
            console.error('Error during payment:', error.message);
            Swal.fire('ผิดพลาด', `ไม่สามารถดำเนินการได้: ${error.message}`, 'error');
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
                        <button
                            style={{
                                ...styles.receiveOrderButton,
                                ...(cart.length === 0 ? styles.buttonDisabled : {}),
                            }}
                            onClick={receiveOrder}
                            disabled={cart.length === 0} // ปุ่มจะถูกปิดใช้งานเมื่อไม่มีรายการในตะกร้า
                        >
                            รับออเดอร์
                        </button>                    
                        <button
                            style={{
                                ...styles.paymentButton,
                                ...(orderReceived && cart.length > 0 ? {} : styles.paymentButtonDisabled),
                            }}
                            onClick={handlePayment}
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
                            <button style={styles.actionButton} onClick={() => closeReceipt(orderId)}>
                                ดำเนินการ
                            </button>
                            <button style={styles.pauseButton} onClick={handlePauseBill}>
                                พักบิล
                            </button>
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
    cart: {width: '400px',overflowY: 'auto',backgroundColor: '#f8f9fa',padding: '15px',borderRadius: '12px',marginTop: '-8px',display: 'flex',flexDirection: 'column',justifyContent: 'space-between',boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',},    
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
    categoryCircle: { width: '95px',height: '60px',display: 'flex',flexDirection: 'column',alignItems: 'center',justifyContent: 'center',borderRadius: '10px',fontWeight: 'bold',cursor: 'pointer',fontSize: '12px', textAlign: 'center',lineHeight: '1',margin: '10px',background: '#499cae',backdropFilter: 'blur(5px)', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',color: '#ffffff', transition: 'all 0.3s ease',':hover': {transform: 'scale(1.1)',background: 'rgba(255, 127, 36, 0.9)', boxShadow: '0 6px 8px rgba(0, 0, 0, 0.2)',},},
    headerContainer: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'sticky', top: '0', backgroundColor: '#f5f5f5', zIndex: 10, padding: '10px 0', width: '100%' },
    searchContainer: { display: 'flex', alignItems: 'center', width: '100%', gap: '10px', marginTop: '-10px' },
    mainContent: { display: 'flex', flex: 1, backgroundColor: '#f5f5f5', padding: '5px' },
    productListContainer: { flex: 1, maxHeight: '92vh', overflowY: 'auto', marginLeft: '20px', paddingTop: '0px' },
    pageTitle: { fontSize: '24px', fontWeight: 'bold', color: '#333' },
    tableCode: { fontSize: '15px', color: '#333' },
    receiveOrderButton: { flex: 1, padding: '10px', backgroundColor: '#347cae', color: '#ffffff', border: 'none', cursor: 'pointer', borderRadius: '5px', fontWeight: 'bold', marginTop: '5px' },
    paymentButton: {flex: 1,padding: '10px',backgroundColor: '#499cae',color: '#ffffff',border: 'none',cursor: 'pointer',borderRadius: '5px',fontWeight: 'bold',marginTop: '5px', opacity: 1,},    
    paymentButtonDisabled: { opacity: 0.5,cursor: 'not-allowed',},receiptContainer: { backgroundColor: '#fff', padding: '20px 30px',borderRadius: '12px',width: '320px',textAlign: 'center',fontFamily: "'Poppins', sans-serif",boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',animation: 'fadeIn 0.5s ease',},
    // Animation Keyframes
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
    receiptItems: {
        maxHeight: '150px', // กำหนดความสูงสูงสุด
        overflowY: 'scroll', // เปิดการเลื่อนในแนวตั้ง
        scrollbarWidth: 'none', // ซ่อน scrollbar ใน Firefox
        msOverflowStyle: 'none', // ซ่อน scrollbar ใน Internet Explorer/Edge
        WebkitOverflowScrolling: 'touch', // ให้การเลื่อนลื่นใน iOS/Android
    },    
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
    styleSheet.innerText = `
        /* ตัวจัดการพื้นหลังของเว็บไซต์ */
        body {
            font-family: 'Roboto', sans-serif;
            background: linear-gradient(to bottom, #eef2f3, #f7fbff);
            margin: 0;
            padding: 0;
            overflow-x: hidden;
            color: #333;
        }
        .receiptItems::-webkit-scrollbar {
            display: none; /* ซ่อน scrollbar ใน Chrome/Safari */
        }

        .receiptItems {
    max-height: 150px;
    overflow-y: auto;
    scrollbar-width: none; /* ซ่อน Scrollbar ใน Firefox */
    -ms-overflow-style: none; /* ซ่อน Scrollbar ใน IE และ Edge */
    position: relative; /* ป้องกันการขยายเกิน container */
    padding: 0; /* ลบ Padding ที่อาจทำให้เกิดเส้น */
    margin: 0; /* ลบ Margin ที่อาจทำให้เกิดเส้น */
}
    .receiptItems::-webkit-scrollbar {
    display: none; /* ซ่อน Scrollbar ใน WebKit (Chrome/Safari) */
}
       /* จัดการเอฟเฟกต์ไล่สีในเส้นล่าง */


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
    0% {
        transform: scale(1);
        box-shadow: 0 0 0 rgba(0, 0, 0, 0.7);
    }
    50% {
        transform: scale(1.05);
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
    }
    100% {
        transform: scale(1);
        box-shadow: 0 0 0 rgba(0, 0, 0, 0.7);
    }
}

.pulse-effect {
    animation: pulse 0.5s ease-out;
    background-color: #d9f7be !important;
}

    `;
    document.head.appendChild(styleSheet);
}
