// src/components/ui/ChevronIcon.tsx
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChevronIconProps {
  isOpen: boolean;
  className?: string;
}

export function ChevronIcon({ isOpen, className = '' }: ChevronIconProps) {
  return (
    <motion.span
      animate={{ rotate: isOpen ? 180 : 0 }}
      transition={{ duration: 0.2 }}
      className={`ml-2 inline-block ${className}`}
    >
      <ChevronDown size={16} />
    </motion.span>
  );
}