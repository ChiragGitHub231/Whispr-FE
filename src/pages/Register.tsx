import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';

const registerSchema = z.object({
  username: z.string().min(1, 'Username is required').min(3, 'Username must be at least 3 characters'),
  email: z.string()
    .min(1, 'Email is required')
    .refine((val) => val === '' || z.string().email().safeParse(val).success, {
      message: 'Invalid email address'
    }),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const result = registerSchema.safeParse({ username, email, password, confirmPassword });
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
      await register(username, email, password);
      // Success: Redirect to Login page with autofill parameter
      navigate('/login', { state: { registered: true, email } });
    } catch (err: any) {
      const errMsg = err.message || 'Registration failed. Please try again.';
      if (errMsg.toLowerCase().includes('already exists') || errMsg.toLowerCase().includes('conflict')) {
        setFormErrors({ email: 'A user with this email address already exists.' });
      } else {
        setSubmitError(errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h2>Create Account</h2>
        <p>Get started with a free Whispr account</p>
      </div>

      {submitError && (
        <div className="form-alert form-alert-error">
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <div className={`input-wrapper ${formErrors.username ? 'input-error' : ''}`}>
            <User className="input-icon" size={18} />
            <input
              type="text"
              id="username"
              placeholder="johndoe"
              value={username}
              disabled={isSubmitting}
              onChange={(e) => {
                setUsername(e.target.value);
                if (formErrors.username) {
                  setFormErrors((prev) => ({ ...prev, username: '' }));
                }
              }}
            />
          </div>
          {formErrors.username && <span className="field-error-message">{formErrors.username}</span>}
        </div>

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

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className={`input-wrapper password-wrapper ${formErrors.confirmPassword ? 'input-error' : ''}`}>
            <Lock className="input-icon" size={18} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              placeholder="••••••••"
              value={confirmPassword}
              disabled={isSubmitting}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (formErrors.confirmPassword) {
                  setFormErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }
              }}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isSubmitting}
              title={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {formErrors.confirmPassword && <span className="field-error-message">{formErrors.confirmPassword}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
          <span>{isSubmitting ? 'Creating Account...' : 'Sign Up'}</span>
          {!isSubmitting && <UserPlus size={18} />}
        </button>
      </form>

      <div className="auth-footer">
        <span>Already have an account? </span>
        <Link to="/login" className="auth-link">
          Log in <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};
