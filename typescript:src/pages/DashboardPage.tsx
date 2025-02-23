<tbody className="bg-white divide-y divide-gray-200">
    {(stats?.recentRequests ?? []).length > 0 ? (
        stats?.recentRequests?.map((request) => (
            <tr key={request.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(request.startDate).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.leaveType.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${request.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : request.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                        {request.status === 'PENDING'
                            ? 'Menunggu'
                            : request.status === 'APPROVED'
                                ? 'Disetujui'
                                : 'Ditolak'}
                    </span>
                </td>
            </tr>
        ))
    ) : (
        <tr>
            <td colSpan={5} className="text-center">No recent requests</td>
        </tr>
    )}
</tbody>
{ (stats.recentRequests || []).length > 0 ? ( 