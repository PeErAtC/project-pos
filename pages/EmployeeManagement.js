import { useState } from 'react';
import { useRouter } from 'next/router';
import BackendSidebar from './components/backendsidebar';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Swal from 'sweetalert2'; // Add SweetAlert2 library

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]); // Initial employee list
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    slug: '',
    owner: 'N',
    status: 'active',
  });
  const [editIndex, setEditIndex] = useState(null); // To track editing employee
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const router = useRouter();

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add or Update Employee with confirmation
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editIndex !== null) {
      // Confirm Update
      Swal.fire({
        title: 'คุณแน่ใจหรือไม่?',
        text: 'คุณต้องการบันทึกการแก้ไขข้อมูลพนักงานนี้หรือไม่?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'บันทึก',
        cancelButtonText: 'ยกเลิก',
      }).then((result) => {
        if (result.isConfirmed) {
          const updatedEmployees = [...employees];
          updatedEmployees[editIndex] = formData;
          setEmployees(updatedEmployees);
          setEditIndex(null);
          Swal.fire('แก้ไขสำเร็จ!', 'ข้อมูลพนักงานถูกแก้ไขเรียบร้อยแล้ว', 'success');
        }
      });
    } else {
      // Confirm Add
      Swal.fire({
        title: 'คุณแน่ใจหรือไม่?',
        text: 'คุณต้องการเพิ่มพนักงานใหม่หรือไม่?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'เพิ่ม',
        cancelButtonText: 'ยกเลิก',
      }).then((result) => {
        if (result.isConfirmed) {
          setEmployees([...employees, formData]);
          Swal.fire('เพิ่มสำเร็จ!', 'พนักงานใหม่ถูกเพิ่มเรียบร้อยแล้ว', 'success');
        }
      });
    }
    setFormData({ username: '', name: '', email: '', password: '', slug: '', owner: 'N', status: 'active' });
  };

  // Edit Employee
  const handleEdit = (index) => {
    setFormData(employees[index]);
    setEditIndex(index);
    Swal.fire('โหมดแก้ไข', 'คุณกำลังแก้ไขข้อมูลพนักงาน', 'info');
  };

  // Delete Employee with confirmation dialog
  const handleDelete = (index) => {
    Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: 'คุณต้องการลบพนักงานคนนี้จริง ๆ หรือไม่',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedEmployees = employees.filter((_, i) => i !== index);
        setEmployees(updatedEmployees);
        Swal.fire('ลบสำเร็จ!', 'ข้อมูลพนักงานถูกลบเรียบร้อยแล้ว', 'success');
      }
    });
  };

  const handleStatusChange = (status) => {
    setFormData({ ...formData, status });
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <BackendSidebar />

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.tableSection}>
          <h2 style={styles.titleLeft}>รายชื่อพนักงาน</h2>
          <input
            type="text"
            placeholder="ค้นหาพนักงาน"
            style={styles.searchInput}
          />
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Username</th>
                <th style={styles.tableHeader}>ชื่อ</th>
                <th style={styles.tableHeader}>อีเมล</th>
                <th style={styles.tableHeader}>Slug</th>
                <th style={styles.tableHeader}>Owner</th>
                <th style={styles.tableHeader}>สถานะ</th>
                <th style={styles.tableHeader}>ดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="7" style={styles.noData}>ยังไม่มีพนักงานในระบบ</td>
                </tr>
              ) : (
                employees.map((employee, index) => (
                  <tr key={index} style={styles.tableRow}>
                    <td style={styles.tableCell}>{employee.username}</td>
                    <td style={styles.tableCell}>{employee.name}</td>
                    <td style={styles.tableCell}>{employee.email}</td>
                    <td style={styles.tableCell}>{employee.slug}</td>
                    <td style={styles.tableCell}>{employee.owner}</td>
                    <td style={employee.status === 'active' ? styles.activeStatus : styles.inactiveStatus}>
                      {employee.status === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </td>
                    <td style={styles.tableCell}>
                      <button onClick={() => handleEdit(index)} style={styles.editButton}>แก้ไข</button>
                      <button onClick={() => handleDelete(index)} style={styles.deleteButton}>ลบ</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
              onChange={handleInputChange}
              required
              style={styles.input}
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
            <p style={styles.statusTitle}>สถานะพนักงาน</p>
            <div style={styles.statusButtonsRow}>
              <button
                type="button"
                onClick={() => handleStatusChange('active')}
                style={formData.status === 'active' ? styles.activeButton : styles.inactiveButton}
              >
                เปิด
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('inactive')}
                style={formData.status === 'inactive' ? { ...styles.inactiveButton, backgroundColor: '#ff6b6b', color: '#fff' } : styles.inactiveButton}
              >
                ปิด
              </button>
            </div>
            <button type="submit" style={styles.button}>
              {editIndex !== null ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน'}
            </button>
            {editIndex !== null && (
              <button
                type="button"
                onClick={() => {
                  setFormData({ username: '', name: '', email: '', password: '', slug: '', owner: 'N', status: 'active' });
                  setEditIndex(null);
                  Swal.fire('ยกเลิกสำเร็จ!', 'การแก้ไขถูกยกเลิกเรียบร้อยแล้ว', 'info');
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
    container: { display: 'flex', flexDirection: 'row', height: '100vh', fontFamily: '"Kanit", sans-serif', backgroundColor: '#f9f9f9' },
    mainContent: { width: 'calc(100% - 100px)', marginLeft: '100px', display: 'flex', flexDirection: 'row', gap: '20px', padding: '20px', backgroundColor: '#ffffff' },
    tableSection: { width: '80%', backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)' },
    formSection: { width: '40%', backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)' },
    title: { textAlign: 'center', marginBottom: '20px', fontSize: '24px', fontWeight: 'bold', color: '#333333' },
    titleLeft: { textAlign: 'left', marginBottom: '20px', fontSize: '24px', fontWeight: 'bold', color: '#333333' },
    searchInput: { width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHeader: { borderBottom: '2px solid #ddd', padding: '10px', textAlign: 'center', backgroundColor: '#499cae', fontWeight: 'bold', color: '#ffffff' },
    tableRow: { textAlign: 'center' },
    tableCell: { borderBottom: '1px solid #ddd', padding: '10px', textAlign: 'center', fontSize: '14px', color: '#555555' },
    activeStatus: { borderBottom: '1px solid #ddd', padding: '10px', textAlign: 'center', fontSize: '14px', color: '#28a745' },
    inactiveStatus: { borderBottom: '1px solid #ddd', padding: '10px', textAlign: 'center', fontSize: '14px', color: '#dc3545' },
    noData: { textAlign: 'center', padding: '20px', color: '#999999', fontStyle: 'italic' },
    form: { display: 'flex', flexDirection: 'column', gap: '10px' },
    input: { padding: '10px', fontSize: '15px', borderRadius: '5px', border: '1px solid #ddd', width: '80%', margin: '0 auto' },
    passwordContainer: { position: 'relative', display: 'flex', alignItems: 'center', width: '90%', margin: '0 auto' },
    passwordToggle: { position: 'absolute', right: '30px', cursor: 'pointer', color: '#555555' },
    button: { padding: '10px', fontSize: '16px', backgroundColor: '#499cae', color: '#ffffff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', width: '80%', margin: '0 auto' },
    cancelButton: { padding: '10px', fontSize: '16px', backgroundColor: '#ff6b6b', color: '#ffffff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px', width: '80%', margin: '0 auto' },
    activeButton: { backgroundColor: '#499cae', color: '#fff', padding: '10px', width: '100%', border: 'none', borderRadius: '5px', cursor: 'pointer', textAlign: 'center' },
    inactiveButton: { backgroundColor: '#ddd', color: '#888', padding: '10px', width: '100%', border: 'none', borderRadius: '5px', cursor: 'pointer', textAlign: 'center' },
    statusButtonsRow: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '80%', margin: '0 auto', gap: '10px', marginBottom: '20px' },
    statusTitle: { marginBottom: '10px', fontWeight: 'bold', color: '#333333', textAlign: 'center' },
    editButton: { padding: '5px 10px', backgroundColor: '#FFC137', color: '#ffffff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '5px', fontWeight: 'bold' },
    deleteButton: { padding: '5px 15px', backgroundColor: '#ff6b6b', color: '#ffffff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  };
  
