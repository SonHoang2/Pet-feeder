import React from 'react';
import { Check, X, AlertTriangle, Info } from 'react-feather';

const Alert = ({ type = 'info', title, message, isVisible, onClose }) => {
    if (!isVisible) return null;

    // Set styling based on alert type
    const styles = {
        success: {
            border: 'border-green-300',
            bgGradient: 'from-green-400 to-green-500',
            icon: <Check className="w-5 h-5 text-white" />
        },
        error: {
            border: 'border-red-300',
            bgGradient: 'from-red-400 to-red-500',
            icon: <X className="w-5 h-5 text-white" />
        },
        warning: {
            border: 'border-orange-300',
            bgGradient: 'from-orange-400 to-orange-500',
            icon: <AlertTriangle className="w-5 h-5 text-white" />
        },
        info: {
            border: 'border-blue-300',
            bgGradient: 'from-blue-400 to-blue-500',
            icon: <Info className="w-5 h-5 text-white" />
        }
    };

    const currentStyle = styles[type] || styles.info;

    return (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-fadeIn">
            <div className={`bg-white py-4 px-6 rounded-xl shadow-2xl ${currentStyle.border} flex items-center space-x-3`}>
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${currentStyle.bgGradient} flex items-center justify-center`}>
                    {currentStyle.icon}
                </div>
                <div>
                    <h3 className="font-semibold text-gray-800">{title}</h3>
                    <p className="text-sm text-gray-600">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="ml-6 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default Alert;