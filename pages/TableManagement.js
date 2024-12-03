import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/backendsidebar';
import Swal from 'sweetalert2';
import { Snackbar, Alert } from '@mui/material';

const api_url = "https://easyapp.clinic/pos-api/api";
const slug = "abc";
const authToken = "R42Wd3ep3aMza3KJay9A2T5RcjCZ81GKaVXqaZBH";

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

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
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
            setError('Failed to load tables. Please try again.');
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
                setSnackbarMessage('แก้ไขข้อมูลเรียบร้อยแล้ว');
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
                setSnackbarMessage('เพิ่มโต๊ะเรียบร้อยแล้ว');
            }
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
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
                            'Authorization': `Bearer ${authToken}`,
                        },
                    });
                    setSnackbarMessage('ลบโต๊ะเรียบร้อยแล้ว');
                    setSnackbarSeverity('success');
                    setSnackbarOpen(true);
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
                                    {tables.filter((table) => table.table_code.toLowerCase().includes(searchQuery.toLowerCase())).map((table, index) => (
                                        <tr key={table.id} style={{ ...styles.tr, backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#f0f2f0' }}>
                                            <td style={styles.td}>{table.table_code}</td>
                                            <td style={styles.td}>{table.seats}</td>
                                            <td style={{ ...styles.td, color: table.status === 'Y' ? 'black' : 'red' }}>{table.status === 'Y' ? 'เปิด' : 'ปิด'}</td>
                                            <td style={styles.tdActions}>
                                                <button onClick={() => handleEditTable(table)} style={{ ...styles.editButton, marginRight: '10px' }}>แก้ไข</button>
                                                <button onClick={() => handleDeleteTable(table.id)} style={styles.deleteButton}>ลบ</button>
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
    pageContainer: { display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f8' },
    contentContainer: { display: 'flex', flexDirection: 'row', gap: '20px', padding: '20px', justifyContent: 'space-between', alignItems: 'flex-start', fontFamily: 'Arial, sans-serif', width: 'calc(100% - 100px)', marginLeft: '100px' },
    listContainer: { flex: 6, backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', height: 'calc(90vh - 40px)' }, 
    formContainer: { flex: 3, backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', textAlign: 'center', height: 'calc(90vh - 40px)' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#000', marginBottom: '20px' },
    input: { padding: '12px', marginBottom: '15px', width: '320px', borderRadius: '5px', border: '1px solid #ccc' },
    searchInput: { padding: '12px', marginBottom: '15px', width: '850px', borderRadius: '5px', border: '1px solid #ccc' },
    itemCount: { fontSize: '16px', marginBottom: '15px', color: '#000' },
    select: { padding: '12px', marginBottom: '15px', width: '320px', borderRadius: '5px', border: '1px solid #ccc' },
    button: { width: '340px', padding: '12px', borderRadius: '5px', backgroundColor: '#499cae', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginBottom: '15px' },
    cancelButton: { width: '340px', padding: '12px', borderRadius: '5px', background: 'linear-gradient(to right, #ff7f7f, #d9534f)', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
    listTitle: { fontSize: '24px', fontWeight: 'bold', color: '#000', marginBottom: '20px', textAlign: 'center', marginRight: '750px' },
    tableContainer: { overflowY: 'auto', maxHeight: 'calc(76vh - 120px)', borderRadius: '8px', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
    th: { padding: '10px 25px', backgroundColor: '#499cae', textAlign: 'left', fontWeight: 'bold', color: '#fff', position: 'sticky', top: 1 },
    thActions: { padding: '10px 25px', backgroundColor: '#499cae', textAlign: 'center', fontWeight: 'bold', color: '#fff', position: 'sticky', top: 1 },
    tr: { transition: 'background-color 0.2s' },
    td: { padding: '10px 25px', textAlign: 'left' },
    tdActions: { padding: '10px 25px', textAlign: 'center' },
    editButton: { background: 'linear-gradient(to right, #ffd700, #FFC137)', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' },
    deleteButton: { background: 'linear-gradient(to right, #ff7f7f, #d9534f)', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' },
    errorText: { color: 'red', fontWeight: 'bold' },
    statusToggleContainer: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' },
    statusButton: { padding: '10px 73px', borderRadius: '5px', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }
};
