 import React from 'react'
 import {BrowserRouter as Router,Routes,Route} from "react-router-dom"
import Signup from './Pages/Signup/Signup'
import Login from './Pages/Login/Login'
import Dashboard from './Componants/Layout/Dashboard'
import AddExpense from './Pages/Expenses/AddExpense'
import Navbar from './Componants/Layout/Navbar'
import { Sidebar } from 'lucide-react'
import Overview from './Pages/Dashboard/Overview'
import AddTransaction from './Componants/Layout/AddTransaction/AddTransaction'
import ShowExpense from './Pages/Expenses/ShowExpense'
import ShowCredits from './Pages/Credit/showCredits'
 
 

 const App = () => {
   return (
     <>
     <Router>
      <Routes>
        <Route path="/" element={<Signup/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/dashboard" element={<Dashboard/>}>
        <Route path="/dashboard/overview"element={<Overview/>} /> 
        <Route path="/dashboard/add-expense"element={<AddTransaction/>} /> 
        <Route path="/dashboard/show-expense"element={<ShowExpense/>} /> 
        <Route path="/dashboard/show-credits"element={<ShowCredits/>} /> 


        </Route>

       
  
        



      </Routes>
     </Router>
       
     </>
   )
 }
 
 export default App
 