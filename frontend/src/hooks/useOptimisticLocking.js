import { useState } from 'react';

/**
 * Hook for handling optimistic locking conflicts when API returns 409 Conflict.
 * 
 * Usage:
 * ```
 * const { 
 *   conflictState, 
 *   handleConflict, 
 *   resetConflict 
 * } = useOptimisticLocking();
 * 
 * try {
 *   await updateRisk(riskId, data);
 * } catch (err) {
 *   if (err.status === 409) {
 *     handleConflict(err.data);
 *   }
 * }
 * ```
 */
export function useOptimisticLocking() {
  const [conflictState, setConflictState] = useState(null);

  const handleConflict = (conflictData) => {
    setConflictState({
      resourceId: conflictData.resourceId,
      expectedVersion: conflictData.expectedVersion,
      currentVersion: conflictData.currentVersion,
      currentData: conflictData.currentData,
      message: conflictData.message,
    });
  };

  const resetConflict = () => {
    setConflictState(null);
  };

  const resolveWithReload = () => {
    // Consumer should fetch fresh data
    resetConflict();
    return 'reload';
  };

  const resolveWithOverwrite = () => {
    // Consumer should retry with current version
    const version = conflictState.currentVersion;
    resetConflict();
    return { action: 'overwrite', version };
  };

  return {
    conflictState,
    hasConflict: conflictState !== null,
    handleConflict,
    resetConflict,
    resolveWithReload,
    resolveWithOverwrite,
  };
}
