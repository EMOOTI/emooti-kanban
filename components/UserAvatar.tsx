import React from 'react';
import { User } from '../types';

interface UserAvatarProps {
    user: User;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    showTooltip?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
    user, 
    size = 'md',
    className = '',
    showTooltip = true
}) => {
    // Tamaños predefinidos
    const sizeClasses = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-8 h-8 text-sm',
        lg: 'w-10 h-10 text-base',
        xl: 'w-12 h-12 text-lg'
    };

    // Si className contiene w-5 h-5, usar el tamaño del contenedor padre
    const isCustomSize = className.includes('w-5') && className.includes('h-5');
    const finalSizeClass = isCustomSize ? '' : sizeClasses[size];

    // Obtener iniciales del usuario
    const getInitials = (user: User): string => {
        const firstInitial = user.firstName.charAt(0).toUpperCase();
        const lastInitial = user.lastName.charAt(0).toUpperCase();
        return `${firstInitial}${lastInitial}`;
    };

    // Color por defecto si no tiene color asignado
    const getDefaultColor = (userId: string): string => {
        const colors = [
            '#3B82F6', // Blue
            '#10B981', // Green
            '#F59E0B', // Yellow
            '#EF4444', // Red
            '#8B5CF6', // Purple
            '#06B6D4', // Cyan
            '#F97316', // Orange
            '#EC4899', // Pink
            '#84CC16', // Lime
            '#6366F1'  // Indigo
        ];
        
        // Usar el ID del usuario para seleccionar un color consistente
        const index = user.id.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const avatarColor = user.color || getDefaultColor(user.id);
    const initials = getInitials(user);

    // Si tiene avatarUrl, mostrar la imagen
    if (user.avatarUrl && user.avatarUrl.trim() !== '') {
        return (
            <div className={`${finalSizeClass} rounded-full overflow-hidden ${className} ${showTooltip ? 'cursor-pointer group relative' : ''}`}>
                <img 
                    src={user.avatarUrl} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Si la imagen falla, mostrar las iniciales
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                            parent.innerHTML = `
                                <div class="w-full h-full rounded-full flex items-center justify-center text-white font-medium" 
                                     style="background-color: ${avatarColor}">
                                    ${initials}
                                </div>
                            `;
                        }
                    }}
                />
                {showTooltip && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                        {user.firstName} {user.lastName}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                )}
            </div>
        );
    }

    // Si no tiene avatarUrl, mostrar círculo con iniciales
    return (
        <div 
            className={`${finalSizeClass} rounded-full flex items-center justify-center text-white font-medium ${className} ${showTooltip ? 'cursor-pointer group relative' : ''}`}
            style={{ backgroundColor: avatarColor }}
            title={showTooltip ? undefined : `${user.firstName} ${user.lastName}`}
        >
            {initials}
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    {user.firstName} {user.lastName}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
            )}
        </div>
    );
};

export default UserAvatar; 