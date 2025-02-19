import React, { useState, useEffect } from 'react';
import leaveRequestService, { LeaveRequest } from '../services/leaveRequestService';
import leaveTypeService, { LeaveType } from '../services/leaveTypeService';
import dayjs from 'dayjs';
import DashboardLayout from '../components/DashboardLayout';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker.css";
import { APPROVAL_FLOW } from '../types/approval';

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

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'APPROVED':
                return 'bg-green-100 text-green-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
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

    const getStatusBadgeColor = (status: string): string => {
        switch (status) {
            case 'APPROVED':
                return 'bg-green-100 text-green-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const today = new Date();

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pengajuan Cuti</h1>
                <button
                    onClick={() => {
                        setEditId(null);
                        setStartDate(null);
                        setEndDate(null);
                        setReason('');
                        setOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
                >
                    Buat Pengajuan Cuti
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipe Cuti
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tanggal Mulai
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tanggal Selesai
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Alasan
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tanggal Pengajuan
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {leaveRequests.map((request) => (
                            <React.Fragment key={request.id}>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {request.leaveType.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {dayjs(request.startDate).format('DD/MM/YYYY')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {dayjs(request.endDate).format('DD/MM/YYYY')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {request.reason}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {dayjs(request.createdAt).format('DD/MM/YYYY HH:mm')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {request.status === 'PENDING' && (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(request)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(request.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 bg-gray-50">
                                        <div className="text-sm">
                                            <h4 className="font-medium text-gray-900 mb-2">Status Persetujuan:</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {getApprovalStatusDetails(request).map((approval, index) => (
                                                    <div key={index} className="flex flex-col space-y-1 bg-white p-3 rounded-lg shadow-sm">
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-medium text-gray-700">{approval.role}</span>
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(approval.status)}`}>
                                                                {approval.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            <p>Approver: {approval.approver}</p>
                                                            <p>Waktu: {approval.approvedAt}</p>
                                                            {approval.remarks !== '-' && (
                                                                <p>Catatan: {approval.remarks}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {open && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 transform transition-all">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {editId ? 'Edit Pengajuan Cuti' : 'Pengajuan Cuti Baru'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setOpen(false);
                                        setError('');
                                    }}
                                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="px-6 py-4">
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 gap-5">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tipe Cuti <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={leaveTypeId}
                                            onChange={(e) => setLeaveTypeId(Number(e.target.value))}
                                            className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                                            required
                                        >
                                            <option value="">Pilih Tipe Cuti</option>
                                            {leaveTypes.map((type) => (
                                                <option key={type.id} value={type.id}>
                                                    {type.name} {type.maxDays ? `(${type.maxDays} hari)` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tanggal Mulai <span className="text-red-500">*</span>
                                            </label>
                                            <DatePicker
                                                selected={startDate}
                                                onChange={(date: Date | null) => {
                                                    setStartDate(date);
                                                    if (date && (!endDate || date > endDate)) {
                                                        setEndDate(date);
                                                    }
                                                }}
                                                minDate={today}
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="DD/MM/YYYY"
                                                required
                                                customInput={
                                                    <input
                                                        className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                                                    />
                                                }
                                                popperClassName="react-datepicker-left"
                                                calendarClassName="custom-calendar"
                                                popperPlacement="bottom-start"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tanggal Selesai <span className="text-red-500">*</span>
                                            </label>
                                            <DatePicker
                                                selected={endDate}
                                                onChange={(date: Date | null) => setEndDate(date)}
                                                minDate={startDate || today}
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="DD/MM/YYYY"
                                                required
                                                customInput={
                                                    <input
                                                        className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                                                    />
                                                }
                                                popperClassName="react-datepicker-left"
                                                calendarClassName="custom-calendar"
                                                popperPlacement="bottom-start"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Alasan <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <textarea
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm resize-none"
                                                rows={3}
                                                required
                                                minLength={10}
                                                maxLength={500}
                                                placeholder="Jelaskan alasan cuti Anda (min. 10 karakter)"
                                            />
                                            <div className="absolute bottom-2 right-2">
                                                <span className={`text-xs ${reason.length < 10 ? 'text-red-500' : 'text-gray-400'}`}>
                                                    {reason.length}/500
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="rounded-md bg-red-50 p-3 border border-red-200">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-2">
                                                    <div className="text-sm text-red-700">
                                                        {Array.isArray(error) ? (
                                                            <ul className="list-disc pl-5 space-y-1">
                                                                {error.map((err, index) => (
                                                                    <li key={index}>{err}</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p>{error}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setOpen(false);
                                                setError('');
                                            }}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || reason.length < 10}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Menyimpan...
                                                </>
                                            ) : (
                                                'Simpan'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default LeaveRequestPage; 