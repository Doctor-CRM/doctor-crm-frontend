import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Login.css";
import api from "../service/api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await api.post("/api/v1/users/login", {
        username: username,
        password: password,
      });

      console.log("Login Response:", response.data);

      const token = response.data.token;

      console.log("JWT Token:", token);
      console.log("User:", response.data.data);

      alert("Login successful!");
    } catch (error: unknown) {
      console.log("Login Error:", error);

      if (axios.isAxiosError(error)) {
        alert(
          error.response?.data?.message || "Login failed"
        );
      } else {
        alert("Something went wrong");
      }
    }
  };

  return (
    <div className="login-page">

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
            A simple and powerful CRM designed to help doctors
            and healthcare teams manage patients, appointments,
            and daily operations.
          </p>
        </div>

        <div className="left-footer">
          © 2026 Doctor CRM
        </div>

      </div>

      <div className="login-right">

        <div className="login-card">

          <div className="login-heading">
            <h2>Welcome back</h2>
            <p>Login to your account to continue</p>
          </div>

          <form onSubmit={handleLogin}>

            <div className="form-group">
              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="login-button"
            >
              Login
            </button>

          </form>

          <p className="signup-text">
            Don't have an account?
            <Link to="/signup"> Sign Up</Link>
          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;