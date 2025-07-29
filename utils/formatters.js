// Date formatting utilities
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD HH:mm':
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    case 'DD MMM YYYY':
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${months[d.getMonth()]} ${year}`;
    default:
      return d.toLocaleDateString();
  }
};

// Number formatting utilities
export const formatNumber = (number, decimals = 0) => {
  if (isNaN(number)) return '0';
  return Number(number).toFixed(decimals);
};

export const formatHours = (hours) => {
  const num = parseFloat(hours);
  if (isNaN(num)) return '0.0';
  return num.toFixed(1);
};

// Text formatting utilities
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const formatCurrency = (amount, currency = 'THB') => {
  if (isNaN(amount)) return '0';
  
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Status formatting
export const getStatusColor = (status) => {
  const statusColors = {
    'todo': 'bg-gray-100 text-gray-800',
    'in progress': 'bg-blue-100 text-blue-800',
    'done': 'bg-green-100 text-green-800',
    'blocked': 'bg-red-100 text-red-800',
    'review': 'bg-yellow-100 text-yellow-800',
    'testing': 'bg-purple-100 text-purple-800',
  };
  
  return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
};