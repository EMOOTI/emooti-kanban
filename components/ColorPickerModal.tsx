import React from 'react';
import { XIcon } from './icons';
import { ColorService } from '../services/colorService';

interface ColorPickerModalProps {
    onClose: () => void;
    onSelectColor: (color: string) => void;
}

const ColorPickerModal: React.FC<ColorPickerModalProps> = ({ onClose, onSelectColor }) => {
    const palette = ColorService.getColorPalette();

    const handleSelect = (color: string) => {
        onSelectColor(color);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-2xl w-full max-w-xs" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-light-border dark:border-dark-border">
                    <h3 className="font-bold">Seleccionar Color</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XIcon />
                    </button>
                </div>
                <div className="p-4 grid grid-cols-6 gap-2">
                    {palette.map(color => (
                        <button
                            key={color}
                            onClick={() => handleSelect(color)}
                            className="w-10 h-10 rounded-full border border-light-border dark:border-dark-border transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            style={{ backgroundColor: color }}
                            aria-label={`Seleccionar color ${color}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ColorPickerModal;
