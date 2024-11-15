import React, { useEffect, useState } from 'react';

import axios from 'axios';

import Sidebar from './components/backendsidebar';

import { FaCheckCircle, FaExclamationCircle, FaImage } from 'react-icons/fa';

import Swal from 'sweetalert2';

const api_url = "https://easyapp.clinic/pos-api";
const slug = "abc";
const authToken = "R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH";

export default function BackendPage() {

  const [items, setItems] = useState([]); // สถานะเก็บรายการอาหาร
  const [categories, setCategories] = useState([]); // สถานะเก็บหมวดหมู่อาหาร
  const [itemName, setItemName] = useState(''); // สถานะเก็บชื่ออาหาร
  const [itemCategory, setItemCategory] = useState(''); // สถานะเก็บหมวดหมู่อาหารที่เลือก
  const [itemPrice, setItemPrice] = useState(''); // สถานะเก็บราคาอาหาร
  const [itemImage, setItemImage] = useState(null); // สถานะเก็บรูปภาพอาหาร
  const [itemStatus, setItemStatus] = useState(true); // สถานะเก็บสถานะการเปิด/ปิดอาหาร
  const [filterCategory, setFilterCategory] = useState(''); // สถานะเก็บหมวดหมู่ที่ใช้ในการกรอง
  const [searchQuery, setSearchQuery] = useState(''); // สถานะเก็บคำค้นหา
  const [editMode, setEditMode] = useState(false); // สถานะเก็บว่ากำลังแก้ไขหรือไม่
  const [editIndex, setEditIndex] = useState(null); // สถานะเก็บรหัสรายการที่แก้ไข
  const [notification, setNotification] = useState(null); // สถานะเก็บการแจ้งเตือน

  useEffect(() => {
    fetchItems(); // เรียกใช้ฟังก์ชันเพื่อดึงรายการอาหาร
    fetchCategories(); // เรียกใช้ฟังก์ชันเพื่อดึงหมวดหมู่อาหาร
  }, []);

  // ฟังก์ชันดึงรายการอาหารจาก API
  const fetchItems = async () => {
    try {
      const url = `${api_url}/api/${slug}/products`;
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer '+ authToken,
        },
      });
      console.log(response.data); // ตรวจสอบข้อมูลที่ได้จาก API
      setItems(response.data); // เก็บข้อมูลรายการอาหารในสถานะ
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };
  

  // ฟังก์ชันดึงหมวดหมู่อาหารจาก API
  const fetchCategories = async () => {
    try {
      const url = `${api_url}/api/${slug}/category`;
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer '+ authToken,
        },
      });
      setCategories(response.data); // เก็บข้อมูลหมวดหมู่อาหารในสถานะ
    } catch (error) {
      console.error('Error fetching categories:', error); // แสดงข้อผิดพลาดหากมี
    }
  };

  // ฟังก์ชันแสดงการแจ้งเตือน
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000); // ตั้งเวลาให้การแจ้งเตือนหายไปอัตโนมัติ
  };

  // ฟังก์ชันเพิ่มหรือแก้ไขรายการอาหาร
  const handleAddOrUpdateItem = async () => {
    // ตรวจสอบข้อมูลที่กรอก
    if (!itemName || !itemCategory || !itemPrice) {
      showNotification("กรุณากรอกข้อมูลให้ครบถ้วน!", 'error'); // แจ้งเตือนถ้าข้อมูลไม่ครบ
      return; // ไม่ทำอะไรต่อหากข้อมูลไม่ครบ
    }

    const formData = new FormData();
    formData.append('p_name', itemName); 
    formData.append('price', itemPrice || 0); 
    formData.append('category_id', itemCategory); 
    formData.append('status', itemStatus ? 'Y' : 'N'); 
    if (itemImage instanceof File) formData.append('image', itemImage); // เพิ่มรูปภาพถ้ามี    

    try {
      const config = {
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer '+ authToken,
          'Content-Type': itemImage instanceof File ? 'multipart/form-data' : 'application/json',
        },
      };

      let response;
      if (editMode && editIndex !== null) {
        // แสดงการแจ้งเตือนก่อนบันทึกการแก้ไข
        const result = await Swal.fire({
          title: 'ยืนยันการแก้ไข',
          text: "คุณต้องการบันทึกการแก้ไขนี้หรือไม่?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'บันทึก',
          cancelButtonText: 'ยกเลิก',
        });

        if (result.isConfirmed) {
          const url = `${api_url}/api/${slug}/products/${editIndex}`;
          response = await axios.put(url, formData, config);
          showNotification("อัพเดทข้อมูลเรียบร้อยแล้ว!", 'success'); // แจ้งเตือนเมื่ออัปเดตสำเร็จ
        } else {
          return; // ถ้ายกเลิกไม่ต้องทำอะไรต่อ
        }
      } else {
        // แสดงการแจ้งเตือนก่อนเพิ่มอาหาร
        const result = await Swal.fire({
          title: 'ยืนยันการเพิ่มอาหาร',
          text: "คุณต้องการเพิ่มอาหารนี้หรือไม่?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'เพิ่ม',
          cancelButtonText: 'ยกเลิก',
        });

        if (result.isConfirmed) {
          const url = `${api_url}/api/${slug}/products`;
          response = await axios.post(url, formData, config);
          showNotification("เพิ่มข้อมูลเรียบร้อยแล้ว!", 'success'); // แจ้งเตือนเมื่อเพิ่มสำเร็จ
        } else {
          return; // ถ้ายกเลิกไม่ต้องทำอะไรต่อ
        }
      }

      await fetchItems(); // ดึงข้อมูลรายการอาหารใหม่
      resetForm(); // รีเซ็ตฟอร์ม
    } catch (error) {
      console.error("Error while adding/updating item:", error); // แสดงข้อผิดพลาดหากมี
      showNotification("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองอีกครั้ง", 'error'); // แจ้งเตือนข้อผิดพลาด
    }
  };

  // ฟังก์ชันรีเซ็ตฟอร์ม
  const resetForm = () => {
    setItemName('');
    setItemCategory('');
    setItemPrice('');
    setItemImage(null);
    setItemStatus(true); // ตั้งค่าสถานะเป็นเปิด
    setEditMode(false);
    setEditIndex(null);
  };

  // ฟังก์ชันจัดการการเปลี่ยนแปลงรูปภาพ
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setItemImage(file);
    }
  };

  // ฟังก์ชันจัดการการลบรายการอาหาร
  const handleDeleteItem = async (id) => {
    Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: "คุณต้องการลบรายการนี้จริง ๆ หรือไม่",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const url = `${api_url}/api/${slug}/products/${id}`;
          await axios.delete(url, {
            headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer '+ authToken,
            },
          });
          showNotification("ลบข้อมูลเรียบร้อยแล้ว!", 'success'); // แจ้งเตือนเมื่อถูกลบสำเร็จ
          fetchItems(); // ดึงข้อมูลรายการอาหารใหม่
        } catch (error) {
          console.error("Error:", error); // แสดงข้อผิดพลาดหากมี
          showNotification(`เกิดข้อผิดพลาด: ${JSON.stringify(error.response?.data || 'Unknown error')}`, 'error'); // แจ้งเตือนข้อผิดพลาด
        }
      }
    });
  };
  

  // ฟังก์ชันจัดการการแก้ไขรายการอาหาร
  const handleEditItem = (id) => {
    const itemToEdit = items.find((item) => item.id === id);
    if (itemToEdit) {
      setItemName(itemToEdit.p_name || itemToEdit.name);
      setItemCategory(itemToEdit.category_id);
      setItemPrice(itemToEdit.price);
      // สร้าง URL เต็มสำหรับรูปภาพ
      const img = `${api_url}/storage/app/public/product/${slug}/${itemToEdit.image}`;
      setItemImage(itemToEdit.image ? img : null);
      setItemStatus(itemToEdit.status === 'Y');
      setEditMode(true);
      setEditIndex(id);
    } else {
      console.error('ไม่พบรายการที่ต้องการแก้ไข');
    }
  };




  // ฟังก์ชันกรองรายการอาหารตามคำค้นหาและหมวดหมู่
  const filteredItems = items.filter((item) => {
    const nameMatch = item.p_name?.toString().includes(searchQuery); // ค้นหาชื่ออาหาร
    const categoryMatch = filterCategory === '' || item.category_id === parseInt(filterCategory); // ค้นหาหมวดหมู่
    return nameMatch && categoryMatch; // ส่งคืนรายการที่ตรงตามเงื่อนไข
  });

  const availableItemsForSale = filteredItems.filter(item => item.status === 'Y'); // รายการที่มีสถานะเปิด

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
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={styles.dropdown}>
              <option value="">หมวดหมู่ (ทั้งหมด)</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.c_name}</option>
              ))}
            </select>
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
                  {filteredItems.map((item, index) => (
                    <tr key={index} style={styles.row(index)}>
                      <td style={styles.td}>{String(index + 1).padStart(4, '0')}</td>
                      <td style={styles.td}>{item.p_name || item.name}</td>
                      <td style={styles.td}>{item.price.toFixed(2)}</td>
                      <td style={styles.td}>{categories.find(cat => cat.id === item.category_id)?.c_name}</td>
                      <td style={{ ...styles.td, color: item.status === 'Y' ? 'black' : 'red' }}>{item.status === 'Y' ? "เปิด" : "ปิด"}</td> {/* แสดงสถานะและสี */}
                      <td style={styles.td}>
                        <button onClick={() => handleEditItem(item.id)} style={styles.editButton}>แก้ไข</button>
                        <button onClick={() => handleDeleteItem(item.id)} style={styles.deleteButton}>ลบ</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={styles.formContainer}>
          <h1 style={styles.title}>{editMode ? 'แก้ไขอาหาร' : 'เพิ่มอาหาร'}</h1>
          <input type="text" placeholder="ชื่อสินค้า" value={itemName} onChange={(e) => setItemName(e.target.value)} style={styles.input} />
          <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} style={styles.dropdown}>
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
  container: { display: 'flex' },
  contentContainer: { display: 'flex', flex: 1, gap: '20px', padding: '17px 0 20px 120px', fontFamily: 'Arial, sans-serif' },
  notification: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', padding: '15px 25px', color: '#fff', fontSize: '16px', borderRadius: '8px', zIndex: 1000 },
  formContainer: { flex: 1, backgroundColor: '#ffffff', borderRadius: '10px', alignItems: 'center', display: 'flex', flexDirection: 'column' },
  title: { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' },
  searchContainer: { display: 'flex', gap: '10px', marginBottom: '20px' },
  dropdown: { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', width: '300px', marginBottom: '15px' },
  searchInput: { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', flex: 1, marginBottom: '15px' },
  itemCount: { fontSize: '16px', marginBottom: '10px' },
  tableContainer: { overflowY: 'auto', overflowX: 'hidden', height: '480px', borderRadius: '8px', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', width:'1000px' },
  table: { width: '100%', borderCollapse: 'collapse', borderSpacing: '0', fontSize:'14px' },
  th: { padding: '10px 15px', backgroundColor: '#499cae', textAlign: 'left', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1, color: '#fff' },
  td: { padding: '10px 15px', borderTop: '1px solid #e0e0e0', width: '305px' },
  row: (index) => ({ backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#f0f2f0', transition: 'background-color 0.2s' }),
  input: { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', width: '280px', marginBottom: '15px' },
  fileInput: { display: 'none' },
  imageContainer: { height: '100px', border: '1px dashed #ccc', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', color: '#888' },
  button: { width: '305px', padding: '12px', borderRadius: '5px', backgroundColor: '#499cae', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  editButton: { background: 'linear-gradient(to right, #ffd700, #FFC137)', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', marginRight: '5px' },
  deleteButton: { background: 'linear-gradient(to right, #ff7f7f, #d9534f)', color: '#fff', border: 'none', padding: '5px 17px', borderRadius: '5px', cursor: 'pointer' },
  cancelButton: { width: '305px', padding: '12px', borderRadius: '5px', backgroundColor: '#d9534f', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px' },
  imageUpload: { border: '2px dashed #aaa', borderRadius: '10px', width: '280px', height: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888', marginBottom: '15px', textAlign: 'center' },
  imagePreview: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' },
  statusToggle: { display: 'flex', gap: '10px', marginBottom: '15px' },
  statusButton: { padding: '10px', borderRadius: '5px', color: '#fff', border: 'none', cursor: 'pointer', width: '150px' }
};

