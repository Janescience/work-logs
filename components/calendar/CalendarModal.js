// components/CalendarModal.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faXmark, 
  faExpand,
  faCompress,
  faGripHorizontal,
  faClipboard,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { WorkCalendar } from '@/components/calendar';

const CalendarModal = ({ isOpen, onClose, allJiras }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copy Table');
  const [copyIcon, setCopyIcon] = useState(faClipboard);
  const nodeRef = useRef(null);

  // Effect for Esc key and reset
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    
    // Reset when modal opens
    if (isOpen) {
      setCopyButtonText('Copy Table');
      setCopyIcon(faClipboard);
      setIsFullscreen(false);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Copy table data to clipboard - matching WorkCalendar functionality
  const handleCopy = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const numDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Create a map to organize data by JIRA
    const jiraMap = new Map();
    
    allJiras.forEach(jira => {
      jira.dailyLogs.forEach(log => {
        const logDate = new Date(log.logDate);
        if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
          const dayOfMonth = logDate.getDate();
          const hours = parseFloat(log.timeSpent || 0);
          
          if (!jiraMap.has(jira.jiraNumber)) {
            jiraMap.set(jira.jiraNumber, {
              jiraNumber: jira.jiraNumber,
              description: jira.description,
              totalHours: 0,
              logsByDay: {}
            });
          }
          
          const jiraEntry = jiraMap.get(jira.jiraNumber);
          jiraEntry.totalHours += hours;
          jiraEntry.logsByDay[dayOfMonth] = (jiraEntry.logsByDay[dayOfMonth] || 0) + hours;
        }
      });
    });
    
    let copyText = '';
    
    // Header row
    copyText += 'No.\tReference/JIRA#\tDescription\tTotal HRs';
    for (let day = 1; day <= numDays; day++) {
      copyText += `\t${day}`;
    }
    copyText += '\n';
    
    // Data rows
    const timesheetData = Array.from(jiraMap.values());
    timesheetData.forEach((jira, index) => {
      copyText += `${index + 1}\t${jira.jiraNumber}\t${jira.description}\t${jira.totalHours.toFixed(1)}`;
      
      for (let day = 1; day <= numDays; day++) {
        const hours = jira.logsByDay[day];
        copyText += `\t${hours || ''}`;
      }
      copyText += '\n';
    });
    
    navigator.clipboard.writeText(copyText).then(() => {
      setCopyButtonText('Copied!');
      setCopyIcon(faCheck);
      setTimeout(() => {
        setCopyButtonText('Copy Table');
        setCopyIcon(faClipboard);
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      setCopyButtonText('Failed');
      setTimeout(() => {
        setCopyButtonText('Copy Table');
        setCopyIcon(faClipboard);
      }, 2000);
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Determine modal size based on fullscreen state - smaller and fully visible
  const modalSizeClass = isFullscreen 
    ? "w-full h-full max-w-none rounded-none" 
    : "w-full max-w-6xl h-[90vh] rounded-lg";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <Draggable 
        nodeRef={nodeRef} 
        handle=".modal-handle" 
        cancel=".no-drag"
        disabled={isFullscreen}
      >
        <div 
          ref={nodeRef}
          className={`bg-white shadow-2xl flex flex-col transform transition-all duration-300 ${modalSizeClass}`}
          style={isFullscreen ? { margin: 0 } : {}}
        >
          {/* Header */}
          <div className="modal-handle bg-gradient-to-r from-gray-900 to-gray-700 text-white p-4 flex justify-between items-center border-b border-gray-200">
            <div className="flex items-center gap-3">
              {!isFullscreen && (
                <FontAwesomeIcon 
                  icon={faGripHorizontal} 
                  className="text-gray-400 cursor-move" 
                />
              )}
              <h2 className="text-lg font-semibold tracking-wide">Month Summary</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCopy}
                className="no-drag px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 bg-white/10 hover:bg-white/20"
                title="Copy table data for Excel/Google Sheets"
              >
                <FontAwesomeIcon icon={copyIcon} className="text-xs" />
                {copyButtonText}
              </button>
              <button 
                onClick={toggleFullscreen}
                className="no-drag p-2 hover:bg-white/10 rounded transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                <FontAwesomeIcon 
                  icon={isFullscreen ? faCompress : faExpand} 
                  className="text-sm"
                />
              </button>
              <button 
                onClick={onClose} 
                className="no-drag p-2 hover:bg-white/10 rounded transition-colors"
                title="Close"
              >
                <FontAwesomeIcon icon={faXmark} className="text-lg" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
            {/* Content */}
            <div className="flex-1 overflow-y-auto no-drag">
              <WorkCalendar allJiras={allJiras} />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">Esc</kbd> to close
            </div>
            
            <button
              onClick={onClose}
              className="no-drag px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Draggable>
    </div>
  );
};

export default CalendarModal;