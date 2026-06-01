import React from 'react';

/**
 * DataTable - Standard Institutional Grid Component
 * Refined to the 'Simplified Premium' aesthetic with rounded-2xl and 1px headers.
 */
const DataTable = ({
    headers = [],
    columnCount,
    loading = false,
    emptyMessage = "No Records Found",
    footer,
    children,
    tableClassName = "min-w-full lg:min-w-[800px]"
}) => {
    const effectiveColumnCount = columnCount || headers.length || 1;
    return (
        <div className="bg-white border-table shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <div className="mobile-table-scroll overflow-x-auto custom-scrollbar scrolling-touch">
                <table className={`w-full text-left border-collapse border border-black ${tableClassName}`}>
                    <thead>
                        <tr className="bg-table-header border-b-table">
                            {headers.map((header, idx) => (
                                <th
                                    key={idx}
                                    className={`px-2 py-2.5 text-[10px] lg:text-[11px] font-black text-table-header uppercase border-r-table tracking-wider ${header.className || ''}`}
                                >
                                    {header.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={effectiveColumnCount} className="px-8 py-24 text-center border-b-table ">
                                    <div className="flex flex-col items-center gap-10">
                                        <div className="w-12 h-12 border-2 border-table border-t-table rounded-full animate-spin"></div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-table-cell opacity-60 animate-pulse">Synchronizing Registry...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : React.Children.count(children) === 0 ? (
                            <tr>
                                <td colSpan={effectiveColumnCount} className="px-8 py-32 text-center border-b-table">
                                    <div className="flex flex-col items-center gap-10 grayscale opacity-40">
                                        <div className="w-20 h-20 bg-institutional-page rounded-2xl flex items-center justify-center border-table shadow-inner">
                                            <span className="text-4xl text-table-cell">∅</span>
                                        </div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-table-cell">
                                            {emptyMessage}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            children
                        )}
                    </tbody>
                </table>
            </div>

            {/* Table Footer / Pagination Placeholder */}
            {footer && (
                <div className="p-4 bg-white">
                    {footer}
                </div>
            )}
        </div>
    );
};

export default DataTable;
