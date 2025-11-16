import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./Pages/Signup/Signup";
import Login from "./Pages/Login/Login";
import Dashboard from "./Componants/Layout/Dashboard";
import AddExpense from "./Pages/Expenses/AddExpense";
import Navbar from "./Componants/Layout/Navbar";
import { Sidebar } from "lucide-react";
import Overview from "./Pages/Dashboard/Overview";
import AddTransaction from "./Componants/Layout/AddTransaction/AddTransaction";
import ShowExpense from "./Pages/Expenses/ShowExpense";
import ShowCredits from "./Pages/Credit/showCredits";
import Setting from "./Pages/Setting/Setting";
import FallBack from "./Pages/FallBack/FallBack";


import ProtectedRoutes from "./ProtectedRoutes/ProtectedRoutes";

const App = () => {
  return (
    <>

      <Router>
        
        
        <Routes>
          {/* public Route */}
          <Route path="/" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          {/* DashBoard Route //protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoutes>
              <Dashboard/>
            </ProtectedRoutes>
          }>
            {/* Default route inside Dashboard */}
            <Route index element={<Overview />} />

            <Route path="overview" element={<Overview />} />
            <Route path="add-expense" element={<AddTransaction />} />
            <Route path="show-expense" element={<ShowExpense />} />
            <Route path="show-credits" element={<ShowCredits />} />
            <Route path="setting" element={<Setting />} />
          </Route>

          {/* //fallback Routing */}
          <Route path="*" element={<FallBack />} />
        </Routes>
      </Router>
    </>
  );
};

export default App;
