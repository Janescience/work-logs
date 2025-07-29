import React from 'react';

const SummaryTable = ({
  title,
  data,
  columns,
  groupBy,
  calculateGroupTotal,
  calculateGrandTotal,
  renderGroupHeader,
  renderRow,
  className = '',
  emptyMessage = 'No data available for the selected period.'
}) => {
  const grandTotal = calculateGrandTotal ? calculateGrandTotal(data) : null;

  return (
    <div className={`mb-8 ${className}`}>
      {title && (
        <h2 className="mb-4 text-2xl font-light text-black">{title}</h2>
      )}
      <div className="overflow-x-auto border border-black bg-white p-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left font-medium uppercase tracking-wider text-gray-800 ${
                    column.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.length > 0 ? (
              data.map((group, groupIndex) => {
                const groupTotal = calculateGroupTotal ? calculateGroupTotal(group) : null;

                return (
                  <React.Fragment key={group._id || groupIndex}>
                    {/* Group Header */}
                    {renderGroupHeader && (
                      <tr className="bg-gray-50">
                        <td className="px-6 py-3 font-bold text-black" colSpan={columns.length}>
                          {renderGroupHeader(group)}
                        </td>
                      </tr>
                    )}

                    {/* Group Rows */}
                    {group.items ? (
                      group.items.map((item, itemIndex) => (
                        <tr key={item.id || itemIndex}>{renderRow(item, itemIndex, group)}</tr>
                      ))
                    ) : (
                      <tr>
                        {renderRow(group, groupIndex)}
                      </tr>
                    )}

                    {/* Group Total */}
                    {groupTotal && (
                      <tr className="bg-gray-100">
                        {columns.map((column, colIndex) => (
                          <td
                            key={colIndex}
                            className={`px-6 py-3 font-mono font-bold text-black ${
                              column.align === 'right' ? 'text-right' : 'text-left'
                            }`}
                          >
                            {column.renderGroupTotal ?
                              column.renderGroupTotal(groupTotal, colIndex) :
                              (colIndex === 0 && !column.renderGroupTotal) ?
                              '' :
                              groupTotal[column.key]?.toFixed?.(1) || groupTotal[column.key] || ''}
                          </td>
                        ))}
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>

          {/* Grand Total */}
          {grandTotal && (
            <tfoot>
              <tr className="bg-black text-white">
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-6 py-3 font-mono font-bold ${
                      column.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {column.renderGrandTotal ?
                      column.renderGrandTotal(grandTotal, colIndex) :
                      (colIndex === 0 && !column.renderGrandTotal) ?
                      'Grand Total' :
                      grandTotal[column.key]?.toFixed?.(1) || grandTotal[column.key] || ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default SummaryTable;