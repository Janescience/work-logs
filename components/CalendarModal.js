// components/CalendarModal.js
'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import WorkCalendar from '@/components/WorkCalendar';

const CalendarModal = ({ isOpen, onClose, allJiras }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-2">
            <div className="flex items-center justify-end">
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-black transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white ">
            <WorkCalendar allJiras={allJiras} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;