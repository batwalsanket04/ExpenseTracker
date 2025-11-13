import React, { useState, createContext, useEffect } from "react";

export const Context = createContext(null);

const StoreContext = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  const ToggleMode = () => {
    setIsDark(!isDark);
  };

  
  return (
    <Context.Provider
      value={{
        token,
        setToken,
         
      }}
    >
      {children}
    </Context.Provider>
  );
};

export default StoreContext;
