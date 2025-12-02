import React from "react";
import { useRouter } from "next/navigation"; // Next.js 13+ App Router
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CustomTableProps {
  caption?: string;
  data: Record<string, any>[];
  columnHeaders: string[];
  path: string;
  rowClassName?: string;
  cellClassName?: (key: string, value: any) => string;
  onHeaderClick?: (header: string) => void;
  sortColumn?: string | null;
  sortDirection?: 'asc' | 'desc';
}

export function CustomTable({
                              caption,
                              data,
                              columnHeaders,
                              path,
                              rowClassName = "",
                              cellClassName,
                              onHeaderClick,
                              sortColumn,
                              sortDirection,
                            }: CustomTableProps) {
  const router = useRouter();

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  // Only show columns up to the number of headers provided
  const effectiveColumns = columns.slice(0, columnHeaders.length);

  const handleRowClick = (id: string | number) => {
    router.push(`${path}/${id}`);
  };

  return (
      <Table>
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {columnHeaders.map((header, index) => {
              const columnMap: Record<string, string> = {
                'Name': 'name',
                'Description': 'description',
                'Priority': 'priority',
                'Completed': 'completed',
                'Created at': 'createdAt',
                'Due Date': 'due_date',
                'Column': 'column',
                'Position': 'position'
              };
              const isActive = sortColumn === columnMap[header];
              return (
                <TableHead 
                  key={index}
                  onClick={() => onHeaderClick?.(header)}
                  className={onHeaderClick ? 'cursor-pointer hover:bg-slate-100 select-none' : ''}
                >
                  <div className="flex items-center gap-1">
                    {header}
                    {onHeaderClick && isActive && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
              <TableRow
                  key={rowIndex}
                  className={`${rowClassName} cursor-pointer`}
                  onClick={() => handleRowClick(row.id)}
              >
                {effectiveColumns.map((column, colIndex) => (
                    <TableCell
                        key={`${rowIndex}-${column}-${colIndex}`}
                        className={cellClassName ? cellClassName(column, row[column]) : ""}
                    >
                      {row[column]}
                    </TableCell>
                ))}
              </TableRow>
          ))}
        </TableBody>
      </Table>
  );
}
