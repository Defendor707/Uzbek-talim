import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

interface DataTableProps<T> {
  data: T[];
  columns: {
    id: string;
    header: string;
    cell: (row: T) => React.ReactNode;
    enableSorting?: boolean;
  }[];
  title?: string;
  isLoading?: boolean;
  enableSelection?: boolean;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  actionButton?: {
    label: string;
    icon?: string;
    onClick: () => void;
  };
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  isLoading = false,
  enableSelection = false,
  enableSearch = false,
  searchPlaceholder = 'Qidirish...',
  onSearch,
  actionButton,
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = React.useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleRowSelect = (id: string) => {
    setSelectedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectAll = () => {
    if (Object.keys(selectedRows).length === data.length) {
      setSelectedRows({});
    } else {
      const newSelectedRows: Record<string, boolean> = {};
      data.forEach((item, index) => {
        newSelectedRows[index.toString()] = true;
      });
      setSelectedRows(newSelectedRows);
    }
  };

  return (
    <div className="bg-white rounded-lg card-shadow">
      {(title || enableSearch || actionButton) && (
        <div className="p-4 border-b border-neutral-ultralight flex justify-between items-center flex-wrap gap-2">
          {title && <h2 className="text-lg font-heading font-medium text-neutral-dark">{title}</h2>}
          <div className="flex items-center gap-2 ml-auto">
            {enableSearch && (
              <div className="relative w-64">
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10"
                />
                <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-medium text-lg">search</span>
              </div>
            )}
            {actionButton && (
              <Button
                onClick={actionButton.onClick}
                className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white"
              >
                {actionButton.icon && <span className="material-icons text-sm">{actionButton.icon}</span>}
                {actionButton.label}
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {enableSelection && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={Object.keys(selectedRows).length === data.length && data.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead key={column.id}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={enableSelection ? columns.length + 1 : columns.length} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-8 w-8 border-4 border-t-primary border-neutral-ultralight rounded-full animate-spin mb-2"></div>
                      <span className="text-neutral-medium">Ma'lumotlar yuklanmoqda...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={enableSelection ? columns.length + 1 : columns.length} className="text-center py-8">
                    <div className="text-neutral-medium">Ma'lumotlar topilmadi</div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {enableSelection && (
                      <TableCell>
                        <Checkbox
                          checked={!!selectedRows[rowIndex.toString()]}
                          onCheckedChange={() => handleRowSelect(rowIndex.toString())}
                          aria-label={`Select row ${rowIndex}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={`${rowIndex}-${column.id}`}>
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
