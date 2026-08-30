import { useState } from 'react';
import { supabase } from '../utils/supabase';
import logo from '../assets/logo.png';

const ALLOWED_DOMAIN = 'tec.mx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!trimmed.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setStatus('error');
      setErrorMessage(`Use your @${ALLOWED_DOMAIN} email address.`);
      return;
    }

    setStatus('sending');
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
    } else {
      setStatus('idle');
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src={logo} alt="VespoUAV" className="h-14 w-14 rounded-full object-cover" />
          <h1 className="text-[20px] font-semibold tracking-tight text-ink">VespoUAV</h1>
          <p className="text-[13px] text-ink-secondary">Sign in with your @{ALLOWED_DOMAIN} email</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-ink-secondary">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`you@${ALLOWED_DOMAIN}`}
              className="rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-ink-secondary">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600"
            />
          </label>

          {status === 'error' && <p className="text-[13px] text-brown-600">{errorMessage}</p>}

          <button
            type="submit"
            disabled={status === 'sending'}
            className="mt-1 inline-flex items-center justify-center rounded-full bg-brand-500 px-4 py-2.5 text-[14px] font-medium text-ink transition-[background-color,transform] duration-350 ease-emil hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60"
          >
            {status === 'sending' ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
