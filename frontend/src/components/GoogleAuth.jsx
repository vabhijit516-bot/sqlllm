import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, UserCheck } from 'lucide-react';

export default function GoogleAuth({ user, onAuthSuccess, onLogout }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize Google Sign-In SDK if script loaded
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.initialize({
        client_id: 'your-google-client-id.apps.googleusercontent.com', // Replace with configured client ID
        callback: handleCredentialResponse
      });

      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInBtn'),
        { theme: 'dark', size: 'medium', shape: 'pill' }
      );
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
        onAuthSuccess(data.user);
      }
    } catch (e) {
      console.error('Google auth error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedGoogleAuth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'mock_google_token_2026' })
      });
      const data = await res.json();
      if (data.status === 'success') {
        localStorage.setItem('datapulse_token', data.access_token);
        onAuthSuccess(data.user);
      }
    } catch (e) {
      console.error('Simulated auth error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center space-x-3 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
        <img
          src={user.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
          alt={user.name}
          className="w-7 h-7 rounded-full border border-indigo-400 object-cover"
        />
        <div className="text-left hidden sm:block">
          <p className="text-xs font-semibold text-slate-200">{user.name}</p>
          <p className="text-[10px] text-indigo-400">Google Authorized</p>
        </div>
        <button
          onClick={onLogout}
          className="p-1 rounded-full text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div id="googleSignInBtn"></div>
      <button
        onClick={handleSimulatedGoogleAuth}
        className="flex items-center space-x-2 text-xs px-3.5 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold shadow-md shadow-indigo-600/20 transition-all"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Google Sign-In</span>
      </button>
    </div>
  );
}
