export const formatPhone = (value) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  
  // If user typed 8 instead of 7 as first digit, still normalize it to +7
  const cleanDigits = digits.startsWith('7') || digits.startsWith('8') ? digits.substring(1) : digits;
  
  let res = '+7';
  if (cleanDigits.length > 0) res += '-' + cleanDigits.substring(0, 3);
  if (cleanDigits.length > 3) res += '-' + cleanDigits.substring(3, 6);
  if (cleanDigits.length > 6) res += '-' + cleanDigits.substring(6, 8);
  if (cleanDigits.length > 8) res += '-' + cleanDigits.substring(8, 10);
  
  return res;
};
