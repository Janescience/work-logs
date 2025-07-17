// src/components/ExportOptions.js
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel, faSpinner } from '@fortawesome/free-solid-svg-icons';

function ExportOptions({ exportMonth, exportYear, setExportMonth, setExportYear, handleExport }) {
  const [isExporting, setIsExporting] = useState(false);

  const onExportClick = async () => {
    setIsExporting(true);
    try {
      await handleExport();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label 
            htmlFor="exportMonth" 
            className="text-sm font-medium text-gray-600"
          >
            Month
          </label>
          <select
            id="exportMonth"
            value={exportMonth}
            onChange={(e) => setExportMonth(parseInt(e.target.value))}
            className="px-0 py-2 text-black bg-transparent border-0 border-b-2 border-gray-200 focus:border-black focus:outline-none transition-colors appearance-none min-w-[120px]"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(exportYear, i, 1))}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label 
            htmlFor="exportYear" 
            className="text-sm font-medium text-gray-600"
          >
            Year
          </label>
          <select
            id="exportYear"
            value={exportYear}
            onChange={(e) => setExportYear(parseInt(e.target.value))}
            className="px-0 py-2 text-black bg-transparent border-0 border-b-2 border-gray-200 focus:border-black focus:outline-none transition-colors appearance-none min-w-[80px]"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </div>
      </div>

      <button
        onClick={onExportClick}
        className="px-6 py-3 bg-black text-white font-light tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black flex items-center gap-2"
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <FontAwesomeIcon icon={faSpinner} spin className="text-sm" />
            Exporting...
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faFileExcel} className="text-sm" />
            Export
          </>
        )}
      </button>
    </div>
  );
}

export default ExportOptions;