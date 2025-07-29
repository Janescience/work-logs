// Form validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password, minLength = 6) => {
  return password && password.length >= minLength;
};

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]+$/;
  return !phone || phoneRegex.test(phone);
};

// Form validation helper
export const createValidator = (rules) => {
  return (values) => {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
      const fieldRules = rules[field];
      const value = values[field];
      
      fieldRules.forEach(rule => {
        if (errors[field]) return; // Skip if already has error
        
        switch (rule.type) {
          case 'required':
            if (!validateRequired(value)) {
              errors[field] = rule.message || `${field} is required`;
            }
            break;
          case 'email':
            if (value && !validateEmail(value)) {
              errors[field] = rule.message || 'Invalid email format';
            }
            break;
          case 'password':
            if (value && !validatePassword(value, rule.minLength)) {
              errors[field] = rule.message || `Password must be at least ${rule.minLength || 6} characters`;
            }
            break;
          case 'phone':
            if (!validatePhone(value)) {
              errors[field] = rule.message || 'Invalid phone number format';
            }
            break;
          case 'custom':
            if (!rule.validator(value, values)) {
              errors[field] = rule.message;
            }
            break;
          default:
            break;
        }
      });
    });
    
    return errors;
  };
};