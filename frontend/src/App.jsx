import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./Context/storeContext";
import Landing from "./Pages/Landing/Landing";
import Login from "./Pages/Login/Login";
import Signup from "./Pages/Signup/Signup";
import Dashboard from "./Componants/Layout/Dashboard";
import AddTransaction from "./Componants/Layout/AddTransaction/AddTransaction";
import ShowExpense from "./Pages/Expenses/ShowExpense";
import ShowCredits from "./Pages/Credit/showCredits";
import Setting from "./Pages/Setting/Setting";
import PreferencesMatrix from "./Pages/Setting/PreferencesMatrix";
import Notifications from "./Pages/Notifications/Notifications";
import FallBack from "./Pages/FallBack/FallBack";
import Overview from "./Pages/Dashboard/Overview";
import Budgets from "./Pages/Dashboard/Budgets";
import Reports from "./Pages/Dashboard/Reports";
import AdminPanel from "./Pages/Dashboard/AdminPanel";
import ProtectedRoutes from "./ProtectedRoutes/ProtectedRoutes";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected workspace */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoutes>
                <Dashboard />
              </ProtectedRoutes>
            }
          >
            <Route index element={<Overview />} />
            <Route path="overview" element={<Overview />} />
            <Route path="add-expense" element={<AddTransaction />} />
            <Route path="show-expense" element={<ShowExpense />} />
            <Route path="show-credits" element={<ShowCredits />} />
            <Route path="setting" element={<Setting />} />
            <Route path="preferences" element={<PreferencesMatrix />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="budgets" element={<Budgets />} />
            <Route path="reports" element={<Reports />} />
            <Route
              path="admin"
              element={
                <ProtectedRoutes allowedRoles={["admin"]}>
                  <AdminPanel />
                </ProtectedRoutes>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<FallBack />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
