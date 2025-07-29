// src/hooks/useAccordion.js
import { useState } from 'react';

function useAccordion(initialState = {}) {
  const [expanded, setExpanded] = useState(initialState);

  const toggle = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return [expanded, toggle];
}

export default useAccordion;