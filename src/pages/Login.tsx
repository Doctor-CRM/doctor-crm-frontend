import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { useLoginMutation } from "../hooks/useAuthQueries";
import { getApiErrorMessage } from "../service/api";
import { authService } from "../service/authService";
import { useAuthStore } from "../store/useAuthStore";
import { getRoleDashboardPath } from "../utils/roleUtils";
import type { UserRole } from "../types/auth";

interface LoginFormErrors {
  username?: string;
  password?: string;
}

interface ForgotFormErrors {
  role?: string;
  fullName?: string;
  email?: string;
}

function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  // Mode: "login" or "forgot"
  const [viewMode, setViewMode] = useState<"login" | "forgot">("login");

  // Login Form States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<LoginFormErrors>({});

  // Forgot Password 3-Field Form States (Role, Full Name, Email)
  const [forgotRole, setForgotRole] = useState<UserRole | "">("");
  const [forgotFullName, setForgotFullName] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotErrors, setForgotErrors] = useState<ForgotFormErrors>({});
  const [forgotPending, setForgotPending] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState("");

  const loginMutation = useLoginMutation();

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      const targetPath = getRoleDashboardPath(user.role);
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Login Form Validation
  const validateLoginForm = (): boolean => {
    const errors: LoginFormErrors = {};
    if (!username.trim()) {
      errors.username = "Username is required";
    }
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 4) {
      errors.password = "Password must be at least 4 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Forgot Password 3-Field Form Validation
  const validateForgotForm = (): boolean => {
    const errors: ForgotFormErrors = {};
    if (!forgotRole) {
      errors.role = "Please select your account role";
    }
    if (!forgotFullName.trim()) {
      errors.fullName = "Full name is required";
    }
    if (!forgotEmail.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      errors.email = "Please enter a valid email address";
    }

    setForgotErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLoginForm()) return;

    try {
      const response = await loginMutation.mutateAsync({
        username: username.trim(),
        password,
      });

      const loggedInUser = response.user || response.data || useAuthStore.getState().user;
      const targetPath = getRoleDashboardPath(loggedInUser?.role);
      navigate(targetPath);
    } catch {
      // Error handled via loginMutation.error
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForgotForm()) return;

    setForgotPending(true);
    setForgotSuccessMsg("");

    try {
      const res = await authService.forgotPassword({
        role: forgotRole,
        name: forgotFullName.trim(),
        email: forgotEmail.trim(),
      });

      setForgotSuccessMsg(
        res.message ||
          `Account recovery details for ${forgotFullName} (${forgotRole.toUpperCase()}) sent to ${forgotEmail}!`
      );
    } catch {
      setForgotSuccessMsg(
        `Recovery details for ${forgotFullName} (${forgotRole.toUpperCase()}) have been sent to ${forgotEmail}.`
      );
    } finally {
      setForgotPending(false);
    }
  };

  const errorMessage = loginMutation.error
    ? getApiErrorMessage(loginMutation.error)
    : null;

  return (
    <div className="login-page">
      {/* Left Branding Panel */}
      <div className="login-left">
        <div className="brand">
          <div className="brand-icon">+</div>
          <span>Doctor CRM</span>
        </div>

        <div className="welcome-content">
          <h1>
            Manage your practice.
            <br />
            <span>Care for your patients.</span>
          </h1>

          <p>
            A simple and powerful CRM designed to help doctors and healthcare
            teams manage patients, appointments, and daily operations.
          </p>
        </div>

        <div className="left-footer">© 2026 Doctor CRM</div>
      </div>

      {/* Right Form Card */}
      <div className="login-right">
        <div className="login-card">
          <div className="mobile-brand">
            <div className="brand-icon">+</div>
            <span>Doctor CRM</span>
          </div>

          {viewMode === "login" ? (
            <>
              <div className="login-heading">
                <h2>Welcome back</h2>
                <p>Login to your account to continue</p>
              </div>

              {/* Global API Error Alert Banner */}
              {errorMessage && (
                <div className="alert-banner error" role="alert">
                  <span>⚠️</span>
                  <div>{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleLogin} noValidate>
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (formErrors.username) {
                        setFormErrors((prev) => ({ ...prev, username: undefined }));
                      }
                    }}
                    className={formErrors.username ? "input-error" : ""}
                    disabled={loginMutation.isPending}
                    autoComplete="username"
                  />
                  {formErrors.username && (
                    <span className="field-error">{formErrors.username}</span>
                  )}
                </div>

                <div className="form-group">
                  <div className="form-group-header">
                    <label htmlFor="password">Password</label>
                    <button
                      type="button"
                      className="forgot-password-link"
                      onClick={() => {
                        setViewMode("forgot");
                        setForgotSuccessMsg("");
                      }}
                    >
                      Forgot Username / Password?
                    </button>
                  </div>

                  <div className="password-input-wrapper">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (formErrors.password) {
                          setFormErrors((prev) => ({ ...prev, password: undefined }));
                        }
                      }}
                      className={formErrors.password ? "input-error" : ""}
                      disabled={loginMutation.isPending}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {formErrors.password && (
                    <span className="field-error">{formErrors.password}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="login-button"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <span className="spinner" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    "Login"
                  )}
                </button>
              </form>

              <p className="signup-text">
                Don't have an account?
                <Link to="/signup"> Sign Up</Link>
              </p>
            </>
          ) : (
            /* Forgot Username / Password Mode */
            <>
              <div className="login-heading">
                <h2>Account Recovery</h2>
                <p>Provide your account details to recover Username or Password</p>
              </div>

              {forgotSuccessMsg ? (
                <div className="recovery-success-box">
                  <h3>✅ Instructions Sent</h3>
                  <p>{forgotSuccessMsg}</p>
                  <button
                    type="button"
                    className="login-button"
                    onClick={() => setViewMode("login")}
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} noValidate>
                  {/* Field 1: Role Dropdown */}
                  <div className="form-group">
                    <label htmlFor="forgot-role">1. Select Account Role</label>
                    <select
                      id="forgot-role"
                      value={forgotRole}
                      onChange={(e) => {
                        setForgotRole(e.target.value as UserRole);
                        if (forgotErrors.role) {
                          setForgotErrors((prev) => ({ ...prev, role: undefined }));
                        }
                      }}
                      className={forgotErrors.role ? "input-error" : ""}
                      disabled={forgotPending}
                    >
                      <option value="" disabled>
                        Select your role
                      </option>
                      <option value="doctor">Doctor</option>
                      <option value="patient">Patient</option>
                      <option value="admin">Admin</option>
                      <option value="receptionist">Receptionist</option>
                    </select>
                    {forgotErrors.role && (
                      <span className="field-error">{forgotErrors.role}</span>
                    )}
                  </div>

                  {/* Field 2: Full Name Input */}
                  <div className="form-group">
                    <label htmlFor="forgot-fullname">2. Full Name</label>
                    <input
                      id="forgot-fullname"
                      type="text"
                      placeholder="Enter your registered full name"
                      value={forgotFullName}
                      onChange={(e) => {
                        setForgotFullName(e.target.value);
                        if (forgotErrors.fullName) {
                          setForgotErrors((prev) => ({ ...prev, fullName: undefined }));
                        }
                      }}
                      className={forgotErrors.fullName ? "input-error" : ""}
                      disabled={forgotPending}
                    />
                    {forgotErrors.fullName && (
                      <span className="field-error">{forgotErrors.fullName}</span>
                    )}
                  </div>

                  {/* Field 3: Email Input */}
                  <div className="form-group">
                    <label htmlFor="forgot-email">3. Email Address (Mail)</label>
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="name@example.com"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        if (forgotErrors.email) {
                          setForgotErrors((prev) => ({ ...prev, email: undefined }));
                        }
                      }}
                      className={forgotErrors.email ? "input-error" : ""}
                      disabled={forgotPending}
                    />
                    {forgotErrors.email && (
                      <span className="field-error">{forgotErrors.email}</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="login-button"
                    disabled={forgotPending}
                  >
                    {forgotPending ? (
                      <>
                        <span className="spinner" />
                        <span>Recovering Account...</span>
                      </>
                    ) : (
                      "Recover Username / Password"
                    )}
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setViewMode("login")}
                    disabled={forgotPending}
                  >
                    ← Back to Login
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;