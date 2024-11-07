import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from './components/backendsidebar';
import { FaCheckCircle, FaExclamationCircle, FaImage } from 'react-icons/fa';
import Swal from 'sweetalert2';

export default function BackendPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemColor, setItemColor] = useState('');
  const [itemImage, setItemImage] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [notification, setNotification] = useState(null);

  const axiosConfig = {
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
    },
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('https://easyapp.clinic/pos-api/api/products', axiosConfig);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://easyapp.clinic/pos-api/api/category', axiosConfig);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddOrUpdateItem = async () => {
    if (!itemName || !itemPrice) {
      showNotification("กรุณากรอกข้อมูลให้ครบถ้วน", 'error');
      return;
    }
  
    // Confirm before saving or updating
    Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: editMode ? "คุณต้องการบันทึกการแก้ไขนี้ใช่หรือไม่" : "คุณต้องการบันทึกข้อมูลนี้ใช่หรือไม่",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
    }).then(async (result) => {
      if (result.isConfirmed) {
        const formData = new FormData();
        formData.append('p_name', itemName);
        formData.append('price', itemPrice || 0);
        formData.append('category_id', itemCategory);
        formData.append('color', itemColor);
        if (itemImage instanceof File) formData.append('image', itemImage);
  
        try {
          if (editMode && editIndex !== null) {
            const itemId = items[editIndex]?.id;
            if (itemId) {
              await axios.put(`https://easyapp.clinic/pos-api/api/products/${itemId}`, formData, axiosConfig);
              Swal.fire({
                icon: 'success',
                title: 'บันทึกการแก้ไขสำเร็จ',
                text: 'การบันทึกการแก้ไขดำเนินการเรียบร้อยแล้ว!',
                confirmButtonText: 'ตกลง',
              });
            }
          } else {
            await axios.post('https://easyapp.clinic/pos-api/api/products', formData, axiosConfig);
            Swal.fire({
              icon: 'success',
              title: 'บันทึกสำเร็จ',
              text: 'การบันทึกข้อมูลดำเนินการเรียบร้อยแล้ว!',
              confirmButtonText: 'ตกลง',
            });
          }
          await fetchItems(); // Refresh items after adding/updating
          resetForm();
        } catch (error) {
          console.error("Error while adding/updating item:", error);
          showNotification("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองอีกครั้ง", 'error');
        }
      }
    });
  };
  

  const resetForm = () => {
    setItemName('');
    setItemCategory('');
    setItemPrice('');
    setItemColor('');
    setItemImage(null);
    setEditMode(false);
    setEditIndex(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setItemImage(file);
    }
  };

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
          await axios.delete(`https://easyapp.clinic/pos-api/api/products/${id}`, axiosConfig);
          showNotification("ลบข้อมูลเรียบร้อยแล้ว!", 'success');
          fetchItems();
        } catch (error) {
          console.error("Error:", error);
          showNotification(`เกิดข้อผิดพลาด: ${JSON.stringify(error.response?.data || 'Unknown error')}`, 'error');
        }
      }
    });
  };

  const handleEditItem = (index) => {
    const itemToEdit = items[index];
    setItemName(itemToEdit.p_name || itemToEdit.name || '');
    setItemCategory(itemToEdit.category_id ? itemToEdit.category_id.toString() : '');
    setItemPrice(itemToEdit.price || '');
    setItemColor(itemToEdit.color || '');

    if (itemToEdit.image) {
      setItemImage(`https://easyapp.clinic/pos-api/storage/app/public/product/${itemToEdit.image}`);
    } else {
      setItemImage(null);
    }

    setEditMode(true);
    setEditIndex(index);
  };

  const filteredItems = items.filter((item) => {
    const nameMatch = item.p_name?.toString().includes(searchQuery);
    const categoryMatch = filterCategory === '' || item.category_id === parseInt(filterCategory);
    return nameMatch && categoryMatch;
  });

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

        {/* Render the items list with filter and search options */}
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
                    <th style={styles.th}>ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => (
                    <tr key={index} style={styles.row(index)}>
                      <td style={styles.td}>{item.id}</td>
                      <td style={styles.td}>{item.p_name || item.name}</td>
                      <td style={styles.td}>{item.price.toFixed(2)}</td>
                      <td style={styles.td}>{categories.find(cat => cat.id === item.category_id)?.c_name}</td>
                      <td style={styles.td}>
                        <button onClick={() => handleEditItem(index)} style={styles.editButton}> แก้ไข</button>
                        <button onClick={() => handleDeleteItem(item.id)} style={styles.deleteButton}>ลบ</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form to add/edit item */}
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
                <FaImage size={40} color="#aaa" />
                <p>ใส่รูปภาพอาหาร</p>
              </>
            )}
            <input id="file-upload" type="file" onChange={handleImageChange} style={styles.fileInput} />
          </label>

          <input type="number" placeholder="ราคา" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} style={styles.input} />
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
  formContainer: { flex: 1, backgroundColor: '#ffffff', borderRadius: '10px', alignItems: 'center',display: 'flex', flexDirection: 'column' },
  title: { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' },
  searchContainer: { display: 'flex', gap: '10px', marginBottom: '20px' },
  dropdown: { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', width: '300px', marginBottom: '15px' },
  searchInput: { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', flex: 1, marginBottom: '15px' },
  itemCount: { fontSize: '16px', marginBottom: '10px' },
  tableContainer: { overflowY: 'auto', overflowX: 'hidden', height: '455px', borderRadius: '8px', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', width:'1000px' },
  table: { width: '100%', borderCollapse: 'collapse', borderSpacing: '0', fontSize:'14px' },
  th: { padding: '10px 15px', backgroundColor: '#499cae', textAlign: 'left', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1, color: '#fff' },
  td: { padding: '10px 15px', borderTop: '1px solid #e0e0e0' },
  row: (index) => ({ backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#f0f2f0', transition: 'background-color 0.2s' }),
  input: { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', width: '280px', marginBottom: '15px' },
  fileInput: { display: 'none' },
  imageContainer: { height: '100px', border: '1px dashed #ccc', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', color: '#888' },
  button: { width: '85%', padding: '12px', borderRadius: '5px', backgroundColor: '#499cae', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  editButton: { background: 'linear-gradient(to right, #ffd700, #ff8c00)', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', marginRight: '5px' },
  deleteButton: { background: 'linear-gradient(to right, #ff7f7f, #ff0000)', color: '#fff', border: 'none', padding: '5px 17px', borderRadius: '5px', cursor: 'pointer' },
  cancelButton: { width: '85%', padding: '12px', borderRadius: '5px', backgroundColor: '#ff5252', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px' },
  imageUpload: { border: '2px dashed #aaa', borderRadius: '10px', width: '280px', height: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888', marginBottom: '15px', textAlign: 'center' },
  imagePreview: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' },
};
