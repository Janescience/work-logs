// components/DetailModal.js
import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboard, 
  faCheck, 
  faTimes, 
  faExpand,
  faCompress,
  faGripHorizontal
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui';

const DetailModal = ({ isOpen, onClose, title, content }) => {
  const [copyButtonText, setCopyButtonText] = useState('Copy');
  const [copyIcon, setCopyIcon] = useState(faClipboard);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
      setCopyButtonText('Copy');
      setCopyIcon(faClipboard);
      setIsFullscreen(false);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Copy function with improved feedback
  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopyButtonText('Copied!');
      setCopyIcon(faCheck);
      setTimeout(() => {
        setCopyButtonText('Copy');
        setCopyIcon(faClipboard);
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      setCopyButtonText('Failed');
      setTimeout(() => {
        setCopyButtonText('Copy');
      }, 2000);
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Determine modal size based on fullscreen state
  const modalSizeClass = isFullscreen 
    ? "w-full h-full max-w-none rounded-none" 
    : "w-full max-w-4xl max-h-[85vh] rounded-lg";

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
              <h2 className="text-lg font-semibold tracking-wide">{title}</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                className="text-white hover:bg-white/10"
              >
                <FontAwesomeIcon 
                  icon={isFullscreen ? faCompress : faExpand} 
                  className="text-sm"
                />
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={onClose} 
                title="Close"
                className="text-white hover:bg-white/10"
              >
                <FontAwesomeIcon icon={faTimes} className="text-lg" />
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
            {/* Toolbar */}
            <div className="px-4 py-3 bg-white border-b border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{content ? content.length : 0}</span> characters
              </div>
              
              <Button
                variant={copyIcon === faCheck ? "success" : "primary"}
                size="sm"
                onClick={handleCopy}
                className="flex items-center gap-2"
              >
                <FontAwesomeIcon icon={copyIcon} className="text-xs" />
                {copyButtonText}
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-drag p-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <pre className="p-6 text-sm font-mono text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                  {content || 'No content available'}
                </pre>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">Esc</kbd> to close
            </div>
            
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </Draggable>
    </div>
  );
};

export default DetailModal;