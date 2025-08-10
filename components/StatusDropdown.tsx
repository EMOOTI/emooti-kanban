import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from './icons';

export type TaskStatus = 'nueva' | 'requiere_info' | 'trabajo_curso' | 'finalizado';

interface StatusOption {
    id: TaskStatus;
    label: string;
    initial: string;
    color: string;
}

const statusOptions: StatusOption[] = [
    { id: 'nueva', label: 'Nueva solicitud', initial: 'N', color: '#3B82F6' },
    { id: 'requiere_info', label: 'Requiere información', initial: 'R', color: '#F59E0B' },
    { id: 'trabajo_curso', label: 'Trabajo en curso', initial: 'T', color: '#EC4899' },
    { id: 'finalizado', label: 'Finalizado', initial: 'F', color: '#10B981' }
];

interface StatusDropdownProps {
    currentStatus: TaskStatus;
    onStatusChange: (status: TaskStatus) => void;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({
    currentStatus,
    onStatusChange
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentOption = statusOptions.find(option => option.id === currentStatus) || statusOptions[3];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleStatusSelect = (status: TaskStatus) => {
        onStatusChange(status);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-1 rounded-md text-white font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: currentOption.color }}
            >
                <span className="text-sm">{currentOption.initial} {currentOption.label}</span>
                <ChevronDownIcon className="h-4 w-4" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                        {statusOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => handleStatusSelect(option.id)}
                                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-6 h-6 rounded flex items-center justify-center text-white text-sm font-medium"
                                        style={{ backgroundColor: option.color }}
                                    >
                                        {option.initial}
                                    </div>
                                    <span className="text-sm text-gray-700">{option.label}</span>
                                </div>
                                {option.id === currentStatus && (
                                    <CheckIcon className="h-4 w-4 text-gray-600" />
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="border-t border-gray-200 px-3 py-2">
                        <button className="text-sm text-gray-500 hover:text-gray-700">
                            Enviar comentarios
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatusDropdown; 