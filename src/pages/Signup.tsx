import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Signup.css";
import { useSignupMutation } from "../hooks/useAuthQueries";
import { getApiErrorMessage } from "../service/api";
import type { UserRole } from "../types/auth";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [showPassword, setShowPassword] = useState(false);

  const [generatedUsername, setGeneratedUsername] = useState("");
  const [copied, setCopied] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const signupMutation = useSignupMutation();

  const validateEmail = (emailStr: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!name.trim()) {
      errors.name = "Full name is required";
    }

    if (!email.trim()) {
      errors.email = "Email address is required";
    } else if (!validateEmail(email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!role) {
      errors.role = "Please select a role";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const response = await signupMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
        role: role as UserRole,
      });

      if (response.username) {
        setGeneratedUsername(response.username);
      }
    } catch {
      // Error handled via signupMutation.error
    }
  };

  const handleCopyUsername = () => {
    if (generatedUsername) {
      navigator.clipboard.writeText(generatedUsername);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const errorMessage = signupMutation.error
    ? getApiErrorMessage(signupMutation.error)
    : null;

  // Render Success screen upon account creation
  if (generatedUsername) {
    return (
      <div className="signup-page">
        <div className="signup-card success-card">
          <div className="success-icon">✓</div>

          <div className="signup-heading">
            <h1>Signup Complete!</h1>
            <p>Your account has been created successfully.</p>
          </div>

          <div className="username-box">
            <p>Your Username</p>
            <strong>{generatedUsername}</strong>
            <button
              type="button"
              className="copy-btn"
              onClick={handleCopyUsername}
            >
              {copied ? "Copied!" : "📋 Copy Username"}
            </button>
          </div>

          <p className="login-message">
            Please use this generated username to sign in to your account.
          </p>

          <Link to="/login" className="login-button-link">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="signup-brand">
          <div className="brand-icon">+</div>
          <span>Doctor CRM</span>
        </div>

        <div className="signup-heading">
          <h1>Create Account</h1>
          <p>Register yourself to get started</p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="alert-banner error" role="alert">
            <span>⚠️</span>
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSignup} noValidate>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (formErrors.name) {
                  setFormErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              className={formErrors.name ? "input-error" : ""}
              disabled={signupMutation.isPending}
              autoComplete="name"
            />
            {formErrors.name && (
              <span className="field-error">{formErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formErrors.email) {
                  setFormErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              className={formErrors.email ? "input-error" : ""}
              disabled={signupMutation.isPending}
              autoComplete="email"
            />
            {formErrors.email && (
              <span className="field-error">{formErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password (min. 6 characters)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formErrors.password) {
                    setFormErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                className={formErrors.password ? "input-error" : ""}
                disabled={signupMutation.isPending}
                autoComplete="new-password"
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

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as UserRole);
                if (formErrors.role) {
                  setFormErrors((prev) => ({ ...prev, role: undefined }));
                }
              }}
              className={formErrors.role ? "input-error" : ""}
              disabled={signupMutation.isPending}
            >
              <option value="" disabled>
                Select your role
              </option>
              <option value="doctor">Doctor</option>
              <option value="patient">Patient</option>
              <option value="admin">Admin</option>
              <option value="receptionist">Receptionist</option>
            </select>
            {formErrors.role && (
              <span className="field-error">{formErrors.role}</span>
            )}
          </div>

          <button
            type="submit"
            className="signup-button"
            disabled={signupMutation.isPending}
          >
            {signupMutation.isPending ? (
              <>
                <span className="spinner" />
                <span>Creating Account...</span>
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="login-text">
          Already have an account?
          <Link to="/login"> Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;