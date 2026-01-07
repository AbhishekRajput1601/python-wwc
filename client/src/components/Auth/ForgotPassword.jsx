import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const ForgotPassword = () => {
  const [step, setStep] = useState('request'); 
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const navigate = useNavigate();

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const resp = await authService.requestPasswordReset({ email });
      if (resp.success) {
        setStep('reset');
        setCountdown(180);
      } else {
        setError(resp.message || 'Failed to request password reset');
      }
    } catch (err) {
      setError('Unexpected error');
    }

    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const resp = await authService.resetPassword({ email, otp, new_password: newPassword });
      if (resp.success) {
        navigate('/login');
      } else {
        setError(resp.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Unexpected error');
    }

    setLoading(false);
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    try {
      const resp = await authService.requestPasswordReset({ email });
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

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center bg-gradient-to-br from-wwc-50 via-white to-accent-50 pt-4 sm:pt-8 pb-4 sm:pb-6 px-3 xs:px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-4 sm:space-y-6">
        <div className="text-center">
          <h2 className="mt-3 sm:mt-4 text-center text-xl sm:text-2xl font-bold text-neutral-900 font-display">Forgot Password</h2>
          <p className="mt-1 sm:mt-2 text-center text-xs sm:text-sm text-neutral-600 px-2">Enter your registered email to receive a reset code.</p>
        </div>

        <div className="bg-white shadow-medium rounded-xl sm:rounded-2xl px-4 sm:px-6 py-4 sm:py-6 mt-3 sm:mt-4">
          <form className="space-y-3 sm:space-y-4" onSubmit={step === 'request' ? handleRequest : handleReset}>
            {error && <div className="bg-error-50 border border-error-200 text-error-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg animate-slide-in-up"><p className="text-xs sm:text-sm font-medium">{error}</p></div>}

            {step === 'request' && (
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5 sm:mb-2">Email Address</label>
                <input id="email" name="email" type="email" required className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-200 rounded-lg sm:rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            )}

            {step === 'reset' && (
              <>
                <div>
                  <label htmlFor="otp" className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5 sm:mb-2">Verification Code</label>
                  <input id="otp" name="otp" type="text" required maxLength={6} className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-200 rounded-lg sm:rounded-xl" value={otp} onChange={(e) => setOtp(e.target.value)} />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5 sm:mb-2">New Password</label>
                  <input id="newPassword" name="newPassword" type="password" required className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-200 rounded-lg sm:rounded-xl" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5 sm:mb-2">Confirm Password</label>
                  <input id="confirmPassword" name="confirmPassword" type="password" required className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-200 rounded-lg sm:rounded-xl" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <div>Expires in: {Math.max(0, countdown)}s</div>
                  <div>
                    <button type="button" disabled={resendLoading || countdown>0} onClick={handleResend} className="text-wwc-600 underline disabled:opacity-50">{resendLoading ? 'Resending...' : 'Resend code'}</button>
                  </div>
                </div>
              </>
            )}

            <div className="pt-1 sm:pt-2">
              <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border-2 border-black text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl text-black bg-white hover:bg-gray-200 disabled:opacity-50">
                {loading ? 'Please wait...' : (step === 'request' ? 'Send Reset Code' : 'Reset Password')}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
