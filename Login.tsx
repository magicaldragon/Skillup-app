import type React from "react";
import { useState } from "react";
import "./LoginPanel.css";
import { authService } from "./frontend/services/authService";
import type { UserProfile } from "./types";

interface LoginProps {
  onLoginSuccess: (user: UserProfile) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate input
      if (!email || !email.trim() || !password || !password.trim()) {
        setError("Please enter both email and password.");
        setIsLoading(false);
        return;
      }

      const response = await authService.login({ email: (email || "").trim(), password });
      if (response.success && response.user) {
        localStorage.setItem("skillup_user", JSON.stringify(response.user));
        onLoginSuccess(response.user);
      } else {
        setError(response.message || "Login failed. Please try again.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-bg">
      {error && (
        <div className="login-error" role="alert">
          {error}
        </div>
      )}

      <div className="login-panel">
        <div className="login-logo-wrap">
          <img src="/logo-skillup.png" alt="Skillup Center Logo" className="login-logo" />
        </div>

        <form className="login-form" onSubmit={handleAuthAction} autoComplete="on">
          <label htmlFor="email" className="login-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="login-input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="password" className="login-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="login-input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
            aria-label="Sign in to SkillUp Center"
          >
            {isLoading ? "Processing..." : "Sign In"}
          </button>
        </form>
        <div className="login-footer">SkillUp Center &copy; {new Date().getFullYear()}</div>
      </div>
    </div>
  );
};

export default Login;
