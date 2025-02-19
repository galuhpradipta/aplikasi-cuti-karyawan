import React, { useState, useEffect } from 'react';
import leaveRequestService, { LeaveRequest } from '../services/leaveRequestService';
import leaveTypeService, { LeaveType } from '../services/leaveTypeService';
import dayjs from 'dayjs';
import DashboardLayout from '../components/DashboardLayout';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker.css";
import { APPROVAL_FLOW } from '../types/approval';
import { FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

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
    const navigate = useNavigate();

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
            <div className="min-h-screen bg-gray-50 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Pengajuan Cuti</h1>
                        <button
                            onClick={() => navigate('/leave-requests/create')}
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
                                className="bg-white rounded-lg shadow overflow-hidden"
                            >
                                {/* Request Header */}
                                <div className="px-6 py-4 grid grid-cols-7 gap-4 items-center border-b border-gray-200">
                                    <div className="text-sm font-medium text-gray-900">
                                        {request.leaveType.name}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {dayjs(request.startDate).format('DD/MM/YYYY')}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {dayjs(request.endDate).format('DD/MM/YYYY')}
                                    </div>
                                    <div className="col-span-2 text-sm text-gray-600">
                                        {request.reason}
                                    </div>
                                    <div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                            {request.status === 'PENDING' ? 'Menunggu' :
                                                request.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                                        </span>
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        {request.status === 'PENDING' && (
                                            <>
                                                <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                                                    Edit
                                                </button>
                                                <button className="text-red-600 hover:text-red-900 text-sm font-medium">
                                                    Hapus
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Approval Status */}
                                <div className="px-6 py-4 bg-gray-50">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                                        Status Persetujuan:
                                    </h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        {request.approvals.map((approval) => (
                                            <div
                                                key={approval.id}
                                                className="bg-white rounded-lg p-4 shadow-sm"
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {approval.approver.role.name}
                                                    </span>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(approval.status)}`}>
                                                        {approval.status === 'PENDING' ? 'Menunggu' :
                                                            approval.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    <p>Approver: {approval.approver.name}</p>
                                                    <p>Waktu: {approval.approvedAt ?
                                                        dayjs(approval.approvedAt).format('DD/MM/YYYY HH:mm') :
                                                        '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {leaveRequests.length === 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                                <p className="text-gray-500">Belum ada pengajuan cuti</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LeaveRequestPage; 