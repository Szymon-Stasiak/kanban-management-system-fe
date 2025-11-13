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
}

export function CustomTable({
                              caption,
                              data,
                              columnHeaders,
                              path,
                              rowClassName = "",
                              cellClassName,
                            }: CustomTableProps) {
  const router = useRouter();

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const effectiveColumns = [...columns];

  const handleRowClick = (id: string | number) => {
    router.push(`${path}/${id}`);
  };

  return (
      <Table>
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {columnHeaders.map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
            ))}
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
                {columnHeaders.length > effectiveColumns.length &&
                    Array(columnHeaders.length - effectiveColumns.length)
                        .fill(0)
                        .map((_, i) => <TableCell key={`pad-${rowIndex}-${i}`} />)}
              </TableRow>
          ))}
        </TableBody>
      </Table>
  );
}
