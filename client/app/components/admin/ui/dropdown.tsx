"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  /** Optional action shown at the bottom of the open list. */
  footer?: React.ReactNode;
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className,
  disabled,
  id,
  'aria-label': ariaLabel,
  footer,
}: DropdownProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} aria-label={ariaLabel} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
        {footer && <div className="border-t border-white/10 p-1">{footer}</div>}
      </SelectContent>
    </Select>
  );
}
