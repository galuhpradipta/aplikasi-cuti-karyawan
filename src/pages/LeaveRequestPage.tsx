import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Stack,
    Chip,
    IconButton,
    Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import leaveRequestService, { LeaveRequest } from '../services/leaveRequestService';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const LeaveRequestPage: React.FC = () => {
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [startDate, setStartDate] = useState<Dayjs | null>(null);
    const [endDate, setEndDate] = useState<Dayjs | null>(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchLeaveRequests = async () => {
        try {
            const data = await leaveRequestService.getAll();
            setLeaveRequests(data);
        } catch (error) {
            console.error('Error fetching leave requests:', error);
        }
    };

    useEffect(() => {
        fetchLeaveRequests();
    }, []);

    const handleSubmit = async () => {
        if (!startDate || !endDate || !reason) {
            return;
        }

        setLoading(true);
        try {
            if (editId) {
                await leaveRequestService.update(editId, {
                    startDate: startDate.format('YYYY-MM-DD'),
                    endDate: endDate.format('YYYY-MM-DD'),
                    reason,
                });
            } else {
                await leaveRequestService.create({
                    startDate: startDate.format('YYYY-MM-DD'),
                    endDate: endDate.format('YYYY-MM-DD'),
                    reason,
                });
            }
            setOpen(false);
            setEditId(null);
            setStartDate(null);
            setEndDate(null);
            setReason('');
            fetchLeaveRequests();
        } catch (error) {
            console.error('Error submitting leave request:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (request: LeaveRequest) => {
        setEditId(request.id);
        setStartDate(dayjs(request.startDate));
        setEndDate(dayjs(request.endDate));
        setReason(request.reason);
        setOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus pengajuan cuti ini?')) {
            try {
                await leaveRequestService.delete(id);
                fetchLeaveRequests();
            } catch (error) {
                console.error('Error deleting leave request:', error);
            }
        }
    };

    const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
        switch (status) {
            case 'APPROVED':
                return 'success';
            case 'REJECTED':
                return 'error';
            case 'PENDING':
                return 'warning';
            default:
                return 'default';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" component="h1">
                    Pengajuan Cuti
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                        setEditId(null);
                        setStartDate(null);
                        setEndDate(null);
                        setReason('');
                        setOpen(true);
                    }}
                >
                    Buat Pengajuan Cuti
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Tanggal Mulai</TableCell>
                            <TableCell>Tanggal Selesai</TableCell>
                            <TableCell>Alasan</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Tanggal Pengajuan</TableCell>
                            <TableCell>Aksi</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {leaveRequests.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell>
                                    {dayjs(request.startDate).format('DD/MM/YYYY')}
                                </TableCell>
                                <TableCell>
                                    {dayjs(request.endDate).format('DD/MM/YYYY')}
                                </TableCell>
                                <TableCell>{request.reason}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={request.status}
                                        color={getStatusColor(request.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {dayjs(request.createdAt).format('DD/MM/YYYY HH:mm')}
                                </TableCell>
                                <TableCell>
                                    {request.status === 'PENDING' && (
                                        <>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEdit(request)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Hapus">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(request.id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editId ? 'Edit Pengajuan Cuti' : 'Pengajuan Cuti Baru'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Tanggal Mulai"
                                value={startDate}
                                onChange={(newValue: Dayjs | null) => setStartDate(newValue)}
                            />
                            <DatePicker
                                label="Tanggal Selesai"
                                value={endDate}
                                onChange={(newValue: Dayjs | null) => setEndDate(newValue)}
                            />
                        </LocalizationProvider>
                        <TextField
                            label="Alasan"
                            multiline
                            rows={4}
                            value={reason}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Batal</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                        disabled={loading || !startDate || !endDate || !reason}
                    >
                        {loading ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default LeaveRequestPage; 