// components/DetailModal.js
import React from 'react';

const DetailModal = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center overflow-y-auto"> {/* เพิ่ม overflow-y-auto ให้ Modal Container */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow-xl p-6 w-4/5 md:w-2/3 lg:w-1/2 max-h-screen overflow-y-auto"> {/* เพิ่ม max-h-screen และ overflow-y-auto ให้ Content Container */}
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{title}</h2>
        <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-300 max-h-[60vh] overflow-y-auto p-2 border border-gray-300 rounded">
          {content}
        </pre>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-400 text-white  font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;