import { create } from 'zustand';

export type AuthIntentAction = {
  type: 'set-bookmark';
  eventId: number;
  shouldBookmark: boolean;
};

interface AuthIntentState {
  returnTo: string | null;
  pendingAction: AuthIntentAction | null;
  begin: (returnTo: string, pendingAction?: AuthIntentAction) => void;
  consumeReturnTo: () => string | null;
  consumeAction: () => AuthIntentAction | null;
  clear: () => void;
}

export const useAuthIntentStore = create<AuthIntentState>((set, get) => ({
  returnTo: null,
  pendingAction: null,
  begin: (returnTo, pendingAction) =>
    set({ returnTo, pendingAction: pendingAction ?? null }),
  consumeReturnTo: () => {
    const returnTo = get().returnTo;
    set({ returnTo: null });
    return returnTo;
  },
  consumeAction: () => {
    const pendingAction = get().pendingAction;
    set({ pendingAction: null });
    return pendingAction;
  },
  clear: () => set({ returnTo: null, pendingAction: null }),
}));
