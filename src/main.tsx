import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import App from "./App"
import RegisterPage from "./pages/RegisterPage"
import ScannerPage from "./pages/ScannerPage"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename="/pulse-security">
      <>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/scan" element={<ScannerPage />} />
        </Routes>
        <ToastContainer position="bottom-center" autoClose={3000} />
      </>
    </BrowserRouter>
  </React.StrictMode>
)
