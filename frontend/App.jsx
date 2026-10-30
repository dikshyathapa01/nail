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
import AuthCallback from "./pages/AuthCallback";
import AdminRouteGuard from "./components/AdminRouteGuard";

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
            <Route path="/admin" element={<AdminRouteGuard><Admin /></AdminRouteGuard>} />
            <Route path="/admin/bookings" element={<AdminRouteGuard><Admin initialTab="appointments" /></AdminRouteGuard>} />
            <Route path="/admin/services" element={<AdminRouteGuard><Admin initialTab="services" /></AdminRouteGuard>} />
            <Route path="/auth/callback" element={<AuthCallback />} />
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
