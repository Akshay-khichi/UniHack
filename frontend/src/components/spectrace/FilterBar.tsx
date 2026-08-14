import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search products...",
  filters,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters: FilterConfig[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-9 pl-8"
        />
      </div>
      {filters.map((filter) => (
        <Select key={filter.id} value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger className="h-9 w-[170px]" aria-label={filter.label}>
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}
