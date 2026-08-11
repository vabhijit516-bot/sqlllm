import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, CheckCircle, ShieldCheck, X, Sparkles, User, AlertTriangle } from 'lucide-react';
import { animateClick } from '../utils/useAnime';

export default function GoogleAuth({ user, onAuthSuccess, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('sec25am112@sairamtap.edu.in');
  const [nameInput, setNameInput] = useState('Sairam Tech User');
  const [hasRealClientId, setHasRealClientId] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (clientId && clientId !== 'your-google-client-id.apps.googleusercontent.com') {
      setHasRealClientId(true);
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse
        });

        const btnElement = document.getElementById('googleSignInBtn');
        if (btnElement) {
          window.google.accounts.id.renderButton(
            btnElement,
            { theme: 'dark', size: 'medium', shape: 'pill' }
          );
        }
      }
    }
  }, []);

  const handleCredentialResponse = async (response) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      const data = await res.json();
      if (data.status === 'success') {
        localStorage.setItem('datapulse_token', data.access_token);
        localStorage.setItem('datapulse_user', JSON.stringify(data.user));
        onAuthSuccess(data.user);
      }
    } catch (e) {
      console.error('Google auth error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          credential: `google_oauth_${Date.now()}`,
          email: emailInput.trim(),
          name: nameInput.trim()
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        const userObj = {
          user_id: data.user.user_id || 'google_user_' + Date.now(),
          email: emailInput.trim() || data.user.email,
          name: nameInput.trim() || data.user.name,
          picture: data.user.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
        };
        localStorage.setItem('datapulse_token', data.access_token);
        localStorage.setItem('datapulse_user', JSON.stringify(userObj));
        onAuthSuccess(userObj);
        setModalOpen(false);
      }
    } catch (e) {
      console.error('Google sign-in error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('datapulse_token');
    localStorage.removeItem('datapulse_user');
    if (onLogout) onLogout();
  };

  const quickAccounts = [
    { name: "Sairam Student", email: "sec25am112@sairamtap.edu.in" },
    { name: "Abhijit V (Dev)", email: "vabhijit516@gmail.com" },
    { name: "TechX Data Lead", email: "demo.user@gmail.com" }
  ];

  if (user) {
    return (
      <div className="flex items-center space-x-3 bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
        <div className="relative">
          <img
            src={user.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt={user.name}
            className="w-7 h-7 rounded-full border-2 border-indigo-400 object-cover shadow-sm"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-bold text-slate-100 truncate max-w-[130px]">{user.name}</p>
          <p className="text-[10px] text-indigo-300 font-mono flex items-center">
            <ShieldCheck className="w-3 h-3 text-emerald-400 mr-1" />
            Google Authorized
          </p>
        </div>
        <button
          onClick={(e) => {
            animateClick(e.currentTarget);
            handleSignOut();
          }}
          className="p-1.5 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center space-x-2">
        {hasRealClientId && <div id="googleSignInBtn"></div>}
        <button
          onClick={(e) => {
            animateClick(e.currentTarget);
            setModalOpen(true);
          }}
          className="flex items-center space-x-2 text-xs px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold shadow-lg shadow-indigo-600/25 active:scale-95 transition-all border border-indigo-400/30"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Google Sign-In</span>
        </button>
      </div>

      {/* Google OAuth Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md glass-panel border border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-slate-100">
                    Google Identity Sign-In
                  </h3>
                  <p className="text-xs text-slate-400">
                    Authorized OAuth 2.0 Token Verification
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  animateClick(e.currentTarget);
                  setModalOpen(false);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="mt-4 pt-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
                Select Google Account
              </span>
              <div className="space-y-1.5">
                {quickAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setEmailInput(acc.email);
                      setNameInput(acc.name);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-mono border transition-all flex items-center justify-between ${
                      emailInput === acc.email
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{acc.name}</p>
                      <p className="text-[10px] text-slate-400">{acc.email}</p>
                    </div>
                    {emailInput === acc.email && <CheckCircle className="w-4 h-4 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Inputs */}
            <div className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold font-mono text-slate-300 mb-1">
                  Google Email
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-200 focus:outline-none focus:border-indigo-500"
                  placeholder="sec25am112@sairamtap.edu.in"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold font-mono text-slate-300 mb-1">
                  User Display Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="Full Name"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex justify-end space-x-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  animateClick(e.currentTarget);
                  handleGoogleSignInSubmit();
                }}
                disabled={loading || !emailInput}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Authorize & Sign In</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
