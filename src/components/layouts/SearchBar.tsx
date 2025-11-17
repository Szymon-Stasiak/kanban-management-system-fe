'use client';
import React, {useState, useEffect, useRef} from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value = '', onChange, placeholder = 'Search...' }: SearchBarProps) {
  const [text, setText] = useState(value);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setText(newValue);
    
    // Debounce the onChange call
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      if (onChange) {
        console.log('SearchBar: Debounced onChange, value:', newValue.trim());
        onChange(newValue.trim());
      }
    }, 500); // 500ms debounce
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onChange) {
      // Clear debounce timer and trigger immediately
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      console.log('SearchBar: Enter pressed, value:', text.trim());
      onChange(text.trim());
    }
  }

  return (
    <div className="flex items-center gap-2 w-full max-w-md">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-gray-400" />
        </div>
        <Input
          className="pl-10"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
