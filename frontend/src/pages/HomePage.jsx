import { Link } from 'react-router-dom';
import { ROLES } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M10.8 4.3a1 1 0 0 0-1.4 1.4l4.3 4.3H4a1 1 0 1 0 0 2h9.7l-4.3 4.3a1 1 0 1 0 1.4 1.4l6-6a1 1 0 0 0 0-1.4l-6-6Z" />
    </svg>
  );
}

function MatchPreview() {
  const factors = [
    { label: 'Skills', value: '48 / 60', width: '80%' },
    { label: 'Experience', value: '20 / 20', width: '100%' },
    { label: 'Role relevance', value: '18 / 20', width: '90%' },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm">
      <div className="rounded-xl border border-line bg-surface p-5 text-ink shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">Frontend Developer</p>
            <p className="mt-0.5 text-xs text-muted">Acme · Pune · Hybrid</p>
          </div>
          <span className="rounded-full bg-good-soft px-2.5 py-1 text-xs font-bold text-good">
            86% match
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {factors.map((factor) => (
            <div key={factor.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ink-soft">{factor.label}</span>
                <span className="text-muted">{factor.value}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-alt">
                <div className="h-full rounded-full bg-brand" style={{ width: factor.width }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5 border-t border-line pt-4">
          <span className="rounded bg-good-soft px-2 py-1 text-xs text-good">React ✓</span>
          <span className="rounded bg-good-soft px-2 py-1 text-xs text-good">TypeScript ✓</span>
          <span className="rounded bg-bad-soft px-2 py-1 text-xs text-bad">GraphQL missing</span>
        </div>

        <p className="mt-3 text-[11px] text-muted">
          Every number here has a reason attached to it.
        </p>
      </div>
    </div>
  );
}

function GuestHome() {
  const features = [
    {
      title: 'Find the right listing',
      body: 'Search by title, city, skill or pay. The filters stay in the link, so you can send one to a friend.',
    },
    {
      title: 'Let your resume do the sorting',
      body: 'Save it once and open roles are ranked against the skills you actually listed. The gaps are named too.',
    },
    {
      title: 'Keep every application straight',
      body: 'Apply with a short note, check your status later, and see every conversation in one place.',
    },
  ];

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-3xl bg-hero px-6 py-12 text-hero-ink sm:px-10 sm:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl"
        />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-hero-accent">
              JobPortal · Resume matching
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl">
              Find work that fits.
              <br />
              Hire people who do.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-hero-soft sm:text-base">
              Search jobs, save your resume once, and see the closest matches first — with the
              reasons right beside them.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                Create an account
                <ArrowIcon />
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-hero-ink transition hover:bg-white/10"
              >
                Log in
              </Link>
            </div>
            <p className="mt-4 text-xs text-hero-soft/80">Free to use. No card needed.</p>
          </div>

          <MatchPreview />
        </div>
      </section>

      <section>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-line bg-surface p-6 shadow-sm transition hover:border-brand/40"
            >
              <span className="text-xs font-bold tracking-widest text-brand">
                0{index + 1}
              </span>
              <h2 className="mt-4 font-semibold text-ink">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-brand/20 bg-brand-soft p-8 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-ink">Ready when you are.</h2>
          <p className="mt-1 text-sm text-muted">Make an account, or have a look around first.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/register"
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink-soft transition hover:text-ink"
          >
            Log in
          </Link>
        </div>
      </section>
    </div>
  );
}

function SignedInHome({ user }) {
  const isRecruiter = user.role === ROLES.RECRUITER;
  const firstName = user.name?.split(' ')[0] || 'there';

  const shortcuts = isRecruiter
    ? [
        { to: '/jobs', title: 'Browse jobs', body: 'See what else is out there.' },
        { to: '/jobs/mine', title: 'My jobs', body: 'Edit or remove your listings.' },
        { to: '/jobs/new', title: 'Post a job', body: 'Add a role in a couple of minutes.' },
        { to: '/profile', title: 'My profile', body: 'Keep your details up to date.' },
      ]
    : [
        { to: '/jobs', title: 'Browse jobs', body: 'Filter by skill, city, or pay.' },
        { to: '/jobs/recommended', title: 'Recommended', body: 'Best fits from your resume.' },
        { to: '/applications/mine', title: 'My applications', body: 'Check where you stand.' },
        { to: '/resume', title: 'My resume', body: 'Update skills and match scores.' },
      ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-hero px-8 py-10 text-hero-ink sm:px-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-hero-accent">
          Welcome back
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Hello, {firstName}.</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-hero-soft sm:text-base">
          {isRecruiter
            ? 'Your listings and applicants are one click away.'
            : 'Pick up where you left off — there is nothing to catch up on.'}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:border-brand/40"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">{item.title}</h2>
              <span className="text-brand transition group-hover:translate-x-0.5">
                <ArrowIcon />
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">{item.body}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-sm font-bold text-ink">Your account</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-surface-alt p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Email</dt>
            <dd className="mt-1 break-all text-sm font-semibold text-ink">{user.email}</dd>
          </div>
          <div className="rounded-xl bg-surface-alt p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Role</dt>
            <dd className="mt-1 text-sm font-semibold capitalize text-ink">{user.role}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  return isAuthenticated ? <SignedInHome user={user} /> : <GuestHome />;
}
