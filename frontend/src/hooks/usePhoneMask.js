import { useCallback } from 'react';

export const usePhoneMask = () => {
  const handlePhoneChange = useCallback((e, setFormData) => {
    let value = e.target.value;
    if (!value) {
      setFormData(prev => ({ ...prev, [e.target.name]: '' }));
      return;
    }

    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) {
      setFormData(prev => ({ ...prev, [e.target.name]: '' }));
      return;
    }
    
    // Normalize first digit if it's 7 or 8
    const cleanDigits = digits.startsWith('7') || digits.startsWith('8') ? digits.substring(1) : digits;
    
    let res = '+7';
    if (cleanDigits.length > 0) res += '-' + cleanDigits.substring(0, 3);
    if (cleanDigits.length > 3) res += '-' + cleanDigits.substring(3, 6);
    if (cleanDigits.length > 6) res += '-' + cleanDigits.substring(6, 8);
    if (cleanDigits.length > 8) res += '-' + cleanDigits.substring(8, 10);

    setFormData(prev => ({ ...prev, [e.target.name]: res }));
  }, []);

  return { handlePhoneChange };
};
