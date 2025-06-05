import React from 'react';

interface ToastProps {
  message: string;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => (
  <div className="fixed bottom-8 right-8 z-50">
    <div className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center animate-slide-in">
      <span>{message}</span>
      {onClose && (
        <button className="ml-4 text-white hover:text-gray-300" onClick={onClose}>✖️</button>
      )}
    </div>
    <style>
      {`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-slide-in { animation: slide-in 0.3s;}
      `}
    </style>
  </div>
);

export default Toast;
