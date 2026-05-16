//Esta tabla la hizo y la utiliza Julian
import React from "react";

export interface TableColumn<T> {
  header: string;
  key: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  title?: string;
  columns: TableColumn<T>[];
  data: T[];
  emptyMessage?: string;
}

export function DataTable<T>({
  title,
  columns,
  data,
  emptyMessage = "No hay datos disponibles",
}: DataTableProps<T>) {
  const hasHeaders = columns.some((col) => col.header && col.header.trim() !== "");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {title && (
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
        </div>
      )}
      <div className="max-w-full overflow-x-auto">
        <table className="min-w-full">
          {hasHeaders && (
            <thead>
              <tr className="border-b border-gray-200 text-left dark:border-gray-800">
                {columns.map((col) => (
                  <th key={col.key} className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {data.length > 0 ? (
              data.map((item, idx) => (
                <tr key={idx} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.01]">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center italic text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}