import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ActivityIcon, ClipboardCheckIcon, ShieldCheckIcon, StethoscopeIcon } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import type { Role } from '../types';
import { HOME_FOR } from '../utils/nav';
import { ROLE_THEMES, themeVars } from '../utils/theme';

const ROLE_OPTIONS: {role: Role;title: string;blurb: string;icon: typeof ActivityIcon;}[] = [
{ role: 'ADMIN', title: 'Admin', blurb: 'Register patients, open cases, allocate clinical staff.', icon: ShieldCheckIcon },
{
  role: 'THERAPIST',
  title: 'Student therapist',
  blurb: 'Plan therapy, document sessions, submit progress reports.',
  icon: StethoscopeIcon
},
{
  role: 'SUPERVISOR',
  title: 'Supervisor',
  blurb: 'Review plans, evaluate reports, decide case outcomes.',
  icon: ClipboardCheckIcon
}];


const STAGES = [
'Patient registration and case intake',
'Allocation to a student therapist and supervisor',
'Therapy planning and supervisor approval',
'Session documentation and progress visualisation',
'Supervisor evaluation and case outcome'];


export function Auth() {
  const { register, login, users, hasAccounts } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'create' | 'login'>('create');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (mode === 'create' && name.trim().length < 2) next.name = 'Enter the account holder name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email address.';
    if (password.length < 6) next.password = 'Password must be at least 6 characters.';
    if (mode === 'create' && !role) next.role = 'Select the role for this account.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (mode === 'create') {
      const result = await register({ name: name.trim(), email: email.trim(), password, role: role as Role });
      if (!result.ok) {
        setErrors({ email: result.error ?? 'Could not create the account.' });
        return;
      }
      toast.success('Account created');
      navigate(HOME_FOR[role as Role]);
      return;
    }

    const result = await login(email, password);
    if (!result.ok) {
      setErrors({ email: result.error ?? 'Could not sign in.' });
      return;
    }
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    toast.success('Signed in');
    navigate(user ? HOME_FOR[user.role] : '/');
  };

  return (
    <div style={themeVars(role || null)} className="flex min-h-full w-full flex-col lg:flex-row">
      <section
        className="flex flex-col justify-between gap-10 px-6 py-10 text-white sm:px-10 lg:w-[44%] lg:py-14"
        style={{ backgroundColor: ROLE_THEMES[role as Role || 'ADMIN'].accentStrong }}>
        
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <ActivityIcon className="h-4.5 w-4.5" />
            </span>
            <span className="font-display text-lg">Locutus SLP</span>
          </div>
          <h1 className="mt-10 max-w-md font-display text-3xl leading-snug sm:text-[38px]">
            Clinical management and supervision for speech-language therapy.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70">
            One connected record from patient registration and allocation through therapy planning, session
            documentation, progress visualisation, supervisor evaluation and case closure.
          </p>
        </div>
        <ol className="flex flex-col gap-3 border-t border-white/15 pt-6">
          {STAGES.map((stage, i) =>
          <li key={stage} className="flex items-start gap-3 text-sm text-white/75">
              <span className="num mt-0.5 w-4 shrink-0 text-white/40">{i + 1}</span>
              {stage}
            </li>
          )}
        </ol>
      </section>

      <section className="flex flex-1 items-center justify-center bg-white px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            {(['create', 'login'] as const).map((m) =>
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setErrors({});
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 ease-out ${
              mode === m ? 'bg-white text-slate-900 shadow-card' : 'text-slate-500 hover:text-slate-700'}`
              }>
              
                {m === 'create' ? 'Create account' : 'Log in'}
              </button>
            )}
          </div>

          <h2 className="mt-7 font-display text-2xl text-slate-900">
            {mode === 'create' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {mode === 'create' ?
            'Choose the role this account will work in. It determines which dashboard and cases you can access.' :
            'Sign in with an account created on this system.'}
          </p>

          <form onSubmit={submit} className="mt-7 flex flex-col gap-5" noValidate>
            {mode === 'create' &&
            <Field label="Full name" htmlFor="name" required error={errors.name}>
                <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                invalid={Boolean(errors.name)}
                autoComplete="name" />
              
              </Field>
            }
            <Field label="Email" htmlFor="email" required error={errors.email}>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                invalid={Boolean(errors.email)}
                autoComplete="email" />
              
            </Field>
            <Field
              label="Password"
              htmlFor="password"
              required
              error={errors.password}
              hint={mode === 'create' ? 'At least 6 characters.' : undefined}>
              
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                invalid={Boolean(errors.password)}
                autoComplete={mode === 'create' ? 'new-password' : 'current-password'} />
              
            </Field>

            {mode === 'create' &&
            <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-700">
                  Role<span className="ml-1 text-rose-500">*</span>
                </legend>
                <div className="flex flex-col gap-2">
                  {ROLE_OPTIONS.map((option) => {
                  const active = role === option.role;
                  return (
                    <button
                      key={option.role}
                      type="button"
                      onClick={() => setRole(option.role)}
                      aria-pressed={active}
                      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-[border-color,background-color] duration-150 ease-out ${
                      active ?
                      'border-[var(--accent)] bg-[var(--accent-soft)]' :
                      'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`
                      }>
                      
                        <option.icon
                        className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${active ? 'text-[var(--accent)]' : 'text-slate-400'}`} />
                      
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">{option.title}</span>
                          <span className="block text-xs text-slate-500">{option.blurb}</span>
                        </span>
                      </button>);

                })}
                </div>
                {errors.role && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.role}</p>}
              </fieldset>
            }

            <Button type="submit" className="mt-1 w-full">
              {mode === 'create' ? 'Create account and continue' : 'Log in'}
            </Button>
          </form>

          {mode === 'login' && !hasAccounts &&
          <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              No accounts exist on this system yet. Create one to get started.
            </p>
          }
        </div>
      </section>
    </div>);

}