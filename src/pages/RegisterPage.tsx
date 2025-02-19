import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService, RegisterData } from '../services/api';
import { AxiosError } from 'axios';
import api from '../services/api';

interface Role {
    id: number;
    name: string;
}

export default function RegisterPage() {
    const navigate = useNavigate();
    const [roles, setRoles] = useState<Role[]>([]);
    const [formData, setFormData] = useState<RegisterData>({
        email: '',
        password: '',
        name: '',
        roleId: 1,
    });
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [rolesLoading, setRolesLoading] = useState(true);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                setRolesLoading(true);
                const response = await api.get<Role[]>('/auth/roles');
                console.log('Roles response:', response.data);
                setRoles(response.data);
                if (response.data.length > 0) {
                    setFormData(prev => ({ ...prev, roleId: response.data[0].id }));
                }
            } catch (error) {
                console.error('Error fetching roles:', error);
                setError('Gagal memuat data peran. Silakan coba lagi nanti.');
            } finally {
                setRolesLoading(false);
            }
        };
        fetchRoles();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'roleId' ? parseInt(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authService.register(formData);
            navigate('/dashboard');
        } catch (err: unknown) {
            const error = err as AxiosError<{ message: string }>;
            setError(error.response?.data?.message || 'Terjadi kesalahan saat mendaftar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Buat Akun
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Bergabung dengan sistem manajemen cuti
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="name" className="sr-only">
                                Nama Lengkap
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Nama Lengkap"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Alamat Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Alamat Email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Kata Sandi
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Kata Sandi"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="roleId" className="sr-only">
                                Peran
                            </label>
                            <select
                                id="roleId"
                                name="roleId"
                                required
                                disabled={rolesLoading}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                value={formData.roleId}
                                onChange={handleChange}
                            >
                                {rolesLoading ? (
                                    <option>Memuat peran...</option>
                                ) : roles.length > 0 ? (
                                    roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))
                                ) : (
                                    <option>Tidak ada peran tersedia</option>
                                )}
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center">{error}</div>
                    )}

                    <div className="flex flex-col space-y-4">
                        <button
                            type="submit"
                            disabled={loading || rolesLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50"
                        >
                            {loading ? 'Membuat akun...' : 'Buat akun'}
                        </button>

                        <Link
                            to="/login"
                            className="w-full flex justify-center py-2 px-4 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                            Sudah punya akun? Masuk
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}