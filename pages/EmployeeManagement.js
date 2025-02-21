import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import BackendSidebar from './components/backendsidebar';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { FaCheckCircle, FaExclamationCircle, FaImage, FaPlusCircle, FaEllipsisH, FaEdit, FaTrashAlt  } from 'react-icons/fa';
import config from '../lib/config';  // ใช้ config ในไฟล์ที่ต้องการ


export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    slug: '',
    owner: 'N',
    status: 'active',
  });
  const [editIndex, setEditIndex] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);  // ใช้เพื่อควบคุมการแสดงเมนู

  useEffect(() => {
    const slug = localStorage.getItem('slug');
    setFormData((prevFormData) => ({
      ...prevFormData,
      slug: slug || '',  // ตั้งค่า slug หรือจะเป็นค่าว่างถ้าไม่มี
    }));

    const fetchEmployees = async () => {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        Swal.fire({
          title: 'กรุณาเข้าสู่ระบบ',
          text: 'คุณยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อนใช้งาน',
          icon: 'warning',
          confirmButtonText: 'เข้าสู่ระบบ',
        }).then(() => {
          router.push('/login');
        });
        return;
      }

      try {
        const api_url = localStorage.getItem('url_api');
        const slug = localStorage.getItem('slug');
        console.log(formData.slug); // ตรวจสอบค่า slug

        const response = await fetch(`${api_url}/${slug}/users`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setEmployees(data);
      } catch (error) {
        console.error('Error fetching employees:', error);
        Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
      }
    };

    fetchEmployees();
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ตรวจสอบว่ามี slug และข้อมูลที่จำเป็นหรือไม่
    if (!formData.slug) {
        Swal.fire('ข้อผิดพลาด', 'กรุณากรอกค่า slug', 'error');
        return;
    }

    try {
        const authToken = localStorage.getItem('token');
        const api_url = localStorage.getItem('url_api');
        const slug = localStorage.getItem('slug');

        const url =
            editIndex !== null
                ? `${api_url}/${slug}/users/${employees[editIndex].id}` // ใช้ PUT ในกรณีแก้ไข
                : `${api_url}/${slug}/users`; // ใช้ POST ในกรณีเพิ่มพนักงาน

        const method = editIndex !== null ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(formData), // ส่งข้อมูล formData รวมถึงสถานะ
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            throw new Error(`Error: ${response.status} - ${errorDetails.message}`);
        }

        const result = await response.json();
        if (editIndex !== null) {
            const updatedEmployees = [...employees];
            updatedEmployees[editIndex] = result;
            setEmployees(updatedEmployees);
        } else {
            setEmployees([...employees, result]);
        }

        Swal.fire('สำเร็จ!', 'การดำเนินการเสร็จสมบูรณ์', 'success');
        setEditIndex(null);
        setFormData({
            username: '',
            name: '',
            email: '',
            password: '',
            slug: '',
            owner: 'N',
            status: 'active', // รีเซ็ตสถานะหลังจากการบันทึก
        });
    } catch (error) {
        Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
    }
};

  const handleDelete = async (index) => {
    Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: 'คุณต้องการลบพนักงานคนนี้จริง ๆ หรือไม่',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const authToken = localStorage.getItem('token');
          const api_url = localStorage.getItem('url_api');
          const slug = localStorage.getItem('slug');

          const response = await fetch(`${api_url}/${slug}/users/${employees[index].id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });

          if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
          }
          const updatedEmployees = employees.filter((_, i) => i !== index);
          setEmployees(updatedEmployees);
          Swal.fire('ลบสำเร็จ!', 'ข้อมูลพนักงานถูกลบเรียบร้อยแล้ว', 'success');
        } catch (error) {
          Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
        }
      }
    });
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setFormData(employees[index]);
  };

  const handleStatusChange = (status) => {
    setFormData({ ...formData, status }); // อัปเดตสถานะใน formData
};


  const filteredEmployees = employees.filter((employee) =>
    employee.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const handleMenuToggle = (index) => {
    setShowMenu(prevState => prevState === index ? null : index);  // Toggle เมนูสำหรับแต่ละรายการ
  

  const handleEditItem = (id) => {
    console.log("Editing item", id);
    // การทำงานเมื่อคลิกปุ่มแก้ไข
  };

  const handleDeleteItem = (id) => {
    console.log("Deleting item", id);
    // การทำงานเมื่อคลิกปุ่มลบ
  }};

  return (
    <div style={styles.container}>
      <BackendSidebar />
      <div style={styles.mainContent}>
        <div style={styles.tableSection}>
          <h2 style={styles.titleLeft}>รายชื่อพนักงาน</h2>
          <input
            type="text"
            placeholder="ค้นหาพนักงาน"
            value={searchQuery} // Bind input value to searchQuery state
            onChange={(e) => setSearchQuery(e.target.value)} // Update searchQuery state on input change
            style={styles.searchInput}
          />
          <p style={styles.summaryText}> {filteredEmployees.length} จำนวนพนักงานทั้งหมด</p>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead style={styles.stickyHeader}>
                <tr>
                  <th style={styles.tableHeader}>Username</th>
                  <th style={styles.tableHeader}>ชื่อ</th>
                  <th style={styles.tableHeader}>อีเมล</th>
                  <th style={styles.tableHeader}>Owner</th>
                  <th style={styles.tableHeader}>ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={styles.noData}>ไม่พบพนักงานที่ตรงกับการค้นหา</td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee, index) => (
                    <tr
                      key={index}
                      style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}
                    >
                      <td style={styles.tableCellNoBorder}>{employee.username}</td>
                      <td style={styles.tableCellNoBorder}>{employee.name}</td>
                      <td style={styles.tableCellNoBorder}>{employee.email}</td>
                      <td style={styles.tableCellNoBorder}>{employee.owner}</td>

                          <td style={styles.tableCellNoBorder}>
                          <button onClick={() => handleMenuToggle(index)} style={styles.menuButton}>
                            <FaEllipsisH size={20} />
                          </button>
                          {showMenu === index && (
                            <div style={styles.menu}>
                              <button onClick={() => handleEdit(index)} style={styles.menuItemEdit}>
                                <FaEdit size={16} /> แก้ไข
                              </button>
                              <button onClick={() => handleDelete(index)} style={styles.menuItemDelete}>
                                <FaTrashAlt size={16} /> ลบ
                              </button>
                            </div>
                          )}
                        </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={styles.formSection}>
          <h2 style={styles.title}>{editIndex !== null ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงาน'}</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                required
                style={styles.input}
            />
            <input
                type="text"
                name="name"
                placeholder="ชื่อพนักงาน"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={styles.input}
            />
            <input
                type="email"
                name="email"
                placeholder="อีเมล"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={styles.input}
            />
            <input
                type="text"
                name="slug"
                placeholder="Slug"
                value={formData.slug}
                readOnly
                style={styles.inputReadOnly}
            />
            <div style={styles.passwordContainer}>
                <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="รหัสผ่าน"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    style={{ ...styles.input, paddingRight: '40px' }}
                />
                <span
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
            </div>

            {/* เพิ่มช่องกรอกยืนยันรหัสผ่าน */}
            <div style={styles.passwordContainer}>
                <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="ยืนยันรหัสผ่าน"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    style={{ ...styles.input, paddingRight: '40px' }}
                />
            </div>

            {/* แสดงข้อความเตือนหากรหัสผ่านไม่ตรงกัน */}
            {formData.password !== formData.confirmPassword && formData.confirmPassword && (
                <p style={{ color: 'red', textAlign: 'center'}}>รหัสผ่านไม่ตรงกัน</p>
            )}

            <button type="submit" style={styles.button}>
                {editIndex !== null ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน'}
            </button>

            {editIndex !== null && (
                <button
                    type="button"
                    onClick={() => {
                        setFormData({ username: '', name: '', email: '', password: '', slug: '', owner: 'N', status: 'active' });
                        setEditIndex(null);
                    }}
                    style={styles.cancelButton}
                >
                    ยกเลิก
                </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'row', height: '92vh', fontFamily: 'Kanit, sans-serif', backgroundColor: '#fff' },
  mainContent: { width: 'calc(100% - 100px)', marginLeft: '110px', display: 'flex', flexDirection: 'row', gap: '20px', padding: '10px', backgroundColor: '#ffffff' },
  tableSection: { width: '80%', backgroundColor: '#ffffff', padding: '15px', borderRadius: '10px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)' },
  tableContainer: { maxHeight: '400px', overflowY: 'scroll', border: '1px solid #ddd', borderRadius: '5px' },
  stickyHeader: { position: 'sticky', top: 0, backgroundColor: '#499cae', zIndex: 1 },
  formSection: { width: '40%', backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)' },
  title: { textAlign: 'center', marginBottom: '20px', fontSize: '24px', fontWeight: 'bold', color: '#000' },
  titleLeft: { textAlign: 'left', marginBottom: '20px', fontSize: '24px', fontWeight: 'bold', color: '#000' },
  searchInput: { width: '97%', padding: '10px', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { padding: '10px', textAlign: 'center', backgroundColor: '#499cae', color: '#ffffff', fontSize: '14px' },
  tableRowEven: { textAlign: 'center', backgroundColor: '#f9f9f9' },
  tableRowOdd: { textAlign: 'center', backgroundColor: '#ffffff' },
  tableCellNoBorder: { padding: '10px', textAlign: 'center', fontSize: '14px', color: '#000' },
  activeStatus: { padding: '10px', textAlign: 'center', fontSize: '14px', color: '#28a745' },
  inactiveStatus: { padding: '10px', textAlign: 'center', fontSize: '14px', color: '#dc3545' },
  noData: { textAlign: 'center', padding: '20px', color: '#999999', fontStyle: 'italic' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  menuButton: { color:'#333', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', display: 'inline-block' },
  menu: { display: 'inline', flexDirection: 'row', alignItems: 'center', marginLeft:'10px' },
  menuItemEdit: { background: 'linear-gradient(to right, #ffd700, #FFC137)', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', marginRight: '5px' },
  menuItemDelete: { background: 'linear-gradient(to right, #ff7f7f, #d9534f)', color: '#fff', border: 'none', padding: '5px 17px', borderRadius: '5px', cursor: 'pointer' },
  input: { padding: '10px', fontSize: '15px', borderRadius: '5px', border: '1px solid #ddd', width: '80%', margin: '0 auto' },
  inputReadOnly: { padding: '10px', fontSize: '15px', borderRadius: '5px', border: '1px solid #ddd', width: '80%', margin: '0 auto', backgroundColor: '#e0e0e0', pointerEvents: 'none', color: '#999' },
  passwordContainer: { position: 'relative', display: 'flex', alignItems: 'center', width: '90%', margin: '0 auto' },
  passwordToggle: { position: 'absolute', right: '30px', cursor: 'pointer', color: '#555555' },
  button: { padding: '10px', fontSize: '16px', backgroundColor: '#499cae', color: '#ffffff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', width: '83%', margin: '0 auto', },
  cancelButton: { padding: '10px', fontSize: '16px', backgroundColor: '#ff6b6b', color: '#ffffff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px', width: '80%', margin: '0 auto' },
  activeButton: { backgroundColor: '#499cae', color: '#fff', padding: '10px', width: '100%', border: 'none', borderRadius: '5px', cursor: 'pointer', textAlign: 'center' },
  inactiveButton: { backgroundColor: '#ddd', color: '#888', padding: '10px', width: '100%', border: 'none', borderRadius: '5px', cursor: 'pointer', textAlign: 'center' },
  statusButtonsRow: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '80%', margin: '0 auto', gap: '10px', marginBottom: '20px' },
  statusTitle: { marginBottom: '10px', fontWeight: 'bold', color: '#000', textAlign: 'center' },
  editButton: { padding: '5px 10px', background: 'linear-gradient(to right, #ffd700, #FFC137)', color: '#ffffff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '5px', fontWeight: 'bold' },
  deleteButton: { padding: '5px 15px', background: 'linear-gradient(to right, #ff7f7f, #d9534f)', color: '#ffffff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  summaryText: { fontSize: '16px', marginBottom: '10px', color: '#000', textAlign: 'left' }
};

