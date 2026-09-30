import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Signup.css";
import api from "../service/api";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [generatedUsername, setGeneratedUsername] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await api.post("/api/v1/users/signup", {
        name,
        email,
        password,
        role,
      });

      console.log("Signup response:", response.data);

      setGeneratedUsername(response.data.username);
    } catch (error: unknown) {
      console.log("Signup error:", error);

      if (axios.isAxiosError(error)) {
        alert(
          error.response?.data?.message || "Signup failed"
        );
      } else {
        alert("Something went wrong");
      }
    }
  };

  if (generatedUsername) {
    return (
      <div className="signup-page">
        <div className="signup-card success-card">

          <div className="success-icon">
            ✓
          </div>

          <div className="signup-heading">
            <h1>Signup Complete!</h1>

            <p>
              Your account has been created successfully.
            </p>
          </div>

          <div className="username-box">
            <p>Your Username</p>

            <strong>{generatedUsername}</strong>
          </div>

          <p className="login-message">
            Please use this username to sign in to your account.
          </p>

          <Link to="/login" className="login-button">
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

        <form onSubmit={handleSignup}>

          <div className="form-group">
            <label htmlFor="name">Name</label>

            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>

            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="" disabled>
                Select your role
              </option>

              <option value="doctor">Doctor</option>
              <option value="patient">Patient</option>
              <option value="admin">Admin</option>
              <option value="receptionist">Receptionist</option>
            </select>
          </div>

          <button
            type="submit"
            className="signup-button"
          >
            Create Account
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