/*import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { About } from "./components/About";
import { Footer } from "./components/Footer";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage"; // new login page
import LandingPage from "./pages/LandingPage"; // we’ll create this wrapper for your landing content
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";*/
 /*Create a wrapper for your existing landing sections
function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <About />
      </main>
      <Footer />
    </div>
  );
}*/
/*
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}*/
  import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import OcrResultsPage from "./pages/OcrResultsPage";
import SummarisationPage from "./pages/SummarisationPage";
import TranslationPage from "./pages/TranslationPage";

console.log("✅ App.tsx loaded");
//hello
// Protected Route wrapper - NOW checks for "token" (not "authToken")
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Check for "token" and "user" - matching what LoginPage saves
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  
  const isAuthenticated = !!(token && user);
  
  console.log("🔐 Auth check:", { 
    hasToken: !!token, 
    hasUser: !!user,
    isAuthenticated 
  });
  
  if (!isAuthenticated) {
    console.log("❌ Not authenticated, redirecting to /login");
    return <Navigate to="/login" replace />;
  }
  
  console.log("✅ Authenticated, allowing access");
  return <>{children}</>;
}

export default function App() {
  console.log("🚀 App rendering, path:", window.location.pathname);
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      
      {/* Protected Routes - Dashboard */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Routes - OCR Results */}
      <Route 
        path="/ocrresults" 
        element={
          <ProtectedRoute>
            <OcrResultsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Routes - Other Features */}
      <Route
        path="/summarisation"
        element={
          <ProtectedRoute>
          <SummarisationPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/translation"
        element={
          <ProtectedRoute>
            <TranslationPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/ai-assistance"
        element={
          <ProtectedRoute>
            <div className="min-h-screen p-8 bg-gray-50">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">AI Assistance</h1>
                <p className="text-gray-600 mb-6">This feature is coming soon!</p>
                <button 
                  onClick={() => window.history.back()}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  ← Go Back
                </button>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      
      {/* 404 Page */}
      <Route
        path="*"
        element={
          <div className="min-h-screen p-8 bg-red-50 flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">404</h1>
            <p className="text-xl text-red-800 mb-6">Page Not Found</p>
            <p className="text-gray-600 mb-8">The page "{window.location.pathname}" does not exist.</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Go to Home
            </button>
          </div>
        }
      />
    </Routes>
  );
}