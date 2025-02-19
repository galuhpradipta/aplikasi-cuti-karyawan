import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box
} from '@mui/material';
import { FiUser, FiMail, FiKey, FiTag, FiUserCheck } from 'react-icons/fi';
import { User, UserUpdateData } from '../services/userService';

interface EditUserDialogProps {
    open: boolean;
    user: User;
    onClose: () => void;
    onSubmit: (data: UserUpdateData) => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ open, user, onClose, onSubmit }) => {
    const [formData, setFormData] = useState<UserUpdateData>({
        name: '',
        email: '',
        nik: '',
        roleId: 0,
        password: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                nik: user.nik,
                roleId: user.role.id,
                password: ''
            });
        }
    }, [user]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: parseInt(value, 10)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Remove password if it's empty (no password change)
        const submitData = { ...formData };
        if (!submitData.password) {
            delete submitData.password;
        }
        onSubmit(submitData);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle className="text-lg font-semibold">Edit Pengguna</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiTag className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                name="nik"
                                placeholder="NIK"
                                value={formData.nik}
                                onChange={handleTextChange}
                                required
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiUser className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                name="name"
                                placeholder="Nama"
                                value={formData.name}
                                onChange={handleTextChange}
                                required
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiMail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                name="email"
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleTextChange}
                                required
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiUserCheck className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                name="roleId"
                                value={formData.roleId}
                                onChange={handleSelectChange}
                                required
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value={1}>Karyawan</option>
                                <option value={2}>Kepala Divisi</option>
                                <option value={3}>HRD</option>
                                <option value={4}>Direktur</option>
                            </select>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiKey className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                name="password"
                                type="password"
                                placeholder="Kata Sandi Baru"
                                value={formData.password}
                                onChange={handleTextChange}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                            <p className="mt-1 text-sm text-gray-500">Kosongkan jika tidak ingin mengubah kata sandi</p>
                        </div>
                    </Box>
                </DialogContent>
                <DialogActions className="p-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        className="ml-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Simpan
                    </button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default EditUserDialog; 