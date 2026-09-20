import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthContext";
import { BookOpen, Eye, EyeOff, Loader2 } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center sm:px-6 py-2 lg:px-8 bg-base-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-base-content">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-base-content/70">
          Or{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:text-indigo-500"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-base-100 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-base-300">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-error/10 border border-red-200 text-error px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-base-content"
              >
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 px-3 text-base-content ring-1 ring-inset ring-gray-300 placeholder:text-base-content/50 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-base-content"
              >
                Password
              </label>
              <div className="mt-2 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 px-3 pr-10 text-base-content ring-1 ring-inset ring-gray-300 placeholder:text-base-content/50 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-base-content/50 hover:text-base-content/70"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-base-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-base-content"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-primary hover:text-indigo-500"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-base-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-base-100 px-2 text-base-content/70">
                  Demo Account
                </span>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-base-content/70">
              Email: <b>student@example.com</b> <br />
              Password: <b>student123</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
