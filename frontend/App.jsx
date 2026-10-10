import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Portfolio from "./pages/Portfolio";
import Booking from "./pages/Booking";
import Contact from "./pages/Contact";
import { AuthProvider } from "./context/AuthContext";
import AuthModal from "./components/AuthModal";
import MyBookingsModal from "./components/MyBookingsModal";
import ScrollToTop from "./components/ScrollToTop";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/bookings" element={<Admin initialTab="appointments" />} />
            <Route path="/admin/services" element={<Admin initialTab="services" />} />
          </Routes>
        </main>
        <Footer />
        {/* Global modals */}
        <AuthModal />
        <MyBookingsModal />
      </BrowserRouter>
    </AuthProvider>
  );
}
