
import React from 'react';
import { XIcon, ExclamationIcon } from './icons';

interface ConfirmModalProps {
    title: string;
    message: React.ReactNode;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onClose: () => void;
    isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ title, message, confirmText, cancelText, onConfirm, onClose, isDestructive }) => {
    const confirmButtonClasses = isDestructive
        ? 'bg-red-600 hover:bg-red-700'
        : 'bg-primary hover:bg-primary-hover';

    const iconColorClass = isDestructive ? 'text-red-500' : 'text-primary';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-2xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${isDestructive ? 'bg-red-100 dark:bg-red-900/20' : 'bg-primary/10'}`}>
                        <span className={iconColorClass}>
                            <ExclamationIcon />
                        </span>
                    </div>
                    <h3 className="text-xl font-semibold mt-5 text-light-text dark:text-dark-text">{title}</h3>
                    <div className="mt-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        {message}
                    </div>
                    <div className="mt-6 flex justify-center space-x-4">
                        <button
                            onClick={onClose}
                            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 dark:text-dark-text text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 text-sm"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-2 py-1 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 text-sm ${confirmButtonClasses}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
