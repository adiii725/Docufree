import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.firstName || !form.lastName || !form.email || !form.contact || !form.password) {
      setError("Please fill all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        navigate("/login");
      } else {
        setError(body.message || `Signup failed (status ${res.status})`);
      }
    } catch (err) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-sky-50 relative overflow-hidden">
      {/* Decorative animated blobs */}
      <div className="absolute -left-20 -top-20 w-72 h-72 bg-gradient-to-br from-indigo-200 to-indigo-400 rounded-full opacity-20 filter blur-3xl animate-blob" />
      <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-gradient-to-br from-sky-200 to-emerald-200 rounded-full opacity-15 filter blur-3xl animate-blob animation-delay-2000" />

      {/* Card */}
      <form
        onSubmit={onSubmit}
        className={`w-[500px] h-[500px] flex flex-col justify-center
    bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-100 relative z-10
    ${error ? "animate-shake" : ""}
          `}
      >

        {/* Header: centered top */}
        <div className="w-full text-center mb-6">
          <h2 className="text-4xl font-extrabold text-gray-800">Create Account</h2>
          <p className="text-sm text-gray-500 mt-2">
            Start using DocuFree to manage and process documents with AI.
          </p>
        </div>

        {error && (
          <div className="w-full mb-4 text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded text-center">
            {error}
          </div>
        )}

        {/* Inputs stacked vertically */}
        <div className="w-full space-y-3">
          <div>
            <label htmlFor="firstName" className="sr-only">First Name</label>
            <input
              id="firstName"
              name="firstName"
              value={form.firstName}
              onChange={onChange}
              placeholder="First Name"
              className="w-full rounded-lg border border-gray-200 p-3 text-sm placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow shadow-sm hover:shadow-md"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="sr-only">Last Name</label>
            <input
              id="lastName"
              name="lastName"
              value={form.lastName}
              onChange={onChange}
              placeholder="Last Name"
              className="w-full rounded-lg border border-gray-200 p-3 text-sm placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow shadow-sm hover:shadow-md"
            />
          </div>

          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="Email"
              className="w-full rounded-lg border border-gray-200 p-3 text-sm placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow shadow-sm hover:shadow-md"
            />
          </div>

          <div>
            <label htmlFor="contact" className="sr-only">Contact</label>
            <input
              id="contact"
              name="contact"
              value={form.contact}
              onChange={onChange}
              placeholder="Contact Number"
              className="w-full rounded-lg border border-gray-200 p-3 text-sm placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow shadow-sm hover:shadow-md"
            />
          </div>

          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              placeholder="Password (min 8 chars)"
              className="w-full rounded-lg border border-gray-200 p-3 text-sm placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow shadow-sm hover:shadow-md"
            />
            <div className="text-xs mt-2 text-gray-500 text-right">
              Password strength:{" "}
              <span className={form.password.length >= 8 ? "text-green-600" : "text-gray-400"}>
                {form.password.length >= 8 ? "Good" : "Too short"}
              </span>
            </div>
          </div>
        </div>

        {/* Button */}
        <div className="w-full mt-6">
          <Button
            type="submit"
            variant="primary"
            className={`w-full py-3 rounded-lg font-medium text-white shadow hover:shadow-lg transform active:scale-[0.995]
              ${loading ? "opacity-80 cursor-not-allowed animate-pulse" : "btn-gradient"}`}
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign up"}
          </Button>
        </div>

        {/* Small footer link for mobile */}
        <p className="mt-4 text-sm text-gray-600 text-center md:hidden w-full">
          Already have an account?{" "}
          <span className="text-blue-600 cursor-pointer" onClick={() => navigate("/login")}>
            Log in
          </span>
        </p>
      </form>

      {/* Styles */}
      <style>{`
        .btn-gradient { background: linear-gradient(90deg, #6366f1 0%, #06b6d4 100%); }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(15px, -10px) scale(1.05); }
          66% { transform: translate(-10px, 15px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 8s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 600ms cubic-bezier(.36,.07,.19,.97) both; }
        .backdrop-blur-md { -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }

        @media (min-width: 768px) {
          form { min-height: 560px; }
        }
        @media (max-width: 767px) {
          form { padding: 1.25rem; }
        }
      `}</style>
    </div>
  );
}
