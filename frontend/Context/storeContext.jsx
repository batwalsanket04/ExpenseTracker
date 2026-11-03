/* eslint-disable react-refresh/only-export-components */
import React, { useState, createContext } from "react";

export const Context = createContext(null);

const StoreContext = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  
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
