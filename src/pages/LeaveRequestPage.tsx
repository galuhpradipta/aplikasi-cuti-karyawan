import React, { useState, useEffect } from 'react';
import leaveRequestService, { LeaveRequest } from '../services/leaveRequestService';
import leaveTypeService, { LeaveType } from '../services/leaveTypeService';
import dayjs from 'dayjs';
import DashboardLayout from '../components/DashboardLayout';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker.css";
import { APPROVAL_FLOW } from '../types/approval';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

const CustomDatePickerInput = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>((props, ref) => (
    <div className="relative">
        <input
            {...props}
            ref={ref}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base pl-4"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </div>
    </div>
));

CustomDatePickerInput.displayName = 'CustomDatePickerInput';

const LeaveRequestPage: React.FC = () => {
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [reason, setReason] = useState('');
    const [leaveTypeId, setLeaveTypeId] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | string[]>('');

    const fetchLeaveRequests = async () => {
        try {
            const data = await leaveRequestService.getAll();
            setLeaveRequests(data);
        } catch (error) {
            console.error('Error fetching leave requests:', error);
        }
    };

    const fetchLeaveTypes = async () => {
        try {
            const data = await leaveTypeService.getAll();
            setLeaveTypes(data);
            if (data.length > 0) {
                setLeaveTypeId(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching leave types:', error);
        }
    };

    useEffect(() => {
        fetchLeaveRequests();
        fetchLeaveTypes();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!startDate || !endDate || !reason || !leaveTypeId) {
            setError('Semua field harus diisi');
            return;
        }

        setLoading(true);
        try {
            const formattedStartDate = dayjs(startDate).format('YYYY-MM-DD');
            const formattedEndDate = dayjs(endDate).format('YYYY-MM-DD');

            if (editId) {
                await leaveRequestService.update(editId, {
                    startDate: formattedStartDate,
                    endDate: formattedEndDate,
                    reason,
                    leaveTypeId,
                });
            } else {
                await leaveRequestService.create({
                    startDate: formattedStartDate,
                    endDate: formattedEndDate,
                    reason,
                    leaveTypeId,
                });
            }
            setOpen(false);
            setEditId(null);
            setStartDate(null);
            setEndDate(null);
            setReason('');
            setLeaveTypeId(leaveTypes[0]?.id || 0);
            fetchLeaveRequests();
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
                const responseData = error.response.data as { errors?: string[]; message?: string };
                if (responseData.errors) {
                    setError(responseData.errors);
                } else if (responseData.message) {
                    setError(responseData.message);
                } else {
                    setError('Terjadi kesalahan saat menyimpan pengajuan cuti');
                }
            } else {
                setError('Terjadi kesalahan saat menyimpan pengajuan cuti');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (request: LeaveRequest) => {
        setEditId(request.id);
        setStartDate(new Date(request.startDate));
        setEndDate(new Date(request.endDate));
        setReason(request.reason);
        setLeaveTypeId(request.leaveType.id);
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

    const getApprovalStatusDetails = (request: LeaveRequest) => {
        return APPROVAL_FLOW.map(flow => {
            const approval = request.approvals?.find(a => a.approver.role.name === flow.role);
            return {
                role: flow.role,
                status: approval?.status || 'PENDING',
                approver: approval?.approver?.name || '-',
                approvedAt: approval?.approvedAt ? dayjs(approval.approvedAt).format('DD/MM/YYYY HH:mm') : '-',
                remarks: approval?.remarks || '-'
            };
        });
    };

    const today = new Date();

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Pengajuan Cuti</h1>
                        <button
                            onClick={() => {
                                setEditId(null);
                                setStartDate(null);
                                setEndDate(null);
                                setReason('');
                                setLeaveTypeId(leaveTypes[0]?.id || 0);
                                setOpen(true);
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <FiPlus className="mr-2 -ml-1 h-5 w-5" />
                            Buat Pengajuan Cuti
                        </button>
                    </div>

                    {/* Leave Requests List */}
                    <div className="space-y-4">
                        {leaveRequests.map((request) => (
                            <div
                                key={request.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                            >
                                {/* Request Header */}
                                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                                    <div className="flex items-center space-x-12">
                                        <div className="w-36">
                                            <span className="text-gray-900 font-medium">
                                                {request.leaveType.name}
                                            </span>
                                        </div>
                                        <div className="w-28">
                                            <span className="text-gray-500">
                                                {dayjs(request.startDate).format('DD/MM/YYYY')}
                                            </span>
                                        </div>
                                        <div className="w-28">
                                            <span className="text-gray-500">
                                                {dayjs(request.endDate).format('DD/MM/YYYY')}
                                            </span>
                                        </div>
                                        <div className="w-64">
                                            <span className="text-gray-500">
                                                {request.reason}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${request.status === 'PENDING'
                                            ? 'bg-yellow-50 text-yellow-800'
                                            : request.status === 'APPROVED'
                                                ? 'bg-green-50 text-green-800'
                                                : 'bg-red-50 text-red-800'
                                            }`}>
                                            {request.status === 'PENDING' ? 'Menunggu' :
                                                request.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                                        </span>
                                        {request.status === 'PENDING' && (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(request)}
                                                    className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors duration-200"
                                                    title="Edit pengajuan"
                                                >
                                                    <FiEdit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(request.id)}
                                                    className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors duration-200"
                                                    title="Hapus pengajuan"
                                                >
                                                    <FiTrash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Approval Status */}
                                <div className="px-6 py-4 bg-gray-50">
                                    <h4 className="text-sm font-medium text-gray-900 mb-4">Status Persetujuan</h4>
                                    <div className="space-y-3">
                                        {getApprovalStatusDetails(request).map((approval, index) => (
                                            <div key={index} className="flex items-center justify-between text-sm">
                                                <div className="w-36">
                                                    <span className="text-gray-600">{approval.role}</span>
                                                </div>
                                                <div className="flex items-center space-x-8">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${approval.status === 'PENDING'
                                                        ? 'bg-yellow-50 text-yellow-800'
                                                        : approval.status === 'APPROVED'
                                                            ? 'bg-green-50 text-green-800'
                                                            : 'bg-red-50 text-red-800'
                                                        }`}>
                                                        {approval.status === 'PENDING' ? 'Menunggu' :
                                                            approval.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                                                    </span>
                                                    <span className="text-gray-600 w-36">{approval.approver}</span>
                                                    <span className="text-gray-500 w-44">{approval.approvedAt}</span>
                                                    {approval.remarks !== '-' && (
                                                        <span className="text-gray-600">"{approval.remarks}"</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {leaveRequests.length === 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                                <p className="text-gray-500">Belum ada pengajuan cuti</p>
                            </div>
                        )}
                    </div>

                    {/* Create/Edit Modal */}
                    {open && (
                        <div className="fixed inset-0 z-10 overflow-y-auto">
                            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                                {/* Background overlay */}
                                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setOpen(false)} />

                                {/* Modal panel */}
                                <div className="inline-block align-bottom bg-white rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                                {editId ? 'Edit Pengajuan Cuti' : 'Buat Pengajuan Cuti'}
                                            </h3>
                                            <div className="mt-4">
                                                <form onSubmit={handleSubmit} className="space-y-4">
                                                    {/* Leave Type Selection */}
                                                    <div>
                                                        <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">
                                                            Jenis Cuti
                                                        </label>
                                                        <select
                                                            id="leaveType"
                                                            value={leaveTypeId}
                                                            onChange={(e) => setLeaveTypeId(Number(e.target.value))}
                                                            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                        >
                                                            {leaveTypes.map((type) => (
                                                                <option key={type.id} value={type.id}>
                                                                    {type.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Date Range Selection */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Tanggal Mulai
                                                            </label>
                                                            <DatePicker
                                                                selected={startDate}
                                                                onChange={(date) => setStartDate(date)}
                                                                selectsStart
                                                                startDate={startDate}
                                                                endDate={endDate}
                                                                minDate={today}
                                                                dateFormat="dd/MM/yyyy"
                                                                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                                customInput={<CustomDatePickerInput />}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Tanggal Selesai
                                                            </label>
                                                            <DatePicker
                                                                selected={endDate}
                                                                onChange={(date) => setEndDate(date)}
                                                                selectsEnd
                                                                startDate={startDate}
                                                                endDate={endDate}
                                                                minDate={startDate || today}
                                                                dateFormat="dd/MM/yyyy"
                                                                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                                customInput={<CustomDatePickerInput />}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Reason Input */}
                                                    <div>
                                                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                                                            Alasan
                                                        </label>
                                                        <textarea
                                                            id="reason"
                                                            value={reason}
                                                            onChange={(e) => setReason(e.target.value)}
                                                            rows={3}
                                                            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                            placeholder="Masukkan alasan cuti..."
                                                        />
                                                    </div>

                                                    {/* Error Display */}
                                                    {error && (
                                                        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                                                            {Array.isArray(error) ? (
                                                                <ul className="list-disc list-inside">
                                                                    {error.map((err, index) => (
                                                                        <li key={index}>{err}</li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                error
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Action Buttons */}
                                                    <div className="mt-6 sm:flex sm:flex-row-reverse">
                                                        <button
                                                            type="submit"
                                                            disabled={loading}
                                                            className="w-full inline-flex justify-center rounded-lg border border-transparent px-6 py-2.5 bg-blue-600 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {loading ? 'Menyimpan...' : 'Simpan'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setOpen(false)}
                                                            className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                                                        >
                                                            Batal
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LeaveRequestPage; 