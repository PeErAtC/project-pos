import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/backendsideber'; // ตรวจสอบให้แน่ใจว่าเส้นทางนี้ถูกต้อง
import { FaEdit, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';

const api_url = "https://easyapp.clinic/pos-api/api";
const slug = "abc";

const TableManagement = () => {
    const [tables, setTables] = useState([]);
    const [tableCode, setTableCode] = useState('');
    const [seats, setSeats] = useState(1);
    const [status, setStatus] = useState('Y');
    const [editMode, setEditMode] = useState(false);
    const [editTableId, setEditTableId] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const url = `${api_url}/${slug}/table_codes`;
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
                },
            });
    
            // ตรวจสอบว่าการตอบสนองเป็น JSON ที่ถูกต้องและไม่ว่างเปล่า
            if (response && response.data) {
                if (Array.isArray(response.data)) {
                    setTables(response.data);
                    setError(null);
                } else {
                    throw new Error('ข้อมูลที่ตอบกลับไม่อยู่ในรูปแบบที่คาดหวัง');
                }
            } else {
                throw new Error('การตอบกลับจากเซิร์ฟเวอร์ว่างเปล่า');
            }
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูลโต๊ะ:', error.message);
    
            if (error.response) {
                console.error('รายละเอียดข้อผิดพลาดจากเซิร์ฟเวอร์:', error.response.data);
                setError('ไม่สามารถโหลดข้อมูลโต๊ะได้ กรุณาลองใหม่อีกครั้ง');
            } else if (error.request) {
                console.error('ไม่มีการตอบกลับจากเซิร์ฟเวอร์:', error.request);
                setError('ไม่สามารถติดต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่');
            } else {
                console.error('ข้อผิดพลาดในการตั้งค่าคำขอ:', error.message);
                setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
            }
    
            setTables([]); // เคลียร์ข้อมูลเดิม
        }
    };
    

    const handleAddOrUpdateTable = async () => {
        if (!tableCode || seats < 1) {
            Swal.fire('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        const tableData = { table_code: tableCode, seats, status };

        try {
            if (editMode && editTableId) {
                const url = `${api_url}/${slug}/table_codes/${editTableId}`;
                await axios.put(url, tableData, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
                    },
                });
                Swal.fire('แก้ไขข้อมูลเรียบร้อยแล้ว');
            } else {
                const url = `${api_url}/${slug}/table_codes`;
                await axios.post(url, tableData, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
                    },
                });
                Swal.fire('เพิ่มโต๊ะเรียบร้อยแล้ว');
            }
            fetchTables();
            resetForm();
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการเพิ่ม/แก้ไขโต๊ะ:', error);
            Swal.fire('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

    const handleEditTable = (table) => {
        setTableCode(table.table_code);
        setSeats(table.seats);
        setStatus(table.status);
        setEditMode(true);
        setEditTableId(table.id);
    };

    const handleDeleteTable = async (id) => {
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
                    const url = `${api_url}/${slug}/table_codes/${id}`;
                    await axios.delete(url, {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': 'Bearer R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH',
                        },
                    });
                    Swal.fire('ลบโต๊ะเรียบร้อยแล้ว');
                    fetchTables();
                } catch (error) {
                    console.error('เกิดข้อผิดพลาดในการลบโต๊ะ:', error);
                    Swal.fire('เกิดข้อผิดพลาดในการลบข้อมูล');
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

    return (
        <div style={styles.pageContainer}>
            <Sidebar />
            <div style={styles.contentContainer}>
                <div style={styles.listContainer}>
                    <h1 style={styles.listTitle}>รายการโต๊ะ</h1>
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
                                        <th style={styles.th}>ดำเนินการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tables.map((table) => (
                                        <tr key={table.id} style={styles.tr}>
                                            <td style={styles.td}>{table.table_code}</td>
                                            <td style={styles.td}>{table.seats}</td>
                                            <td style={{ ...styles.td, color: table.status === 'Y' ? 'green' : 'red' }}>
                                                {table.status === 'Y' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                            </td>
                                            <td style={styles.tdActions}>
                                                <button onClick={() => handleEditTable(table)} style={styles.editButton}><FaEdit /> แก้ไข</button>
                                                <button onClick={() => handleDeleteTable(table.id)} style={styles.deleteButton}><FaTrash /> ลบ</button>
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
        </div>
    );
};

export default TableManagement;

const styles = {
    pageContainer: { display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f8' },
    contentContainer: { display: 'flex', flexDirection: 'row', gap: '20px', padding: '20px', justifyContent: 'space-between', alignItems: 'flex-start', fontFamily: 'Arial, sans-serif', width: 'calc(100% - 250px)', marginLeft: '100px' },
    listContainer: { flex: 6, backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)' },
    formContainer: { flex: 2, backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', textAlign: 'center' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '20px' },
    input: { padding: '12px', marginBottom: '15px', width: '100%', borderRadius: '5px', border: '1px solid #ccc' },
    button: { width: '100%', padding: '12px', borderRadius: '5px', backgroundColor: '#499cae', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginBottom: '15px' },
    cancelButton: { width: '100%', padding: '12px', borderRadius: '5px', backgroundColor: '#d9534f', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
    listTitle: { fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '20px', textAlign: 'center' },
    tableContainer: { overflowY: 'auto', maxHeight: '500px', borderRadius: '8px', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '12px 15px', backgroundColor: '#499cae', textAlign: 'left', fontWeight: 'bold', color: '#fff', position: 'sticky', top: 0 },
    tr: { transition: 'background-color 0.2s' },
    td: { padding: '12px 15px', borderTop: '1px solid #e0e0e0' },
    tdActions: { display: 'flex', gap: '10px', padding: '10px', justifyContent: 'center' },
    editButton: { backgroundColor: '#ffc107', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    deleteButton: { backgroundColor: '#d9534f', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    errorText: { color: 'red', fontWeight: 'bold' },
    statusToggleContainer: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' },
    statusButton: { padding: '10px 20px', borderRadius: '5px', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }
};
