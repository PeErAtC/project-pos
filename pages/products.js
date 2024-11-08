"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from './components/sidebar';
import Image from 'next/image';
import { FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useRouter } from 'next/router'; // เพิ่ม useRouter สำหรับการรับ tableId


export default function SalesPage() {
    const [products, setProducts] = useState([]);
    const router = useRouter(); // ประกาศ useRouter
    const { tableCode  } = router.query; // ดึง tableId จาก query parameters
    const [cart, setCart] = useState([]);
    const [receivedAmount, setReceivedAmount] = useState(0);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [billDiscount, setBillDiscount] = useState(0);
    const [billDiscountType, setBillDiscountType] = useState("THB");
    const [showReceipt, setShowReceipt] = useState(false);
    const [orderReceived, setOrderReceived] = useState(false);
    const [isBillPaused, setIsBillPaused] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const VAT_RATE = 0.07;

    const fetchProducts = () => {
        axios.get('https://easyapp.clinic/pos-api/api/products', {
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
            },
        })
        .then((response) => setProducts(response.data))
        .catch((error) => console.error('Error fetching products:', error));
    };

    useEffect(() => {
        fetchProducts();
        const interval = setInterval(fetchProducts, 5000);
        return () => clearInterval(interval);
    }, []);

    const addToCart = (product) => {
        if (product.status !== 'Y') return; // ป้องกันการเพิ่มสินค้าถ้าสถานะเป็นปิด
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
        const orderData = {
            order_number: `RE${Math.floor(100000 + Math.random() * 900000)}`,
            order_date: new Date().toISOString().split('T')[0],
            total_amount: calculateTotalAfterItemDiscounts(),
            discount: billDiscountType === "THB" ? billDiscount : 0,
            discount_per: billDiscountType === "%" ? billDiscount : 0,
            vat_per: VAT_RATE * 100,
            vat_amt: calculateVAT(),
            net_amount: calculateTotalWithBillDiscount(),
            status: 'Y',
            items: cart.map((item) => ({
                p_name: item.p_name,
                quantity: item.quantity,
                price: item.price,
                total: calculateDiscountedPrice(item.price, item.discount, item.discountType) * item.quantity
            })),
        };

        try {
            await axios.post('https://easyapp.clinic/pos-api/api/orders', orderData, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
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
        } catch (error) {
            Swal.fire('ผิดพลาด', `ไม่สามารถบันทึกบิลได้: ${error.response?.data?.message || error.message}`, 'error');
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

    const filteredProducts = products.filter(product =>
        (!selectedCategoryId || product.category_id === selectedCategoryId) &&
        (product.p_name ? product.p_name.toLowerCase().includes(searchTerm.toLowerCase()) : false)
    );

    return (
        <div style={styles.pageContainer}>
            <div style={styles.sidebarContainer}>
                <Sidebar onCategorySelect={(categoryId) => setSelectedCategoryId(categoryId)} />
            </div>
            <div style={styles.mainContent}>
                <div style={styles.productListContainer}>
                <div style={styles.headerContainer}>
                    <h1 style={styles.pageTitle}>รวมเมนูอาหาร</h1>
                    <h5 style={styles.tableCode}>โต๊ะ: {tableCode}</h5> 
                </div>

                    <div style={styles.searchBar}>
                        <input 
                            type="text" 
                            placeholder="ค้นหาสินค้า..." 
                            style={styles.searchInput} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={styles.productCount}>
                        <p>จำนวนรายการที่พบ: {filteredProducts.length} รายการ</p>
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
                                        src={`https://easyapp.clinic/pos-api/storage/app/public/product/${product.image}`}
                                        alt={product.p_name}
                                        width={240}
                                        height={240}
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
                                    <p style={styles.productPrice}>ราคา {product.price.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={styles.cart}>
                    <div style={styles.cartHeader}>
                        <h2>รายการสั่งซื้อ ({cart.reduce((acc, item) => acc + item.quantity, 0)})</h2>
                        <button onClick={clearCart} style={styles.clearCartButton}>
                            <FaTrash />
                        </button>
                    </div>
                    <div style={styles.cartItems}>
                        {cart.map((item) => (
                            <div key={item.id} style={styles.cartItem}>
                                <Image 
                                    src={`https://easyapp.clinic/pos-api/storage/app/public/product/${item.image}`}
                                    alt={item.p_name}
                                    width={40}
                                    height={40}
                                    style={styles.cartItemImage}
                                />
                                <div style={styles.cartItemDetails}>
                                    <p style={styles.cartItemName}>{item.p_name}</p>
                                    <p style={styles.cartItemPrice}>ราคา {item.price.toFixed(2)}</p>
                                    <div style={styles.discountContainer}>
                                        <input
                                            type="number"
                                            value={item.discount === 0 ? '' : item.discount}
                                            placeholder="ส่วนลด"
                                            onChange={(e) => handleItemDiscountChange(item.id, parseFloat(e.target.value) || 0, item.discountType)}
                                            style={styles.discountInput}
                                        />
                                        <select
                                            value={item.discountType}
                                            onChange={(e) => handleItemDiscountChange(item.id, item.discount, e.target.value)}
                                            style={styles.discountSelect}
                                        >
                                            <option value="THB">บาท (฿)</option>
                                            <option value="%">%</option>
                                        </select>
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
                    <div style={styles.billDiscountSection}>
                        <h3>ส่วนลดรวมของบิล</h3>
                        <div style={styles.discountContainer}>
                            <input 
                                type="number" 
                                placeholder="กรอกส่วนลดรวม" 
                                value={billDiscount === 0 ? '' : billDiscount} 
                                onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)} 
                                style={styles.discountInput} 
                            />
                            <select 
                                value={billDiscountType} 
                                onChange={(e) => setBillDiscountType(e.target.value)} 
                                style={styles.discountSelect}
                            >
                                <option value="THB">บาท (฿)</option>
                                <option value="%">%</option>
                            </select>
                        </div>
                    </div>
                    <h3>ยอดชำระรวม: {calculateTotalWithBillDiscount().toFixed(2)} บาท</h3>
                    <input
                        type="number"
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                        placeholder="รับเงิน"
                        style={styles.amountInput}
                    />
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
                    <button style={styles.paymentButton} onClick={handlePayment}>
                        ชำระเงิน
                    </button>
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
                            <p style={styles.billId}>No: {Math.random().toString(36).substring(7).toUpperCase()}</p>
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
    pageContainer: { display: 'flex', padding: '16px', height: '92vh' },
    sidebarContainer: { flex: '0 0 100px' },
    mainContent: { display: 'flex', flex: 1, backgroundColor: '#f5f5f5', padding: '10px' },
    productListContainer: { flex: 1, maxHeight: '92vh', overflowY: 'auto', marginLeft: '20px', flexDirection: 'column' },
    headerContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0px',
        position: 'sticky',
        top: '0',
        backgroundColor: '#f5f5f5',
        zIndex: 2,
        
    },
    pageTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333',
    },
    tableCode: {
        fontSize: '18px',
        color: '#333',
        fontWeight: 'bold',
        paddingRight: '20px', // เพิ่ม padding ขวาเพื่อเว้นช่องว่าง
        
    },
    searchBar: { marginBottom: '10px', position: 'sticky', top: '40px', backgroundColor: '#f5f5f5', zIndex: 1, padding: '10px 0' },
    searchInput: { width: '96%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd' },
    products: { display: 'flex', flexWrap: 'wrap', gap: '20px', paddingTop: '20px' },
    productCard: { width: '180px', height: '180px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#ffffff', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px', transition: 'transform 0.2s ease', overflow: 'hidden' },
    productImage: { width: '100%', height: '120px', objectFit: 'cover', borderRadius: '5px', marginBottom: '8px' },
    noImage: { width: '100%', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: '5px', marginBottom: '8px' },
    noImageText: { fontSize: '14px', color: '#aaa' },
    productDetails: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', padding: '0 5px' },
    productName: { fontSize: '14px', fontWeight: 'bold', textAlign: 'left', color: '#333', flex: 1 },
    productPrice: { fontSize: '14px', color: '#333', whiteSpace: 'nowrap' },
    cart: { width: '350px', maxHeight: '610px', overflowY: 'auto', backgroundColor: '#ffffff', padding: '15px', borderRadius: '8px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)', position: 'sticky', top: '20px', height: '92vh' },
    discountContainer: { display: 'flex', alignItems: 'center', gap: '1px', width: '0vw' },
    discountInput: { flex: '1', padding: '6px', borderRadius: '4px', border: '1px solid #ddd' },
    discountSelect: { width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #ddd' },
    receiptOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    receiptContainer: { backgroundColor: '#fff', padding: '20px 30px', borderRadius: '12px', width: '320px', textAlign: 'center', fontFamily: "'Arial', sans-serif" },
    header: { marginBottom: '10px' },
    shopName: { fontSize: '18px', fontWeight: 'bold', margin: '5px 0' },
    receiptTitle: { fontSize: '14px', color: '#777' },
    info: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555', marginBottom: '10px' },
    billId: { fontWeight: 'bold' },
    tableHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '5px' },
    tableColumn: { flex: 1 , textAlign: 'right' },
    receiptItem: { display: 'flex', alignItems: 'center', fontSize: '12px', marginBottom: '5px', justifyContent: 'space-between' },
    receiptItems: { maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', fontSize: '12px', marginBottom: '5px' },
    itemName: { flex: 2, textAlign: 'left' },
    itemQuantity: { flex: 1, textAlign: 'center' },
    itemPrice: { flex: 1, textAlign: 'right' },
    receiptSummary: { fontSize: '14px', textAlign: 'right', marginTop: '10px', borderTop: '1px solid #ddd', paddingTop: '10px', color: '#333' },
    summaryValue: { fontWeight: 'bold', color: '#000' },
    proceedButton: { marginTop: '20px', backgroundColor: '#499cae', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', width: '100%', fontSize: '16px', fontWeight: 'bold' },
    cartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    cartItems: { maxHeight: '210px', overflowY: 'auto', marginBottom: '15px' },
    cartItem: { display: 'flex', alignItems: 'center', marginBottom: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px', padding: '10px', boxShadow: '0px 2px 2px rgba(0, 0, 0, 0.1)' },
    cartItemImage: { width: '45px', height: '45px', borderRadius: '3px', marginRight: '15px' },
    cartItemDetails: { flex: 1 },
    cartItemName: { fontSize: '14px', fontWeight: 'bold', marginBottom: '3px' },
    cartItemPrice: { fontSize: '12px', color: '#555' },
    quantityControls: { display: 'flex', alignItems: 'center', gap: '5px' },
    quantityButton: { width: '25px', height: '25px', backgroundColor: '#555', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' },
    quantityDisplay: { fontSize: '14px', fontWeight: 'bold', color: '#333' },
    clearCartButton: { color: '#555', border: 'none', padding: '5px 10px', cursor: 'pointer', fontSize: '18px' },
    amountInput: { width: '95%', padding: '6px', marginTop: '10px', border: '1px solid #ddd', borderRadius: '5px' },
    amountButtons: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '15px' },
    amountButton: { width: '100%', padding: '8px', backgroundColor: '#eee', border: 'none', cursor: 'pointer', borderRadius: '5px', boxShadow: '0px 2px 1px rgba(0, 0, 0, 0.2)' },
    changeDisplay: { backgroundColor: '#b3e5fc', padding: '8px', textAlign: 'center', marginTop: '10px', borderRadius: '5px', fontWeight: 'bold' },
    buttonContainer: { display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center' },
    actionButton: { flex: 1, padding: '8px', backgroundColor: '#499cae', color: '#ffffff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
    pauseButton: { flex: 1, padding: '8px', backgroundColor: '#cccccc', color: '#333333', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
    productCount: { fontSize: '14px', color: '#333', marginBottom: '10px', textAlign: 'left' },
    paymentButton: { width: '100%', padding: '10px', marginTop: '10px', backgroundColor: '#499cae', color: '#ffffff', border: 'none', cursor: 'pointer', borderRadius: '5px', fontWeight: 'bold' }
};
