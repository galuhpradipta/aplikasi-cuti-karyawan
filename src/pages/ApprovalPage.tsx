import { useState, useEffect } from 'react';
import { Approval, approvalService } from '../services/approvalService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import DashboardLayout from '../components/DashboardLayout';

export default function ApprovalPage() {
    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [remarks, setRemarks] = useState<{ [key: number]: string }>({});

    const fetchApprovals = async () => {
        try {
            setLoading(true);
            const data = await approvalService.getPendingApprovals();
            setApprovals(data);
        } catch (error) {
            console.error('Error fetching approvals:', error);
            setError('Gagal memuat data persetujuan cuti');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovals();
    }, []);

    const handleApproval = async (id: number, status: 'APPROVED' | 'REJECTED') => {
        try {
            setProcessingId(id);
            await approvalService.handleApproval(id, status, remarks[id]);
            // Refresh the list after approval
            await fetchApprovals();
            // Clear remarks for this approval
            setRemarks(prev => {
                const newRemarks = { ...prev };
                delete newRemarks[id];
                return newRemarks;
            });
        } catch (error) {
            console.error('Error processing approval:', error);
            setError('Gagal memproses persetujuan');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center">
                            <div className="animate-pulse">Memuat data...</div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="md:flex md:items-center md:justify-between mb-6">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Persetujuan Cuti
                        </h2>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {approvals.length === 0 ? (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center text-gray-500">
                        Tidak ada permohonan cuti yang perlu disetujui
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <ul className="divide-y divide-gray-200">
                            {approvals.map((approval) => (
                                <li key={approval.id} className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {approval.leaveRequest.user.name}
                                                </h3>
                                                <p className="text-sm text-gray-500">NIK: {approval.leaveRequest.user.nik}</p>
                                            </div>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                                {approval.leaveRequest.leaveType.name}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Tanggal Cuti</p>
                                                <p className="mt-1">
                                                    {format(new Date(approval.leaveRequest.startDate), 'dd MMMM yyyy', { locale: id })}
                                                    {' - '}
                                                    {format(new Date(approval.leaveRequest.endDate), 'dd MMMM yyyy', { locale: id })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Alasan</p>
                                                <p className="mt-1">{approval.leaveRequest.reason}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor={`remarks-${approval.id}`} className="block text-sm font-medium text-gray-700">
                                                Catatan (opsional)
                                            </label>
                                            <textarea
                                                id={`remarks-${approval.id}`}
                                                rows={2}
                                                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                                placeholder="Tambahkan catatan..."
                                                value={remarks[approval.id] || ''}
                                                onChange={(e) => setRemarks(prev => ({ ...prev, [approval.id]: e.target.value }))}
                                            />
                                        </div>

                                        <div className="flex justify-end space-x-3">
                                            <button
                                                onClick={() => handleApproval(approval.id, 'REJECTED')}
                                                disabled={processingId === approval.id}
                                                className="inline-flex items-center px-4 py-2 border border-red-600 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                Tolak
                                            </button>
                                            <button
                                                onClick={() => handleApproval(approval.id, 'APPROVED')}
                                                disabled={processingId === approval.id}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                Setujui
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
} 