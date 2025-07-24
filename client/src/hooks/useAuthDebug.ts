// Debug hook for authentication issues
import { useEffect } from 'react';

export const useAuthDebug = () => {
  useEffect(() => {
    // Listen for localStorage changes
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    
    localStorage.setItem = function(key, value) {
      console.log(`🔧 localStorage.setItem: ${key} =`, value ? 'set' : 'cleared');
      return originalSetItem.call(this, key, value);
    };
    
    localStorage.removeItem = function(key) {
      console.log(`🗑️ localStorage.removeItem: ${key}`);
      return originalRemoveItem.call(this, key);
    };
    
    // Log current token state
    console.log('🔍 Current localStorage token:', localStorage.getItem('token') ? 'present' : 'not found');
    
    return () => {
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
    };
  }, []);
};