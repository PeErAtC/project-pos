import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from './components/backendsidebar';
import { FaCheckCircle, FaExclamationCircle, FaImage, FaPlusCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';
import config from '../lib/config';  // ใช้ config ในไฟล์ที่ต้องการ


export default function BackendPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemImage, setItemImage] = useState(null);
  const [itemStatus, setItemStatus] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [notification, setNotification] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false); // for category modal
  const [categoryAction, setCategoryAction] = useState(''); // track action: 'add', 'edit', 'delete'
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  

  useEffect(() => {
    checkLoginStatus();
    fetchItems();
    fetchCategories();
  }, []);

  // ฟังก์ชันตรวจสอบการเข้าสู่ระบบ
  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่ได้เข้าสู่ระบบ',
        text: 'กรุณาเข้าสู่ระบบก่อนใช้งาน',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#3085d6',
      }).then(() => {
        window.location.href = '/login';
      });
    }
  };

  // ฟังก์ชันดึงรายการอาหารจาก API
  const fetchItems = async () => {
    try {
        let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
        const slug = localStorage.getItem('slug') || 'default_slug';
        const authToken = localStorage.getItem('token') || 'default_token';
        
        if (!api_url.endsWith('/api')) api_url += '/api';

        const url = `${api_url}/${slug}/products`;
        const response = await axios.get(url, {
            headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
        });

        console.log("Fetched Data:", response.data);
        setItems(response.data || []);
    } catch (error) {
        console.error('Error fetching items:', error);
        showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
    }
};
  // ฟังก์ชันดึงหมวดหมู่อาหารจาก API
  const fetchCategories = async () => {
    try {
      let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
      const slug = localStorage.getItem('slug') || 'default_slug';
      const authToken = localStorage.getItem('token') || 'default_token';
      if (!api_url.includes('/api')) api_url += '/api';

      const url = `${api_url}/${slug}/category`;
      const response = await axios.get(url, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error:', error.message);
      showNotification('ไม่พบ API endpoint', 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const confirmAction = async (title, text, confirmButtonText) => {
    return await Swal.fire({
      title: title,
      text: text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: confirmButtonText,
      cancelButtonText: "ยกเลิก",
    });
  };
  
  const handleAddOrUpdateItem = async () => {
    if (!itemName || !itemCategory || !itemPrice) {
      showNotification("กรุณากรอกข้อมูลให้ครบถ้วน!", "error");
      return;
    }
  
    const formData = new FormData();
    formData.append("p_name", itemName);
    formData.append("price", parseFloat(itemPrice) || 0);
    formData.append("category_id", itemCategory);
    formData.append("status", itemStatus ? "Y" : "N");
    
    if (itemImage instanceof File) {
      formData.append("image", itemImage);
    }
    
  
    try {
      const api_url = localStorage.getItem('url_api');
      const slug = localStorage.getItem('slug');
      const authToken = localStorage.getItem('token');
      if (!api_url || !slug || !authToken) {
        showNotification('ค่าการเชื่อมต่อ API ไม่สมบูรณ์ กรุณาตรวจสอบ', 'error');
        return;
      }
  
      const config = {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
          "Content-Type": itemImage instanceof File ? "multipart/form-data" : "application/json",
        },
      };
  
      let response;
  
      if (editMode && editIndex !== null) {
        const itemToEdit = items.find((item) => item.id === editIndex);
        if (!itemToEdit) {
          await Swal.fire({
            title: 'ยืนยันการแก้ไข',
            text: "คุณต้องการบันทึกการแก้ไขนี้หรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
          });
          return;
        }
  
        const result = await confirmAction("ยืนยันการแก้ไข", "คุณต้องการบันทึกการแก้ไขนี้หรือไม่?", "บันทึก");
  
        if (result.isConfirmed) {
          const url = `${api_url}/${slug}/products/${editIndex}`;
          response = await axios.put(url, formData, config);
          Swal.fire({
            title: 'ยืนยันการเพิ่มอาหาร',
            text: "คุณต้องการเพิ่มอาหารนี้หรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'เพิ่ม',
            cancelButtonText: 'ยกเลิก',
          });
        } else {
          return;
        }
      } else {
        const result = await confirmAction("ยืนยันการเพิ่มอาหาร", "คุณต้องการเพิ่มอาหารนี้หรือไม่?", "เพิ่ม");
  
        if (result.isConfirmed) {
          const url = `${api_url}/${slug}/products`;

          response = await axios.post(url, formData, config);
          showNotification("เพิ่มข้อมูลเรียบร้อยแล้ว!", "success");

        }
        console.error('API Error:', error);
      }
  
      if (response && response.data) {
        console.log("API Response:", response.data);
      
        await fetchItems(); // โหลดข้อมูลใหม่
      
        if (response.data.image) {
          let imageUrl = `https://easyapp.clinic/pos-api/storage/app/public/product/${slug}/${response.data.image}`;
          imageUrl += `?timestamp=${new Date().getTime()}`;
      
          console.log("🔍 Updated Image URL:", imageUrl); // ดูว่า URL เปลี่ยนจริงไหม
          setItemImage(null);
      
          setTimeout(() => {
            setItemImage(imageUrl);
          }, 500);
        }
      }      
    } catch (error) {
      if (error.response) {
        console.error("Error Response:", error.response.data);
        showNotification(`Error: ${error.response.data.message || "Unknown error"}`, "error");
      } else if (error.request) {
        console.error("No Response from Server:", error.request);
        showNotification("เซิร์ฟเวอร์ไม่ตอบสนอง กรุณาตรวจสอบการเชื่อมต่อ", "error");
      } else {
      }
    }
  };

  // ฟังก์ชันรีเซ็ตฟอร์ม
  const resetForm = () => {
    setItemName('');
    setItemCategory('');
    setItemPrice('');
    setItemImage(null);
    setItemStatus(true);
    setEditMode(false);
    setEditIndex(null);
  };

    // ฟังก์ชันจัดการการเพิ่ม/ลบ/แก้ไขหมวดหมู่
    const handleCategoryAction = (action, categoryId = null) => {
      setCategoryAction(action);
      if (action === 'edit') {
        const categoryToEdit = categories.find((category) => category.id === categoryId);
        setNewCategoryName(categoryToEdit.c_name);
        setEditingCategoryId(categoryId);
        setIsEditingCategory(true); // แสดงว่ากำลังแก้ไข
      } else {
        setNewCategoryName('');
        setEditingCategoryId(null);
        setIsEditingCategory(false); // แสดงว่ากำลังเพิ่มหมวดหมู่ใหม่
      }
      setShowCategoryModal(true); // เปิด modal
    }; 
    
    // ฟังก์ชันจัดการการเพิ่ม/แก้ไข/ลบหมวดหมู่
// ฟังก์ชันจัดการการเพิ่ม/แก้ไข/ลบหมวดหมู่
const handleSaveCategory = async () => {
  if (!newCategoryName && !selectedCategory) {
    showNotification('กรุณากรอกชื่อหมวดหมู่หรือเลือกหมวดหมู่', 'error');
    return;
  }
  const result = await Swal.fire({
    title: 'ยืนยันการเพิ่มหมวดหมู่',
    text: `คุณต้องการเพิ่มหมวดหมู่ "${newCategoryName}" หรือไม่?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'เพิ่ม',
    cancelButtonText: 'ยกเลิก',
  });

  if (!result.isConfirmed) return; // ถ้ากดยกเลิก ให้หยุดทำงานที่นี่

  const api_url = localStorage.getItem('url_api') || 'https://default.api.url';
  const slug = localStorage.getItem('slug') || 'default_slug';
  const authToken = localStorage.getItem('token') || 'default_token';

  const formData = { c_name: newCategoryName };

  try {
    let response;
    if (categoryAction === 'edit') {
      const url = `${api_url}/${slug}/category/${editingCategoryId}`;
      response = await axios.put(url, formData, {
        headers: { 'Authorization': `Bearer ${authToken}`, 'Accept': 'application/json' },
      });

    
      Swal.fire({
        icon: 'success',
        title: 'แก้ไขหมวดหมู่เรียบร้อยแล้ว!',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#28a745'
      });
      fetchCategories();  // โหลดหมวดหมู่ใหม่
      setShowCategoryModal(false);  // ปิด modal
      
    } else if (categoryAction === 'add') {
      const url = `${api_url}/${slug}/category`;
      response = await axios.post(url, formData, {
        headers: { 'Authorization': `Bearer ${authToken}`, 'Accept': 'application/json' },
      });
      Swal.fire({
        icon: 'success',
        title: 'เพิ่มหมวดหมู่เรียบร้อยแล้ว!',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#28a745'
      });
    } else if (categoryAction === 'delete' && selectedCategory) {
      const url = `${api_url}/${slug}/category/${selectedCategory}`;
      response = await axios.delete(url, {
        headers: { 'Authorization': `Bearer ${authToken}`, 'Accept': 'application/json' },
      });
      Swal.fire({
        icon: 'success',
        title: 'ลบหมวดหมู่เรียบร้อยแล้ว!',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#28a745'
      });
    }

    fetchCategories();  // รีเฟรชหมวดหมู่
    setShowCategoryModal(false);  // ปิด modal
  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาดในการจัดการหมวดหมู่',
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#d33'
    });
  }
};  
  
    // ฟังก์ชันปิด modal
    const handleCloseCategoryModal = () => {
      setShowCategoryModal(false);
    };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showNotification('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง!', 'error');
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // ตรวจสอบขนาด (2MB)
        showNotification('ไฟล์มีขนาดใหญ่เกินไป! (ไม่เกิน 2MB)', 'error');
        return;
      }
      setItemImage(file);
    }
  };

  const handleRemoveImage = () => {
    setItemImage(null); // รีเซ็ตรูปภาพที่เลือก
  };

  const handleImageUpload = async (event) => {
    const formData = new FormData();
    formData.append('image', event.target.files[0]); // เลือกรูปที่ผู้ใช้เลือก
  
    try {
      const slug = localStorage.getItem('slug') || 'default_slug';
      const api_url = localStorage.getItem('url_api') || 'https://default.api.url';
      const authToken = localStorage.getItem('token') || 'default_token';
      
      const response = await fetch(`${api_url}/${slug}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });
  
      const result = await response.json();
    
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'อัพโหลดรูปภาพสำเร็จ',
          text: result.message,
        });
  
        // Update image path or URL in the state
        setImage(result.data.image);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'ข้อผิดพลาด',
          text: result.message,
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถอัพโหลดรูปภาพได้',
      });
    }
  };
  

  // ฟังก์ชันจัดการการลบรายการอาหาร
  const handleDeleteItem = async (id) => {
    Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: 'คุณต้องการลบรายการนี้จริง ๆ หรือไม่',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          let api_url = localStorage.getItem('url_api') || 'https://default.api.url';
          const slug = localStorage.getItem('slug') || 'default_slug';
          const authToken = localStorage.getItem('token') || 'default_token';
          if (!api_url.includes('/api')) api_url += '/api';

          const url = `${api_url}/${slug}/products/${id}`;
          await axios.delete(url, {
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${authToken}` },
          });

          showNotification('ลบข้อมูลเรียบร้อยแล้ว!', 'success');
          await fetchItems();
        } catch (error) {
          console.error('Error:', error);
          showNotification('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
        }
      }
    });
  };

  // ฟังก์ชันจัดการการแก้ไขรายการอาหาร
  const handleEditItem = (id) => {
    const api_url = localStorage.getItem('url_api') || 'https://default.api.url';
    const slug = localStorage.getItem('slug') || 'default_slug';
    const authToken = localStorage.getItem('token') || 'default_token';
    const itemToEdit = items.find((item) => item.id === id);
  
    console.log("API:", api_url, "Slug:", slug, "Token:", authToken); // ตรวจสอบค่าจาก localStorage
  
    if (!itemToEdit) {
      showNotification('ไม่พบรายการที่ต้องการแก้ไข', 'error');
      return;
    }
  
    setItemName(itemToEdit.p_name || itemToEdit.name);
    setItemCategory(itemToEdit.category_id);
    setItemPrice(itemToEdit.price);
    setItemStatus(itemToEdit.status === 'Y');
    setEditMode(true);
    setEditIndex(id);
  
    // รีเซ็ตค่ารูปภาพก่อนแสดง
    setItemImage(null);
  
    // ถ้ามีรูปเก่า ให้โหลดจาก URL พร้อม timestamp ป้องกันแคช
    if (itemToEdit.image && !itemToEdit.image.startsWith("http")) {
      let imageUrl = `https://easyapp.clinic/pos-api/storage/app/public/product/${slug}/${itemToEdit.image}`;
      imageUrl += `?timestamp=${new Date().getTime()}`;  // บังคับโหลดรูปใหม่
      setItemImage(imageUrl);
    } else {
      setItemImage(itemToEdit.image);
    }
  };  

  // ฟังก์ชันลบหมวดหมู่
  const handleDeleteCategory = async () => {
    if (!selectedCategory) {
      showNotification('กรุณาเลือกหมวดหมู่ที่ต้องการลบ', 'error');
      return;
    }
  
    const result = await Swal.fire({
      title: 'ยืนยันการลบหมวดหมู่',
      text: 'คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });
  
    if (!result.isConfirmed) return; // ถ้าผู้ใช้กดยกเลิก ให้หยุดที่นี่
  
    const api_url = localStorage.getItem('url_api') || 'https://default.api.url';
    const slug = localStorage.getItem('slug') || 'default_slug';
    const authToken = localStorage.getItem('token') || 'default_token';
    const url = `${api_url}/${slug}/category/${selectedCategory}`;
  
    try {
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' },
      });
  
      Swal.fire({
        icon: 'success',
        title: 'ลบหมวดหมู่เรียบร้อยแล้ว!',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#28a745'
      });
      fetchCategories();
      setShowCategoryModal(false);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดในการลบหมวดหมู่',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#d33'
      });
    }
  };
  // ฟังก์ชันกรองรายการอาหารตามคำค้นหาและหมวดหมู่
  const filteredItems = items.filter((item) => {
    const nameMatch = item.p_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const categoryMatch = filterCategory === '' || item.category_id === parseInt(filterCategory);
    return nameMatch && categoryMatch;
  });  

  const availableItemsForSale = filteredItems.filter(item => item.status === 'Y'); // รายการที่มีสถานะเปิด
  const sortedItems = items.sort((a, b) => a.id - b.id);

  return (
    <div style={styles.container}>
      <Sidebar onListClick={() => console.log('List clicked')} />

      <div style={styles.contentContainer}>
        {notification && (
          <div style={{
            ...styles.notification,
            backgroundColor: notification.type === 'success' ? '#28a745' : '#dc3545',
            color: '#fff',
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
          }}>
            {notification.type === 'success' ? <FaCheckCircle size={20} /> : <FaExclamationCircle size={20} />}
            <span style={{ marginLeft: '10px', fontSize: '16px', fontWeight: 'bold' }}>{notification.message}</span>
          </div>
        )}

        <div style={styles.listContainer}>
          <h1 style={styles.title}>รายการอาหาร</h1>
          
          <div style={styles.searchContainer}>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={styles.dropdown_all}>
              <option value="">หมวดหมู่ (ทั้งหมด)</option>
              {categories.map(category => (
                <option key={category.id.toString()} value={category.id}>{category.c_name}</option>
              ))}
            </select>
            <button onClick={() => handleCategoryAction('add')} style={styles.addCategoryButton}><FaPlusCircle size={20} /></button>
            <input 
              type="text" 
              placeholder="ชื่ออาหาร" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              style={styles.searchInput} 
            />
          </div>
          <p style={styles.itemCount}>{filteredItems.length} รายการ</p>
          {filteredItems.length > 0 && (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>รหัสรายการ</th>
                    <th style={styles.th}>ชื่ออาหาร</th>
                    <th style={styles.th}>ราคา</th>
                    <th style={styles.th}>หมวดหมู่</th>
                    <th style={styles.th}>สถานะ</th> 
                    <th style={styles.th}>ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <tr key={index} style={styles.row(index)}>
                      <td style={styles.td}>{item.id.toString().padStart(4, "0")}</td>
                      <td style={styles.td}>{item.p_name || item.name}</td>
                      <td style={styles.td}>{item.price.toFixed(2)}</td>
                      <td style={styles.td}>
                        {categories.find((cat) => cat.id === item.category_id)?.c_name}
                      </td>
                      <td style={{ ...styles.td, color: item.status === "Y" ? "#111" : "red" }}>
                        {item.status === "Y" ? "เปิด" : "ปิด"}
                      </td>
                      <td style={styles.td}>
                        <button onClick={() => handleEditItem(item.id)} style={styles.editButton}>แก้ไข</button>
                        <button onClick={() => handleDeleteItem(item.id)} style={styles.deleteButton}>ลบ</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "10px" }}>
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Modal สำหรับการจัดการหมวดหมู่ */}
        {showCategoryModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h2>{categoryAction === 'edit' ? 'แก้ไขหมวดหมู่' : categoryAction === 'delete' ? 'ลบหมวดหมู่' : 'เพิ่มหมวดหมู่'}</h2>
              <input
                type="text"
                placeholder="ชื่อหมวดหมู่"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                style={styles.inputModal}
              />
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={styles.dropdown}
              >
                <option value="">เลือกหมวดหมู่</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.c_name}</option>
                ))}
              </select>

              {/* จัดการปุ่มเรียงลำดับลง */}
              <div style={styles.buttonGroup}>
                {selectedCategory ? (
                  <div>
                    <button onClick={handleDeleteCategory} style={styles.DeleteButtonModal}>ลบ</button>
                    <button onClick={handleCloseCategoryModal} style={styles.cancelButtonModal}>ยกเลิก</button>
                  </div>
                ) : (
                  <div>
                    <button onClick={handleSaveCategory} style={styles.saveButton}>บันทึก</button>
                    <button onClick={handleCloseCategoryModal} style={styles.cancelButtonModal}>ยกเลิก</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
        <div style={styles.formContainer}>
          <h1 style={styles.title}>{editMode ? 'แก้ไขอาหาร' : 'เพิ่มอาหาร'}</h1>
          <input
            type="text"
            placeholder="ชื่อสินค้า"
            value={itemName}
            onChange={(e) => {
              if (e.target.value.length <= 18) {
                setItemName(e.target.value); 
              }
            }}
            maxLength={18} 
            style={styles.input}
          />
          <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} style={styles.dropdown_out}>
            <option>กรุณาเลือกหมวดหมู่</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.c_name}</option>
            ))}
          </select>

          <label htmlFor="file-upload" style={styles.imageUpload}>
            {itemImage ? (
              <img src={typeof itemImage === 'string' ? itemImage : URL.createObjectURL(itemImage)} alt="Preview" style={styles.imagePreview} />
            ) : (
              <>
                <FaImage size={50} color="#aaa" />
                <p>ใส่รูปภาพอาหาร</p>
              </>
            )}
            <input id="file-upload" type="file" onChange={handleImageChange} style={styles.fileInput} />
          </label>
          <input type="number" placeholder="ราคา" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} style={styles.input} />

          {/* แสดงหัวข้อสำหรับการเปิดปิดสถานะ */}
          <h3 style={{ margin: '10px 0' }}>สถานะอาหาร</h3>
          {/* ใช้ปุ่มเพื่อสลับสถานะ */}
          <div style={styles.statusToggle}>
            <button 
              onClick={() => setItemStatus(true)} 
              style={{ ...styles.statusButton, backgroundColor: itemStatus ? '#499cae' : '#ccc' }}>
              เปิด
            </button>
            <button 
              onClick={() => setItemStatus(false)} 
              style={{ ...styles.statusButton, backgroundColor: !itemStatus ? '#d9534f' : '#ccc' }}>
              ปิด
            </button>
          </div>
          <button onClick={handleAddOrUpdateItem} style={styles.button}>{editMode ? 'บันทึกการแก้ไข' : 'บันทึก'}</button>
          {editMode && <button onClick={resetForm} style={styles.cancelButton}>ยกเลิก</button>}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', backgroundColor: '#ffffff' },
  contentContainer: { display: 'flex', flex: 1, padding: '25px 0 20px 130px', fontFamily: 'Arial, sans-serif' },
  addCategoryButton: {backgroundColor: '#ccc',color: '#fff',border: 'none',borderRadius: '5px',cursor: 'pointer',width: '40px',  height:'42px',marginBottom: '1px',},
  dropdownContainer: {display: 'flex',justifyContent: 'space-between', alignItems: 'center',width: '100%',maxWidth: '400px', },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',  // สีมืดพื้นหลัง
    backdropFilter: 'blur(5px)',  // เบลอพื้นหลัง
    zIndex: 999,  // ให้ฟอร์มแสดงเหนือพื้นหลังที่เบลอ
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
    zIndex: 1000, // ฟอร์มต้องอยู่เหนือ overlay
    width: '400px',
    height: 'auto',
  },
  modalContent: {
    width: '100%',
    padding: '0px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ฟิลด์ที่มีกรอบสีขาว
  inputModal: {
    padding: '12px',
    borderRadius: '5px',
    border: '1px solid #ccc', // กรอบสีขาว
    marginBottom: '15px',
    width: '320px',
    
  },
  dropdown: {
    padding: '12px',
    borderRadius: '5px',
    border: '1px solid #ccc', // กรอบสีขาว
    width: '350px',
    marginBottom: '5px',
  },
  saveButton: {
    backgroundColor: '#499cae',
    color: '#fff',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '350px',
    marginTop: '10px',
    marginLeft:'20px',
  },
  cancelButtonModal: {
    backgroundColor: '#ccc',
    color: '#fff',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '10px',
    width: '350px',
    marginLeft:'20px',
  },
  DeleteButtonModal: {
    backgroundColor: '#d9534f',
    color: '#fff',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '10px',
    width: '350px',
    marginLeft:'20px',
  },
  notification: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    padding: '15px 25px',
    color: '#fff',
    fontSize: '16px',
    borderRadius: '15px',
    zIndex: 1000,
  },
  formContainer: {
    marginLeft:'50px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  searchContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  itemCount: {
    fontSize: '16px',
    marginBottom: '10px',
  },
  tableContainer: {
    overflowY: 'auto',
    overflowX: 'hidden',
    height: '510px',
    borderRadius: '8px',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    width: '1000px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    borderSpacing: '0',
    fontSize: '14px',
  },
  th: {
    padding: '10px 15px',
    backgroundColor: '#499cae',
    textAlign: 'left',
    fontWeight: 'bold',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    color: '#fff',
  },
  td: {
    padding: '10px 15px',
    borderTop: '1px solid #e0e0e0',
    width: '305px',
    color: '#111',
  },
  row: (index) => ({
    backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#f0f2f0',
    transition: 'background-color 0.2s',
  }),
  input: {
    padding: '14px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    width: '320px',
    marginBottom: '15px',
  },
  fileInput: {
    display: 'none',
  },
  imageContainer: {
    height: '100px',
    border: '1px dashed #ccc',
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '15px',
    color: '#888',
  },
  button: {
    width: '305px',
    padding: '12px',
    borderRadius: '5px',
    backgroundColor: '#499cae',
    color: '#fff',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
  },
  // เพิ่มให้ปุ่มแสดงเรียงกันข้างล่าง
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column', // จัดเรียงปุ่มลง
    gap: '10px',
    width: '390px',
    marginTop: '10px',
  },
  dropdown_all:{    padding: '12px',
    borderRadius: '5px',
    border: '1px solid #ccc', // กรอบสีขาว
    width: '350px',
    marginBottom: '15px',
  },
    dropdown_out: {
      padding: '12px',
      borderRadius: '5px',
      border: '1px solid #ccc', // กรอบสีขาว
      width: '350px',
      marginBottom: '15px',
    },
  searchInput: { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', flex: 1, marginBottom: '15px' },
  editButton: { background: 'linear-gradient(to right, #ffd700, #FFC137)', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', marginRight: '5px' },
  deleteButton: { background: 'linear-gradient(to right, #ff7f7f, #d9534f)', color: '#fff', border: 'none', padding: '5px 17px', borderRadius: '5px', cursor: 'pointer' },
  cancelButton: { width: '305px', padding: '12px', borderRadius: '5px', backgroundColor: '#d9534f', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px' },
  imageUpload: { border: '2px dashed #aaa', borderRadius: '10px', width: '350px', height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888', marginBottom: '15px', textAlign: 'center' },
  imagePreview: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' },
  statusToggle: { display: 'flex', gap: '10px', marginBottom: '15px' },
  statusButton: { padding: '10px', borderRadius: '5px', color: '#fff', border: 'none', cursor: 'pointer', width: '150px' }
};
