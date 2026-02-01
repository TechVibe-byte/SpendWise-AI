
export const formatCurrency = (value: number): string => {
  if (isNaN(value)) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    // Show 2 decimal places if there are cents, otherwise 0 for clean look
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(value);
};
