import { useState, useEffect } from 'react';

export const useLoader = (initialState = true, minDuration = 3000) => {
  const [loading, setLoading] = useState(initialState);
  const [showLoader, setShowLoader] = useState(initialState);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!loading) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(minDuration - elapsed, 0);
      const timer = setTimeout(() => setShowLoader(false), remaining);
      return () => clearTimeout(timer);
    } else {
        setShowLoader(true);
    }
  }, [loading, startTime, minDuration]);

  return [showLoader, setLoading];
};
