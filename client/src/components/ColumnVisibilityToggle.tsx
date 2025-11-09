import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2 } from "lucide-react";

interface Column {
  id: string;
  label: string;
  defaultVisible?: boolean;
}

interface ColumnVisibilityToggleProps {
  columns: Column[];
  storageKey: string;
  onVisibilityChange: (visibleColumns: string[]) => void;
}

export function ColumnVisibilityToggle({
  columns,
  storageKey,
  onVisibilityChange,
}: ColumnVisibilityToggleProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return columns
        .filter((col) => col.defaultVisible !== false)
        .map((col) => col.id);
    }

    const stored = localStorage.getItem(storageKey);
    const defaultColumns = columns
      .filter((col) => col.defaultVisible !== false)
      .map((col) => col.id);

    if (stored) {
      try {
        const storedColumns = JSON.parse(stored);
        const allColumnIds = columns.map((col) => col.id);
        const validStoredColumns = storedColumns.filter((id: string) => 
          allColumnIds.includes(id)
        );
        const newColumns = allColumnIds.filter(
          (id) => !storedColumns.includes(id) && defaultColumns.includes(id)
        );
        return [...validStoredColumns, ...newColumns];
      } catch {
        return defaultColumns;
      }
    }
    return defaultColumns;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
    onVisibilityChange(visibleColumns);
  }, [visibleColumns, storageKey, onVisibilityChange]);

  const toggleColumn = (columnId: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const showAll = () => {
    setVisibleColumns(columns.map((col) => col.id));
  };

  const hideAll = () => {
    setVisibleColumns([]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-column-visibility">
          <Settings2 className="h-4 w-4 mr-2" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Toggle Columns</h4>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={showAll}
                className="h-7 text-xs"
                data-testid="button-show-all-columns"
              >
                Show All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={hideAll}
                className="h-7 text-xs"
                data-testid="button-hide-all-columns"
              >
                Hide All
              </Button>
            </div>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {columns.map((column) => (
              <div
                key={column.id}
                className="flex items-center space-x-2"
                data-testid={`checkbox-column-${column.id}`}
              >
                <Checkbox
                  id={`column-${column.id}`}
                  checked={visibleColumns.includes(column.id)}
                  onCheckedChange={() => toggleColumn(column.id)}
                />
                <Label
                  htmlFor={`column-${column.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {column.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
