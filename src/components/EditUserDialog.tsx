import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    SelectChangeEvent
} from '@mui/material';
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

    const handleSelectChange = (e: SelectChangeEvent<number>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name as string]: value
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
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            name="nik"
                            label="NIK"
                            value={formData.nik}
                            onChange={handleTextChange}
                            required
                            fullWidth
                        />
                        <TextField
                            name="name"
                            label="Name"
                            value={formData.name}
                            onChange={handleTextChange}
                            required
                            fullWidth
                        />
                        <TextField
                            name="email"
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={handleTextChange}
                            required
                            fullWidth
                        />
                        <FormControl fullWidth required>
                            <InputLabel>Role</InputLabel>
                            <Select
                                name="roleId"
                                value={formData.roleId}
                                onChange={handleSelectChange}
                                label="Role"
                            >
                                <MenuItem value={1}>Karyawan</MenuItem>
                                <MenuItem value={2}>Kepala Divisi</MenuItem>
                                <MenuItem value={3}>HRD</MenuItem>
                                <MenuItem value={4}>Direktur</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            name="password"
                            label="New Password"
                            type="password"
                            value={formData.password}
                            onChange={handleTextChange}
                            fullWidth
                            helperText="Leave blank to keep current password"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" color="primary">
                        Save Changes
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default EditUserDialog; 