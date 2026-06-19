import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

interface AccountTimelineContextValue {
  accountId: string | null;
  showAllPinned: boolean;
  onShowAllPinned: () => void;
}

export const AccountTimelineContext =
  createContext<AccountTimelineContextValue | null>(null);

export function useAccountContext() {
  const values = useContext(AccountTimelineContext);
  if (!values) {
    throw new Error(
      'useAccountFilters must be used within an AccountTimelineProvider',
    );
  }
  return values;
}

export const useAccountContextValue = (accountId?: string | null) => {
  const [showAllPinned, setShowAllPinned] = useState(false);
  const handleShowAllPinned = useCallback(() => {
    setShowAllPinned(true);
  }, []);

  // Memoize the context value to avoid unnecessary re-renders.
  return useMemo(
    () => ({
      accountId: accountId ?? null,
      showAllPinned,
      onShowAllPinned: handleShowAllPinned,
    }),
    [accountId, handleShowAllPinned, showAllPinned],
  );
};
