import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import { toast } from 'react-toastify';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const { dispatch, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.name === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      // Request OTP to be sent to user's email
      const resp = await authService.requestRegistrationOtp(registerData);
      if (resp.success) {
        setStep('verify');
        setCountdown(180);
        toast.success('Verification code sent to your email');
      } else {
        setError(resp.message || 'Failed to request verification code');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', error);
    }

    setLoading(false);
  };

  // OTP verify
  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = { email: formData.email, otp };
      const resp = await authService.verifyRegistrationOtp(payload);
      if (resp.success) {
        toast.success('Verification is successfully done');
        dispatch({
          type: 'REGISTER_SUCCESS',
          payload: { token: resp.token, user: resp.user }
        });
        navigate('/dashboard');
      } else {
        setError(resp.message || 'Invalid or expired code');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Verify error:', error);
    }

    setLoading(false);
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    try {
      const { confirmPassword, ...registerData } = formData;
      const resp = await authService.requestRegistrationOtp(registerData);
      if (resp.success) {
        setCountdown(180);
      } else {
        setError(resp.message || 'Failed to resend code');
      }
    } catch (e) {
      setError('Failed to resend code');
    }
    setResendLoading(false);
  };

  // countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center bg-gradient-to-br from-wwc-50 via-white to-accent-50 pt-4 sm:pt-8 pb-4 sm:pb-6 px-3 xs:px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-4 sm:space-y-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-medium">
            <span className="text-white font-bold text-xl sm:text-2xl font-display">
              W
            </span>
          </div>
          <h2 className="mt-3 sm:mt-4 text-center text-xl sm:text-2xl font-bold text-neutral-900 font-display">
            Join WWC Today
          </h2>
          <p className="mt-1 sm:mt-2 text-center text-xs sm:text-sm text-neutral-600 px-2">
            Create your account and start hosting amazing meetings
          </p>
          <p className="mt-1 sm:mt-2 text-center text-xs sm:text-sm text-neutral-500 px-2">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-wwc-600 hover:text-wwc-700 transition-colors duration-200"
            >
              Sign in here
            </Link>
          </p>
        </div>
        <div className="bg-white shadow-medium rounded-xl sm:rounded-2xl px-4 sm:px-6 py-4 sm:py-6 mt-3 sm:mt-4">
          <form className="space-y-3 sm:space-y-4" onSubmit={step === 'form' ? handleSubmit : handleVerify}>
            {error && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg animate-slide-in-up">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-error-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-2 sm:ml-3">
                    <p className="text-xs sm:text-sm font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {step === 'form' && (
              <div className="space-y-3 sm:space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5 sm:mb-2"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-200 rounded-lg sm:rounded-xl text-sm sm:text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-wwc-500 focus:border-wwc-500 transition-all duration-200 bg-neutral-50 focus:bg-white"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5 sm:mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-200 rounded-lg sm:rounded-xl text-sm sm:text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-wwc-500 focus:border-wwc-500 transition-all duration-200 bg-neutral-50 focus:bg-white"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5 sm:mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-200 rounded-lg sm:rounded-xl text-sm sm:text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-wwc-500 focus:border-wwc-500 transition-all duration-200 bg-neutral-50 focus:bg-white"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5 sm:mb-2"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-200 rounded-lg sm:rounded-xl text-sm sm:text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-wwc-500 focus:border-wwc-500 transition-all duration-200 bg-neutral-50 focus:bg-white"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              </div>
            )}

            {step === 'verify' && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5 sm:mb-2">Verification Code</label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength={6}
                    className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-200 rounded-lg sm:rounded-xl text-sm sm:text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-wwc-500 focus:border-wwc-500 transition-all duration-200 bg-neutral-50 focus:bg-white"
                    placeholder="Enter the 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <div>Expires in: {Math.max(0, countdown)}s</div>
                  <div>
                    <button type="button" disabled={resendLoading || countdown>0} onClick={handleResend} className="text-wwc-600 underline disabled:opacity-50">{resendLoading ? 'Resending...' : 'Resend code'}</button>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-1 sm:pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border-2 border-black text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-soft hover:shadow-medium transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-black"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="text-xs sm:text-sm">Creating your account...</span>
                  </div>
                ) : (
                  "Join WWC Community"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
