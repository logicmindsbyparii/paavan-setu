import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { colors } from '../../constants/tokens';
import { brand, GRAIN } from '../../constants/brand';
import SunGlyph from './SunGlyph';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const inputBase =
  'w-full px-4 py-3.5 rounded-xl border transition-all duration-200 font-medium outline-none text-base';

function Field({ id, label, type = 'text', required, autoComplete, placeholder, minLength, value, onChange, showToggle, showPassword, onTogglePassword }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold mb-1.5 ml-1" style={{ color: colors.ink }}>
        {label}
      </label>
      {showToggle ? (
        <div className="relative">
          <input
            id={id}
            type={showPassword ? 'text' : 'password'}
            required={required}
            autoComplete={autoComplete}
            placeholder={placeholder}
            minLength={minLength}
            className={`${inputBase} pr-12`}
            style={{ borderColor: colors.divider, backgroundColor: colors.snow, color: colors.ink }}
            onFocus={(e) => { e.target.style.borderColor = colors.green; e.target.style.boxShadow = `0 0 0 3px ${colors.green}15`; }}
            onBlur={(e) => { e.target.style.borderColor = colors.divider; e.target.style.boxShadow = 'none'; }}
            value={value}
            onChange={onChange}
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl transition-colors duration-200"
            style={{ color: colors.ash }}
            onMouseEnter={(e) => { e.currentTarget.style.color = colors.green; e.currentTarget.style.backgroundColor = `${colors.green}0a`; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = colors.ash; e.currentTarget.style.backgroundColor = 'transparent'; }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
          </button>
        </div>
      ) : (
        <input
          id={id}
          type={type}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={inputBase}
          style={{ borderColor: colors.divider, backgroundColor: colors.snow, color: colors.ink }}
          onFocus={(e) => { e.target.style.borderColor = colors.green; e.target.style.boxShadow = `0 0 0 3px ${colors.green}15`; }}
          onBlur={(e) => { e.target.style.borderColor = colors.divider; e.target.style.boxShadow = 'none'; }}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
}

/**
 * Shared auth form (login / register).
 *
 * @param {object}   props
 * @param {string}   props.title         Heading text
 * @param {string}   props.subtitle      Subtext under heading
 * @param {Array}    props.fields        Field definitions: { id, label, type?, required?, autoComplete?, placeholder?, minLength?, password? }
 * @param {object}   props.values        Field values keyed by id
 * @param {Function} props.onChange       (id, value) => void
 * @param {string}   props.error         Error message (falsy = hidden)
 * @param {boolean}  props.loading       Disable button + show spinner
 * @param {string}   props.submitLabel   Button text when not loading
 * @param {string}   props.loadingLabel  Button text when loading
 * @param {Function} props.onSubmit      (e) => void
 * @param {string}   props.footerText    e.g. "Don't have an account?"
 * @param {string}   props.footerLink    Link label, e.g. "Sign up here"
 * @param {string}   props.footerTo      Route, e.g. "/register"
 */
export default function AuthForm({
  title,
  subtitle,
  fields,
  values,
  onChange,
  error,
  loading,
  submitLabel,
  loadingLabel,
  onSubmit,
  footerText,
  footerLink,
  footerTo,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    /* The same ivory-paper + gold-wash stage the marketing pages open on —
       auth used to sit on flat `bg-snow`, a green-grey slab that belonged to
       neither the paper pages nor the dark field pages. */
    <div
      className="min-h-dvh relative isolate flex items-center justify-center overflow-hidden px-4 py-24"
      style={{
        background:
          'radial-gradient(54% 46% at 8% 92%, rgba(233,200,92,0.3) 0%, rgba(233,200,92,0) 62%),' +
          `linear-gradient(172deg, ${brand.ivoryLit} 0%, ${brand.ivory} 50%, ${brand.ivoryDeep} 100%)`,
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-multiply"
          style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }}
        />
      </div>

      <div className="w-full max-w-md">
        {/* Brand mark above the card — the sun glyph and a tracked tagline, in
            the same voice every section header opens with. */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <p className="flex items-center justify-center gap-2.5">
            <SunGlyph className="h-4 w-4 shrink-0" />
            <span
              className="text-[0.7rem] font-semibold uppercase tracking-[0.2em]"
              style={{ color: brand.green }}
            >
              Paavan Setu
            </span>
          </p>
          <span
            aria-hidden="true"
            className="h-0.5 w-16 rounded-full"
            style={{ background: `linear-gradient(90deg, ${brand.goldDeep} 0%, ${brand.gold} 100%)`, opacity: 0.7 }}
          />
        </div>

      <div
        className="relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-[0_30px_80px_-40px_rgba(15,35,23,0.4)] md:p-10"
        style={{ boxShadow: '0 0 0 1px rgba(233,200,92,0.4), 0 30px 80px -44px rgba(15,35,23,0.45)' }}
      >
        {/* Gold hairline along the top — the same accent the Contact form and
            mission cards carry. */}
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${brand.gold} 0%, ${brand.goldLight} 100%)` }}
        />

        {/* h1 — this is the page's only top-level heading; /login and /register
            previously had none, so the page started its outline at h2. */}
        <h1
          className="font-['DM_Serif_Display',Georgia,serif] text-3xl mb-2 text-center"
          style={{ color: colors.ink }}
        >
          {title}
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: colors.ash }}>
          {subtitle}
        </p>

        {error && (
          <div
            className="mb-4 p-3 rounded-xl text-sm font-medium border"
            style={{ backgroundColor: '#fef2f2', color: colors.error, borderColor: '#fecaca' }}
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {fields.map((f) => (
            <Field
              key={f.id}
              {...f}
              value={values[f.id] || ''}
              onChange={(e) => onChange(f.id, e.target.value)}
              showToggle={f.password}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((p) => !p)}
            />
          ))}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3.5 rounded-full text-white font-bold text-base transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: loading ? colors.ash : colors.green }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = colors.blue;
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(10,79,34,0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = colors.green;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {loading ? (
              <>
                <span
                  className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"
                  style={{ borderWidth: 3 }}
                  aria-hidden="true"
                />
                {loadingLabel}
              </>
            ) : (
              submitLabel
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: colors.ash }}>
          {footerText}{' '}
          <Link
            to={footerTo}
            className="font-semibold transition-colors duration-200"
            style={{ color: colors.green }}
            onMouseEnter={(e) => { e.currentTarget.style.color = colors.blue; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = colors.green; }}
          >
            {footerLink}
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
}
