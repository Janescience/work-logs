import React from 'react';

const Table = ({ 
  columns, 
  data, 
  className = '',
  headerClassName = '',
  rowClassName = '',
  cellClassName = '',
  emptyMessage = 'No data available',
  loading = false,
  onRowClick
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 border border-gray-300 bg-white">
        <div className="flex flex-col items-center text-black">
          <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-black rounded-full mb-2"></div>
          <span className="text-sm font-light">Loading...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 border border-gray-300 bg-white">
        <div className="text-gray-500">
          <div className="text-lg font-light mb-2">{emptyMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-gray-300 bg-white overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={`bg-gray-100 ${headerClassName}`}>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key || index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider"
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className={`${rowClassName} ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                onClick={() => onRowClick && onRowClick(row, rowIndex)}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key || colIndex}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${cellClassName}`}
                  >
                    {column.render 
                      ? column.render(row[column.key], row, rowIndex)
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;