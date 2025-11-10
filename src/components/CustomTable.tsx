import React from 'react';
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
  columnHeaders: string[]; // Simple list of header names (display labels)
  rowClassName?: string;
  cellClassName?: (key: string, value: any) => string;
}

export function CustomTable({
  caption,
  data,
  columnHeaders,
  rowClassName = "",
  cellClassName,
}: CustomTableProps) {
  // Extract column keys from the first row, or return empty if no data
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  // Align the columns we render with the provided columnHeaders.
  // Common mismatch: backend rows include an `id` key but the UI headers omit it
  // (we want to display Name/Description/Color/Created At, not the internal id column).
  let effectiveColumns = [...columns];
  if (columnHeaders && columnHeaders.length && columnHeaders.length !== effectiveColumns.length) {
    if (effectiveColumns[0] === "id" && columnHeaders.length === effectiveColumns.length - 1) {
      effectiveColumns = effectiveColumns.slice(1);
    } else if (columnHeaders.length < effectiveColumns.length) {
      effectiveColumns = effectiveColumns.slice(0, columnHeaders.length);
    }
    // If headers are more than keys, we keep effectiveColumns as-is; cells will be empty for extra headers.
  }

  return (
    <Table>
      {caption && <TableCaption>{caption}</TableCaption>}
      <TableHeader>
        <TableRow>
          {columnHeaders.map((header, index) => (
            <TableHead key={index}>
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, rowIndex) => (
          <TableRow key={rowIndex} className={rowClassName}>
            {effectiveColumns.map((column, colIndex) => (
              <TableCell
                key={`${rowIndex}-${column}-${colIndex}`}
                className={cellClassName ? cellClassName(column, row[column]) : ""}
              >
                {row[column]}
              </TableCell>
            ))}
            {/* If there are more headers than keys, render empty cells to keep layout stable */}
            {columnHeaders.length > effectiveColumns.length &&
              Array(columnHeaders.length - effectiveColumns.length)
                .fill(0)
                .map((_, i) => (
                  <TableCell key={`pad-${rowIndex}-${i}`} />
                ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}