import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .refine((val) => val === '' || z.string().email().safeParse(val).success, {
      message: 'Invalid email address'
    }),
  password: z.string().min(1, 'Password is required')
});

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user was redirected here after a successful registration
  const wasRegistered = location.state?.registered;
  const registeredEmail = location.state?.email || '';

  // Autofill email if passed from registration
  React.useEffect(() => {
    if (registeredEmail) {
      setEmail(registeredEmail);
    }
  }, [registeredEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      });
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/chat');
    } catch (err: any) {
      setSubmitError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h2>Welcome back</h2>
        <p>Login to your Whispr account to resume chatting</p>
      </div>

      {wasRegistered && !submitError && (
        <div className="form-alert form-alert-success">
          <span>Registration successful! Please sign in.</span>
        </div>
      )}

      {submitError && (
        <div className="form-alert form-alert-error">
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <div className={`input-wrapper ${formErrors.email ? 'input-error' : ''}`}>
            <Mail className="input-icon" size={18} />
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              value={email}
              disabled={isSubmitting}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formErrors.email) {
                  setFormErrors((prev) => ({ ...prev, email: '' }));
                }
              }}
            />
          </div>
          {formErrors.email && <span className="field-error-message">{formErrors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className={`input-wrapper password-wrapper ${formErrors.password ? 'input-error' : ''}`}>
            <Lock className="input-icon" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="••••••••"
              value={password}
              disabled={isSubmitting}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formErrors.password) {
                  setFormErrors((prev) => ({ ...prev, password: '' }));
                }
              }}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {formErrors.password && <span className="field-error-message">{formErrors.password}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
          <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
          {!isSubmitting && <LogIn size={18} />}
        </button>
      </form>

      <div className="auth-footer">
        <span>Don't have an account? </span>
        <Link to="/register" className="auth-link">
          Create one <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};
