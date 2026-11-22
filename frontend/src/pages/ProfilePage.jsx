import { useAuth } from '../context/AuthContext.jsx';

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-4 sm:flex-row sm:justify-between">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-800 sm:text-right">{value}</dd>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const joinedOn = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-sm capitalize text-slate-500">{user.role}</p>
          </div>
        </div>

        <dl className="mt-8">
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Account ID" value={user._id} />
          <DetailRow label="Member since" value={joinedOn} />
        </dl>
      </div>
    </div>
  );
}
