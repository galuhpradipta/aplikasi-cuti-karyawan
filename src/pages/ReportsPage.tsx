import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { reportService } from '../services/reportService';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { LeaveRequest } from '../types/leaveRequest';
import { ReportFilters } from '../types/report';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FiDownload, FiSearch, FiCalendar, FiRotateCcw } from 'react-icons/fi';

const ReportsPage: React.FC = () => {
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [status, setStatus] = useState<string>('');

    const fetchReports = async () => {
        try {
            setLoading(true);
            const filters: ReportFilters = {};

            if (startDate) {
                filters.startDate = startDate.toISOString();
            }
            if (endDate) {
                filters.endDate = endDate.toISOString();
            }
            if (status) {
                filters.status = status;
            }

            const data = await reportService.getLeaveRequestReports(filters);
            setLeaveRequests(data);
        } catch (error) {
            console.error('Error fetching reports:', error);
            setError('Gagal memuat laporan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleExport = async () => {
        try {
            const filters: ReportFilters = {};

            if (startDate) {
                filters.startDate = startDate.toISOString();
            }
            if (endDate) {
                filters.endDate = endDate.toISOString();
            }
            if (status) {
                filters.status = status;
            }

            await reportService.exportLeaveRequestsCSV(filters);
        } catch (error) {
            console.error('Error exporting reports:', error);
            setError('Gagal mengekspor laporan');
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-green-50 text-green-700 ring-green-600/20';
            case 'REJECTED':
                return 'bg-red-50 text-red-700 ring-red-600/20';
            default:
                return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'Disetujui';
            case 'REJECTED':
                return 'Ditolak';
            default:
                return 'Menunggu';
        }
    };

    const resetFilters = () => {
        setStartDate(null);
        setEndDate(null);
        setStatus('');
        fetchReports();
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50/50">
                <div className="p-6 space-y-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Laporan Cuti</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Daftar semua pengajuan cuti karyawan
                            </p>
                        </div>
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 border border-gray-300 rounded-lg shadow-sm"
                        >
                            <FiDownload className="w-4 h-4 mr-2" />
                            Export CSV
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                                <div className="relative">
                                    <DatePicker
                                        selected={startDate}
                                        onChange={(date) => setStartDate(date)}
                                        className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-[38px] pl-3 pr-10"
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="Pilih tanggal mulai"
                                        locale={id}
                                        autoComplete="off"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <FiCalendar className="h-4 w-4 text-gray-400" />
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
                                <div className="relative">
                                    <DatePicker
                                        selected={endDate}
                                        onChange={(date) => setEndDate(date)}
                                        className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-[38px] pl-3 pr-10"
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="Pilih tanggal selesai"
                                        locale={id}
                                        autoComplete="off"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <FiCalendar className="h-4 w-4 text-gray-400" />
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-[38px] px-3"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="PENDING">Menunggu</option>
                                    <option value="APPROVED">Disetujui</option>
                                    <option value="REJECTED">Ditolak</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 invisible">Actions</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={resetFilters}
                                        className="inline-flex items-center justify-center px-4 h-[38px] border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <FiRotateCcw className="w-4 h-4 mr-2" />
                                        Reset
                                    </button>
                                    <button
                                        onClick={fetchReports}
                                        className="flex-1 inline-flex items-center justify-center px-4 h-[38px] border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <FiSearch className="w-4 h-4 mr-2" />
                                        Filter
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="rounded-lg bg-red-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading state */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        /* Table */
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Karyawan</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Cuti</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Mulai</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Selesai</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hari</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {leaveRequests.map((request) => (
                                            <tr key={request.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {request.user.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {request.leaveType.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {format(new Date(request.startDate), 'dd/MM/yyyy')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {format(new Date(request.endDate), 'dd/MM/yyyy')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {request.totalDays}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(request.status)}`}>
                                                        {getStatusText(request.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ReportsPage; 