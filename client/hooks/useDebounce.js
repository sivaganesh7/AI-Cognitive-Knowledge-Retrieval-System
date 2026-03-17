import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing a value (e.g., search input)
 * @param {any} value The value to debounce
 * @param {number} delay Delay in ms
 * @returns {any} The debounced value
 */
export default function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes (also on delay change or unmount)
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
