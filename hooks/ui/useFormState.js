import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for form state management with validation
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules for each field
 * @returns {Object} Form state and methods
 */
const useFormState = (initialValues = {}, validationRules = {}) => {
  const initialValuesRef = useRef(initialValues);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((field, value, currentValues = values) => {
    const rule = validationRules[field];
    if (!rule) return null;

    let error = null;
    
    if (typeof rule === 'function') {
      error = rule(value, currentValues);
    } else if (typeof rule === 'object') {
      // Handle multiple validation rules
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        error = rule.required === true ? `${field} is required` : rule.required;
      } else if (rule.minLength && value && value.length < rule.minLength) {
        error = `${field} must be at least ${rule.minLength} characters`;
      } else if (rule.maxLength && value && value.length > rule.maxLength) {
        error = `${field} must be no more than ${rule.maxLength} characters`;
      } else if (rule.pattern && value && !rule.pattern.test(value)) {
        error = rule.message || `${field} format is invalid`;
      } else if (rule.custom) {
        error = rule.custom(value, currentValues);
      }
    }
    
    return error;
  }, [validationRules]);

  const setValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Validate if field has been touched
    setTouched(currentTouched => {
      if (currentTouched[field]) {
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
      }
      return currentTouched;
    });
  }, [validateField]);

  const setFieldTouched = useCallback((field, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  const handleChange = useCallback((field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValue(field, value);
  }, [setValue]);

  const handleBlur = useCallback((field) => (e) => {
    setFieldTouched(field, true);
    const error = validateField(field, e.target.value);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [setFieldTouched, validateField]);

  const validateAll = useCallback(() => {
    let isValid = true;
    const newErrors = {};

    // Use functional update to get current values without dependency
    setValues(currentValues => {
      Object.keys(validationRules).forEach(field => {
        const error = validateField(field, currentValues[field], currentValues);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      });

      setErrors(newErrors);
      setTouched(Object.keys(validationRules).reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {}));

      return currentValues;
    });

    return isValid;
  }, [validationRules, validateField]);

  const reset = useCallback((newValues = initialValuesRef.current) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, []);

  const setFieldError = useCallback((field, error) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearFieldError = useCallback((field) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const hasErrors = Object.values(errors).some(error => error);
  const isValid = !hasErrors && Object.keys(touched).length > 0;

  return {
    // State
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    hasErrors,

    // Methods
    setValue,
    setFieldTouched,
    setIsSubmitting,
    handleChange,
    handleBlur,
    validateAll,
    validateField,
    reset,
    setFieldError,
    clearFieldError,

    // Helpers  
    getFieldProps: (field) => ({
      value: values[field] || '',
      onChange: handleChange(field),
      onBlur: handleBlur(field),
      error: touched[field] ? errors[field] : undefined
    })
  };
};

export default useFormState;