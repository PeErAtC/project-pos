    import React, { useState, useEffect } from 'react';
    import axios from 'axios';
    import Sidebar from './components/backendsidebar';
    import Swal from 'sweetalert2';
    import { Snackbar, Alert } from '@mui/material';
    import { useRouter } from 'next/router'; // เพิ่มส่วนนี้
    import config from '../lib/config';  // ใช้ config ในไฟล์ที่ต้องการ
    import { FaEllipsisH, FaEdit, FaTrashAlt  } from 'react-icons/fa';


    export default function TableManagement() {
        const [tables, setTables] = useState([]);
        const [tableCode, setTableCode] = useState('');
        const [seats, setSeats] = useState(1);
        const [status, setStatus] = useState('Y');
        const [editMode, setEditMode] = useState(false);
        const [editTableId, setEditTableId] = useState(null);
        const [error, setError] = useState(null);
        const [searchQuery, setSearchQuery] = useState('');
        const [snackbarOpen, setSnackbarOpen] = useState(false);
        const [snackbarMessage, setSnackbarMessage] = useState('');
        const [snackbarSeverity, setSnackbarSeverity] = useState('success');
        const [showMenu, setShowMenu] = useState(false);  // ใช้เพื่อควบคุมการแสดงเมนู

        const router = useRouter(); // ใช้ useRouter

        useEffect(() => {
            fetchTables();
        }, []);

        const fetchTables = async () => {
            const api_url = localStorage.getItem('url_api');
            const slug = localStorage.getItem('slug');
            const authToken = localStorage.getItem('token');

            if (!api_url || !slug || !authToken) {
                
                Swal.fire({
                    title: 'กรุณาเข้าสู่ระบบ',
                    text: 'คุณยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อนใช้งาน',
                    icon: 'warning',
                    confirmButtonText: 'เข้าสู่ระบบ',
                }).then(() => {
                    router.push('/login'); // ใช้ router.push เพื่อเปลี่ยนเส้นทางไปหน้า /login
                });
                return;
            }
        
            try {
                const url = `${api_url}/${slug}/table_codes`;
                const response = await axios.get(url, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                });
                setTables(response.data);
                setError(null);
            } catch (error) {
                console.error('Error fetching tables:', error);
                if (error.response && error.response.status === 401) {
                    Swal.fire('Session หมดอายุ', 'กรุณาเข้าสู่ระบบใหม่', 'warning');
                    
                    window.location.href = '/login';
                } else {
                    setError('Failed to load tables. Please try again.');
                }
            }
            console.log(api_url, slug, authToken);  // ดูค่าที่ได้จาก localStorage
        };    

        const handleAddOrUpdateTable = async () => {
            if (!tableCode || seats < 1) {
            Swal.fire({
            icon: 'question',    
            title: 'กรุณากรอกข้อมูลให้ครบถ้วน',
            confirmButtonText: 'ตกลง',     
            });
                
                return;
            }
            if (editMode && editTableId) {
                const tableToEdit = tables.find(table => table.id === editTableId);
                if (tableToEdit && tableToEdit.table_code === 'CT001' && tableCode !== 'CT001') {
                    Swal.fire({
                        title: 'ไม่สามารถเปลี่ยนชื่อโต๊ะพิเศษได้',
                        text: 'รหัสโต๊ะ CT001 ไม่สามารถเปลี่ยนแปลงได้',
                        icon: 'error',
                        confirmButtonText: 'ตกลง',
                    });
                    return;
                }
            }
            // ตรวจสอบว่า tableCode ซ้ำหรือไม่
            const isTableCodeExist = tables.some((table) => table.table_code.toLowerCase() === tableCode.toLowerCase());
        
            // ถ้าเป็นการเพิ่มโต๊ะ และมีรหัสโต๊ะซ้ำ
            if (isTableCodeExist && !(editMode && tables.some(table => table.id === editTableId))) {
                Swal.fire('รหัสโต๊ะนี้มีอยู่แล้ว กรุณากรอกรหัสโต๊ะใหม่');
                return;
            }
        
            const tableData = { table_code: tableCode, seats, status };
        
            try {
                //////////////////// ประกาศตัวแปร URL CALL   
                const api_url = localStorage.getItem('url_api');
                const slug = localStorage.getItem('slug');
                const authToken = localStorage.getItem('token');
                //////////////////// ประกาศตัวแปร  END URL CALL 

                if (!api_url || !slug || !authToken) {

                    // ตรวจสอบการแก้ไขโต๊ะ ถ้ารหัสโต๊ะที่แก้ไขมีอยู่แล้ว จะไม่สามารถแก้ไขได้
                    const isTableCodeExistForEdit = tables.some(
                        (table) => table.table_code.toLowerCase() === tableCode.toLowerCase() && table.id !== editTableId
                    );
        
                    if (isTableCodeExistForEdit) {
                        Swal.fire('รหัสโต๊ะนี้มีอยู่แล้ว กรุณากรอกรหัสโต๊ะใหม่');
                        return;
                    }
        
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
        
                    if (!result.isConfirmed) return;
        
                    const url = `${api_url}/${slug}/table_codes/${editTableId}`;
                    await axios.put(url, tableData, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${authToken}`,
                        },
                    });
                    Swal.fire({
                        title: 'เพิ่มโต๊ะเรียบร้อยแล้ว',
                        icon: 'success',
                        confirmButtonText: 'ตกลง',   
                    });
                } else {
                    const result = await Swal.fire({
                        title: 'ยืนยันการเพิ่มโต๊ะ',
                        text: "คุณต้องการเพิ่มโต๊ะนี้หรือไม่?",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'เพิ่ม',
                        cancelButtonText: 'ยกเลิก',
                    });
        
                    if (!result.isConfirmed) return;
        
                    const url = `${api_url}/${slug}/table_codes`;
                    await axios.post(url, tableData, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${authToken}`,
                        },
                    });
                    Swal.fire({
                        title: 'เพิ่มโต๊ะเรียบร้อยแล้ว',
                        icon: 'success',
                        confirmButtonText: 'ตกลง',   
                    });
                }
                fetchTables();
                resetForm();
            } catch (error) {
                console.error('Error adding/updating table:', error);
                setSnackbarMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            }
        };      
        
        const handleDeleteTable = async (id) => {
            // ตรวจสอบว่าโต๊ะคือ CT001 หรือไม่
            const tableToDelete = tables.find(table => table.id === id);
            if (tableToDelete && tableToDelete.table_code === 'CT001') {
                Swal.fire({
                    title: 'ไม่สามารถลบโต๊ะนี้ได้',
                    text: 'โต๊ะ CT001 เป็นโต๊ะพิเศษและไม่สามารถลบได้',
                    icon: 'error',
                    confirmButtonText: 'ตกลง',
                });
                return;
            }
        
            Swal.fire({
                title: 'คุณแน่ใจหรือไม่?',
                text: "คุณต้องการลบโต๊ะนี้จริง ๆ หรือไม่",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'ลบ',
                cancelButtonText: 'ยกเลิก',
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                            // ตรวจสอบค่า api_url และ slug
                        const api_url = localStorage.getItem('url_api');
                        const slug = localStorage.getItem('slug');
                        const authToken = localStorage.getItem('token');

                        if (!api_url || !slug || !authToken) {
                            console.error('API URL, slug, or token is not defined.');
                            Swal.fire({
                                title: 'ไม่พบการตั้งค่า API',
                                text: 'กรุณาตรวจสอบข้อมูลใน localStorage หรือเข้าสู่ระบบใหม่',
                                icon: 'warning',
                                confirmButtonText: 'ตกลง',
                            });
                            return;
                        }
                        
                        const url = `${api_url}/${slug}/table_codes/${id}`;
                        await axios.delete(url, {
                            headers: {
                                'Accept': 'application/json',
                                'Authorization': `Bearer ${authToken}`,
                            },
                        });
                        Swal.fire({
                            title: 'ลบโต๊ะเรียบร้อยแล้ว',
                            icon: 'success',
                            confirmButtonText: 'ตกลง',   
                        });
                        fetchTables();
                    } catch (error) {
                        console.error('Error deleting table:', error);
                        setSnackbarMessage('เกิดข้อผิดพลาดในการลบข้อมูล');
                        setSnackbarSeverity('error');
                        setSnackbarOpen(true);
                    }
                }
            });
        };    

        const resetForm = () => {
            setTableCode('');
            setSeats(1);
            setStatus('Y');
            setEditMode(false);
            setEditTableId(null);
        };

        const handleEditTable = (table) => {
            setEditMode(true);
            setEditTableId(table.id);
            setTableCode(table.table_code);
            setSeats(table.seats);
            setStatus(table.status);
        };

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
            <div style={styles.pageContainer}>
                <Sidebar />
                <div style={styles.contentContainer}>
                    <div style={styles.listContainer}>
                        <h1 style={styles.listTitle}>รายการโต๊ะ</h1>
                        <input
                            type="text"
                            placeholder="ค้นหารหัสโต๊ะ"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={styles.searchInput}
                        />
                        <p style={styles.itemCount}>{tables.filter((table) => table.table_code.toLowerCase().includes(searchQuery.toLowerCase())).length} รายการ </p>
                        {error ? (
                            <p style={styles.errorText}>{error}</p>
                        ) : (
                            <div style={styles.tableContainer}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>รหัสโต๊ะ</th>
                                            <th style={styles.th}>จำนวนที่นั่ง</th>
                                            <th style={styles.th}>สถานะ</th>
                                            <th style={styles.thActions}>ดำเนินการ</th>
                                        </tr>
                                    </thead>
                                        <tbody>
                                        {tables
                                            .filter((table) => table.table_code.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((table, index) => (
                                                <tr
                                                    key={table.id}
                                                    style={{
                                                        ...styles.tr,
                                                        backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#f0f2f0',
                                                    }}
                                                >
                                                    <td style={styles.td}>{table.table_code}</td>
                                                    <td style={styles.td}>{table.seats}</td>
                                                    <td style={{
                                                        ...styles.td,
                                                        color: table.table_code === 'CT001' ? 'green' : table.status === 'Y' ? 'black' : 'red',
                                                        fontWeight: table.table_code === 'CT001' ? '' : 'normal',
                                                    }}>
                                                        {table.table_code === 'CT001' ? 'พิเศษ' : table.status === 'Y' ? 'เปิด' : 'ปิด'}
                                                    </td>

                                                    <td style={styles.tdActions}>
                                                    <button onClick={() => handleMenuToggle(table.id)} style={{ ...styles.menuButton }}><FaEllipsisH size={20} /></button>

                                                    {showMenu === table.id && (
                                                        <div style={styles.menu}>
                                                        <button onClick={() => handleEditTable(table)} style={styles.menuItemEdit}>
                                                            <FaEdit size={16} /> แก้ไข
                                                        </button>
                                                        <button onClick={() => handleDeleteTable(table.id)} style={styles.menuItemDelete}>
                                                            <FaTrashAlt size={16} /> ลบ
                                                        </button>
                                                        </div>
                                                    )}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div style={styles.formContainer}>
                        <h1 style={styles.title}>{editMode ? 'แก้ไขโต๊ะ' : 'เพิ่มโต๊ะ'}</h1>
                        <input
                            type="text"
                            placeholder="รหัสโต๊ะ"
                            value={tableCode}
                            onChange={(e) => setTableCode(e.target.value)}
                            style={styles.input}
                        />
                        <input
                            type="number"
                            placeholder="จำนวนที่นั่ง"
                            value={seats}
                            onChange={(e) => setSeats(Number(e.target.value))}
                            style={styles.input}
                        />
                        <h3 style={{ margin: '10px 0' }}>สถานะโต๊ะ</h3>
                        <div style={styles.statusToggleContainer}>
                            <button
                                onClick={() => setStatus('Y')}
                                style={{ ...styles.statusButton, backgroundColor: status === 'Y' ? '#499cae' : '#ccc' }}
                            >
                                เปิด
                            </button>
                            <button
                                onClick={() => setStatus('N')}
                                style={{ ...styles.statusButton, backgroundColor: status === 'N' ? '#d9534f' : '#ccc' }}
                            >
                                ปิด
                            </button>
                        </div>
                        <button onClick={handleAddOrUpdateTable} style={styles.button}>{editMode ? 'บันทึกการแก้ไข' : 'บันทึก'}</button>
                        {editMode && <button onClick={resetForm} style={styles.cancelButton}>ยกเลิก</button>}
                    </div>
                </div>

                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={3000}
                    onClose={() => setSnackbarOpen(false)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </div>
        );
    }
const styles = {
    pageContainer: { display: 'flex', minHeight: '10vh', backgroundColor: '#fff' },
    contentContainer: { display: 'flex', flexDirection: 'row', gap: '20px', padding: '20px', justifyContent: 'space-between', alignItems: 'flex-start', fontFamily: 'Arial, sans-serif', width: 'calc(100% - 100px)', marginLeft: '100px' },
    listContainer: { flex: 6, backgroundColor: '#ffffff', padding: '10px', borderRadius: '8px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', height: 'calc(90vh - 40px)' },
    formContainer: { flex: 3, backgroundColor: '#ffffff', padding: '10px', borderRadius: '8px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', textAlign: 'center', height: 'calc(90vh - 40px)' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#000', marginBottom: '20px' },
    input: { padding: '12px', marginBottom: '15px', width: '320px', borderRadius: '5px', border: '1px solid #ccc' },
    searchInput: { padding: '12px', marginBottom: '15px', width: '900px', borderRadius: '5px', border: '1px solid #ccc' },
    itemCount: { fontSize: '16px', marginBottom: '15px', color: '#000' },
    select: { padding: '12px', marginBottom: '15px', width: '320px', borderRadius: '5px', border: '1px solid #ccc' },
    button: { width: '340px', padding: '12px', borderRadius: '5px', backgroundColor: '#499cae', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginBottom: '15px' },
    cancelButton: { width: '340px', padding: '12px', borderRadius: '5px', background: 'linear-gradient(to right, #ff7f7f, #d9534f)', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
    listTitle: { fontSize: '24px', fontWeight: 'bold', color: '#000', marginBottom: '20px', textAlign: 'center', marginRight: '800px' },
    tableContainer: { overflowY: 'auto', maxHeight: 'calc(78vh - 120px)', borderRadius: '8px', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
    th: { padding: '10px 25px', backgroundColor: '#499cae', textAlign: 'left', fontWeight: 'bold', color: '#fff', position: 'sticky', top: 1 },
    thActions: { padding: '10px 25px', backgroundColor: '#499cae', textAlign: 'center', fontWeight: 'bold', color: '#fff', position: 'sticky', top: 1 },
    tr: { transition: 'background-color 0.2s' },
    td: { padding: '10px 25px', textAlign: 'left' },
    tdActions: { padding: '10px 25px', textAlign: 'center' },
    menuButton: { color: '#333', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', display: 'inline-block' },
    menu: { display: 'inline', flexDirection: 'row', alignItems: 'center', marginLeft: '10px' },
    menuItemEdit: { background: 'linear-gradient(to right, #ffd700, #FFC137)', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', marginRight: '5px' },
    menuItemDelete: { background: 'linear-gradient(to right, #ff7f7f, #d9534f)', color: '#fff', border: 'none', padding: '5px 17px', borderRadius: '5px', cursor: 'pointer' },
    errorText: { color: 'red', fontWeight: 'bold' },
    statusToggleContainer: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' },
    statusButton: { padding: '10px 73px', borderRadius: '5px', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }
};
