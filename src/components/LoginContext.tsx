import React from "react";

export default React.createContext<{
  signOut: () => void;
}>({
  signOut: () => {
    throw new Error("signOut not defined");
  },
});
