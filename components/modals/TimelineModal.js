'use client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faProjectDiagram,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { ProjectTimeline } from '@/components/calendar';

const TimelineModal = ({ isOpen, onClose, allJiras = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose}>
      <div
        className="fixed inset-4 bg-white border border-gray-300 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-light text-black flex items-center gap-2">
                <FontAwesomeIcon icon={faProjectDiagram} className="text-gray-600 text-base" />
                My Timeline
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Project timeline and deployment schedule overview
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FontAwesomeIcon icon={faChartLine} />
                <span>Project view</span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-lg" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <ProjectTimeline allJiras={allJiras} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineModal;