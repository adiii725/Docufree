import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Automatically selects correct API:
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = await res.json().catch(() => ({}));

      if (res.ok && body.token) {
        localStorage.setItem("token", body.token);

        if (body.user) {
          localStorage.setItem("user", JSON.stringify(body.user));
        }

        navigate("/dashboard");
      } else {
        setError(body.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-sky-50 relative overflow-hidden">
      {/* Blurred circles */}
      <div className="absolute -left-20 -top-20 w-72 h-72 bg-gradient-to-br from-indigo-200 to-indigo-400 rounded-full opacity-20 filter blur-3xl animate-blob" />
      <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-gradient-to-br from-sky-200 to-emerald-200 rounded-full opacity-15 filter blur-3xl animate-blob animation-delay-2000" />

      <form
        onSubmit={submit}
        className={`w-[500px] h-[500px] flex flex-col justify-center
          bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-100 relative z-10
          ${error ? "animate-shake" : ""}
        `}
      >
        <h2 className="text-3xl font-extrabold mb-4 text-gray-800 tracking-tight">
          Welcome back
        </h2>

        <p className="text-sm text-gray-500 mb-4">
          Sign in to access your DocuFree dashboard
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded">
            {error}
          </div>
        )}

        <label className="block mb-3">
          <span className="text-xs text-gray-600">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            name="email"
            type="email"
            placeholder="you@company.com"
            className="mt-1 w-full rounded-lg border border-gray-200 p-3 text-sm placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow
            shadow-sm hover:shadow-md"
          />
        </label>

        <label className="block mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Password</span>
            <span
              className={`text-xs font-medium ${
                password.length >= 8 ? "text-green-600" : "text-gray-400"
              }`}
            >
              {password.length >= 8 ? "Strong" : "Min 8 chars"}
            </span>
          </div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            name="password"
            type="password"
            placeholder="••••••••"
            className="mt-1 w-full rounded-lg border border-gray-200 p-3 text-sm placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow
            shadow-sm hover:shadow-md"
          />
        </label>

        <Button
          type="submit"
          variant="primary"
          className={`w-full py-3 rounded-lg font-medium text-white shadow hover:shadow-lg transform active:scale-[0.995]
            ${loading ? "opacity-80 cursor-not-allowed animate-pulse" : "btn-gradient"}
          `}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </Button>

        <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
          <div>
            <input id="remember" type="checkbox" className="mr-2" />
            <label htmlFor="remember">Remember me</label>
          </div>

          <span
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            Don’t have an account?
          </span>
        </div>
      </form>

      {/* All animations */}
      <style>
        {`
        .btn-gradient {
          background: linear-gradient(90deg, #6366f1 0%, #06b6d4 100%);
        }

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

        @media (max-width: 420px) {
          form { padding: 1.25rem; }
          h2 { font-size: 1.5rem; }
        }
      `}
      </style>
    </div>
  );
}
