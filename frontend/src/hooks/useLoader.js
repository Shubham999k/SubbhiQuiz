import { useState, useEffect } from 'react';

// minDuration removed — loading resolves immediately when data arrives.
// The old default of 3000ms was causing a guaranteed 3-second delay on every
// page even when the API responded in under 200ms.
export const useLoader = (initialState = true) => {
  const [loading, setLoading] = useState(initialState);
  const [showLoader, setShowLoader] = useState(initialState);

  useEffect(() => {
    if (!loading) {
      setShowLoader(false);
    } else {
      setShowLoader(true);
    }
  }, [loading]);

  return [showLoader, setLoading];
};
