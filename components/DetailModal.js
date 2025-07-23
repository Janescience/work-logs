// components/DetailModal.js
import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboard } from '@fortawesome/free-solid-svg-icons';

const DetailModal = ({ isOpen, onClose, title, content }) => {
  const [copyButtonText, setCopyButtonText] = useState('Copy'); // State สำหรับข้อความบนปุ่ม Copy
  const nodeRef = useRef(null);

  // Effect สำหรับปิด Modal ด้วยปุ่ม 'Esc'
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    
    // Reset ปุ่ม Copy เมื่อ Modal ถูกเปิดใหม่
    if (isOpen) {
      setCopyButtonText('Copy');
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ฟังก์ชันสำหรับ Copy เนื้อหา
  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopyButtonText('Copied!');
      setTimeout(() => {
        setCopyButtonText('Copy');
      }, 2000); // เปลี่ยนกลับเป็น "Copy" หลังจาก 2 วินาที
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      setCopyButtonText('Failed!');
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      <Draggable nodeRef={nodeRef} handle=".modal-handle" cancel=".no-drag">
        <div 
          ref={nodeRef} 
          // 1. ปรับขนาด Modal ให้เกือบเต็มจอ
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-7xl flex flex-col" 
        >
          {/* Header */}
          <div className="modal-handle cursor-move bg-gray-100 dark:bg-gray-700 p-4 rounded-t-lg border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto no-drag" style={{ maxHeight: '80vh' }}>
            <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 border border-gray-300 dark:border-gray-600 rounded-md font-mono text-sm">
              {content}
            </pre>
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 flex justify-end items-center space-x-4 rounded-b-lg no-drag">
            {/* 2. เพิ่มปุ่ม Copy */}
            <button
              onClick={handleCopy}
              className=" py-2  text-white font-semibold rounded-md  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white w-24"
            >
              <FontAwesomeIcon icon={faClipboard} size="sm" />
            </button>
          </div>
        </div>
      </Draggable>
    </div>
  );
};

export default DetailModal;