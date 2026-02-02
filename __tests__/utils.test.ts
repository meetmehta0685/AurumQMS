import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn (classNames merger)', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-4', 'py-2');
      expect(result).toBe('px-4 py-2');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class active-class');
    });

    it('should exclude falsy values', () => {
      const isActive = false;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class');
    });

    it('should merge tailwind classes and resolve conflicts', () => {
      const result = cn('px-4', 'px-6');
      expect(result).toBe('px-6');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['px-4', 'py-2']);
      expect(result).toBe('px-4 py-2');
    });

    it('should handle objects with conditional classes', () => {
      const result = cn({
        'base-class': true,
        'active-class': true,
        'disabled-class': false,
      });
      expect(result).toBe('base-class active-class');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle null and undefined', () => {
      const result = cn('class-a', null, undefined, 'class-b');
      expect(result).toBe('class-a class-b');
    });

    it('should merge responsive classes correctly', () => {
      const result = cn('text-sm', 'md:text-base', 'lg:text-lg');
      expect(result).toBe('text-sm md:text-base lg:text-lg');
    });

    it('should resolve color conflicts', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toBe('bg-blue-500');
    });

    it('should handle multiple arguments of different types', () => {
      const result = cn(
        'base',
        ['array-class'],
        { 'object-class': true },
        false && 'conditional',
        'final'
      );
      expect(result).toBe('base array-class object-class final');
    });
  });
});
