import React, { useState, useEffect } from 'react';
import {
    Dialog,
    Snackbar,
    Alert
} from '@mui/material';
import { FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import userService, { UserUpdateData } from '../services/userService';
import { User } from '../types/shared';
import EditUserDialog from '../components/EditUserDialog';
import DashboardLayout from '../components/DashboardLayout';

const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const fetchUsers = async () => {
        try {
            const response = await userService.getUsers(page + 1, rowsPerPage, searchQuery);
            setUsers(response.users);
            setTotalUsers(response.meta.total);
        } catch (error) {
            console.error('Error fetching users:', error);
            setSnackbar({
                open: true,
                message: 'Error fetching users',
                severity: 'error'
            });
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, rowsPerPage, searchQuery]);

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
        setPage(0);
    };

    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setIsEditDialogOpen(true);
    };

    const handleDeleteClick = (user: User) => {
        setSelectedUser(user);
        setIsDeleteDialogOpen(true);
    };

    const handleEditSubmit = async (userData: UserUpdateData) => {
        try {
            if (selectedUser) {
                await userService.updateUser(selectedUser.id, userData);
                setSnackbar({
                    open: true,
                    message: 'User updated successfully',
                    severity: 'success'
                });
                fetchUsers();
            }
        } catch (error) {
            console.error('Error updating user:', error);
            setSnackbar({
                open: true,
                message: 'Error updating user',
                severity: 'error'
            });
        }
        setIsEditDialogOpen(false);
    };

    const handleDeleteConfirm = async () => {
        try {
            if (selectedUser) {
                await userService.deleteUser(selectedUser.id);
                setSnackbar({
                    open: true,
                    message: 'User deleted successfully',
                    severity: 'success'
                });
                fetchUsers();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            setSnackbar({
                open: true,
                message: 'Error deleting user',
                severity: 'error'
            });
        }
        setIsDeleteDialogOpen(false);
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-100 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-semibold text-gray-900">Manajemen Pengguna</h1>
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiSearch className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Cari pengguna..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            NIK
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nama
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Divisi
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {user.nik}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {user.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {user.role.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {user.division ? (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {user.division.name}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEditClick(user)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        <FiEdit2 className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(user)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <FiTrash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <select
                                        value={rowsPerPage}
                                        onChange={handleChangeRowsPerPage}
                                        className="mr-2 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value={10}>10 rows</option>
                                        <option value={25}>25 rows</option>
                                        <option value={50}>50 rows</option>
                                    </select>
                                    <span className="text-sm text-gray-700">
                                        Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, totalUsers)} of {totalUsers} results
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleChangePage(null, page - 1)}
                                        disabled={page === 0}
                                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${page === 0
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => handleChangePage(null, page + 1)}
                                        disabled={page >= Math.ceil(totalUsers / rowsPerPage) - 1}
                                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${page >= Math.ceil(totalUsers / rowsPerPage) - 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {selectedUser && (
                    <EditUserDialog
                        open={isEditDialogOpen}
                        user={selectedUser}
                        onClose={() => setIsEditDialogOpen(false)}
                        onSubmit={handleEditSubmit}
                    />
                )}

                <Dialog
                    open={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    className="rounded-lg"
                >
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <FiTrash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Hapus Pengguna
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        Apakah Anda yakin ingin menghapus {selectedUser?.name}? Tindakan ini tidak dapat dibatalkan.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={handleDeleteConfirm}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Hapus
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Batal
                        </button>
                    </div>
                </Dialog>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    <Alert
                        onClose={() => setSnackbar({ ...snackbar, open: false })}
                        severity={snackbar.severity}
                        className={`${snackbar.severity === 'success' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
                            } rounded-lg`}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </div>
        </DashboardLayout>
    );
};

export default UserManagementPage; 