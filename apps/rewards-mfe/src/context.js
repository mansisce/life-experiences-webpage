import { createContext, useContext } from "react";

export const RewardsContext = createContext(null);

/** { api, links, toast } for any screen inside <RewardsApp/>. */
export function useRewards() {
  const value = useContext(RewardsContext);
  if (!value) throw new Error("useRewards must be used inside <RewardsApp/>");
  return value;
}
