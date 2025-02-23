import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService, RegisterData } from '../services/api';
import { AxiosError } from 'axios';
import api from '../services/api';
import { Role, Division, REGISTERABLE_ROLES } from '../types/shared';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [roles, setRoles] = useState<Role[]>([]);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [formData, setFormData] = useState<RegisterData>({
        email: '',
        password: '',
        name: '',
        nik: '',
        roleId: 0,
        divisionId: undefined,
    });
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [divisionsLoading, setDivisionsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setRolesLoading(true);
                setDivisionsLoading(true);

                const [rolesResponse, divisionsResponse] = await Promise.all([
                    api.get<Role[]>('/auth/roles'),
                    api.get<Division[]>('/auth/divisions')
                ]);

                // Filter roles using the shared REGISTERABLE_ROLES constant
                const filteredRoles = rolesResponse.data.filter(
                    role => REGISTERABLE_ROLES.includes(role.name)
                );

                console.log('Fetched roles:', filteredRoles);
                console.log('Fetched divisions:', divisionsResponse.data);

                setRoles(filteredRoles);
                setDivisions(divisionsResponse.data);

                if (filteredRoles.length > 0) {
                    const defaultRole = filteredRoles[0];
                    console.log('Setting default role:', defaultRole);
                    setFormData(prev => ({ ...prev, roleId: defaultRole.id }));
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Gagal memuat data. Silakan coba lagi nanti.');
            } finally {
                setRolesLoading(false);
                setDivisionsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'roleId') {
            const selectedRole = roles.find(r => r.id === parseInt(value));
            console.log('Role changed to:', { value, roleName: selectedRole?.name });
            setFormData(prev => ({
                ...prev,
                roleId: parseInt(value),
                divisionId: undefined
            }));
        } else if (name === 'divisionId') {
            console.log('Division changed to:', value);
            setFormData(prev => ({
                ...prev,
                divisionId: value ? parseInt(value) : undefined
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const selectedRole = roles.find(role => role.id === formData.roleId);
    // Since we only have Karyawan and Kepala Divisi roles now, always show division
    const needsDivision = true;

    console.log('Debug state:', {
        selectedRole,
        needsDivision,
        formData,
        roles,
        divisions
    });

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
                            <label htmlFor="nik" className="sr-only">
                                Nomor Induk Karyawan
                            </label>
                            <input
                                id="nik"
                                name="nik"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Nomor Induk Karyawan"
                                value={formData.nik}
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
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                value={formData.roleId || ''}
                                onChange={handleChange}
                            >
                                <option value="">Pilih Peran</option>
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
                        <div>
                            <label htmlFor="divisionId" className="sr-only">
                                Divisi
                            </label>
                            <select
                                id="divisionId"
                                name="divisionId"
                                required
                                disabled={divisionsLoading}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                value={formData.divisionId || ''}
                                onChange={handleChange}
                            >
                                <option value="">Pilih Divisi</option>
                                {divisionsLoading ? (
                                    <option>Memuat divisi...</option>
                                ) : divisions.length > 0 ? (
                                    divisions.map((division) => (
                                        <option key={division.id} value={division.id}>
                                            {division.name}
                                        </option>
                                    ))
                                ) : (
                                    <option>Tidak ada divisi tersedia</option>
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
                            disabled={loading || rolesLoading || !formData.roleId || !formData.divisionId}
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