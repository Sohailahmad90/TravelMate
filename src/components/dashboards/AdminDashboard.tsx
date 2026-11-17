import { useState } from 'react';
import {
  BadgeCheck,
  CreditCard,
  Database,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { formatPkr } from '../../types/travelmate';

export function AdminDashboard() {
  const {
    guides,
    hotels,
    vehicles,
    bookings,
    allUsers,
    allVerifications,
    adminVerifyGuide,
    adminVerifyPartner,
    adminToggleUserSuspend,
    adminSeedCatalogToFirestore,
  } = useMarketplace();

  const [tab, setTab] = useState<
    'overview' | 'guides' | 'partners' | 'users' | 'bookings' | 'payments'
  >('overview');
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedStatus(null);
    try {
      const count = await adminSeedCatalogToFirestore();
      setSeedStatus(`Successfully persisted ${count} Pakistan catalog documents into Firestore!`);
    } catch (err) {
      setSeedStatus(err instanceof Error ? err.message : 'Seed failed.');
    } finally {
      setSeeding(false);
    }
  };

  const pendingVerifications = allVerifications.filter(
    (v) => v.status === 'pending' || v.status === 'under_review'
  );
  const verifiedGuidesCount = guides.filter((g) => g.verificationStatus === 'verified').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'overview', label: 'Platform Overview' },
              { id: 'guides', label: `Guide Verification (${pendingVerifications.length})` },
              { id: 'partners', label: 'Hotels & Vehicles' },
              { id: 'users', label: `Users (${allUsers.length})` },
              { id: 'bookings', label: `All Bookings (${bookings.length})` },
              { id: 'payments', label: 'Payment Settings' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                tab === item.id
                  ? 'bg-[#0B5ED7] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={seeding}
          onClick={() => void handleSeed()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#0B5ED7] bg-blue-50 text-[#0B5ED7] text-xs font-bold hover:bg-[#0B5ED7] hover:text-white transition-colors cursor-pointer"
        >
          <Database className="w-3.5 h-3.5" />
          <span>{seeding ? 'Syncing Catalog...' : 'Seed Catalog to Firestore'}</span>
        </button>
      </div>

      {seedStatus && (
        <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 font-medium">
          {seedStatus}
        </p>
      )}

      {tab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Registered Users', val: allUsers.length },
            { label: 'Verified Guides', val: verifiedGuidesCount },
            { label: 'Hotels Listed', val: hotels.length },
            { label: 'Vehicles Listed', val: vehicles.length },
            { label: 'Total Bookings', val: bookings.length },
            {
              label: 'Active Bookings',
              val: bookings.filter((b) =>
                ['pending', 'accepted', 'confirmed', 'active'].includes(b.bookingStatus)
              ).length,
            },
            {
              label: 'Completed Bookings',
              val: bookings.filter((b) => b.bookingStatus === 'completed').length,
            },
            { label: 'Pending CNIC Reviews', val: pendingVerifications.length },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5">
              <span className="text-xs text-slate-500 font-medium">{m.label}</span>
              <p className="text-3xl font-extrabold font-mono-num text-slate-900 mt-1">{m.val}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'guides' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs text-slate-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0B5ED7] shrink-0" />
            <span>
              Admin-only private CNIC verification inspector. CNIC numbers are hidden from public
              pages.
            </span>
          </div>

          {allVerifications.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
              No guide CNIC verification submissions in Firestore yet.
            </div>
          ) : (
            allVerifications.map((ver) => (
              <div
                key={ver.guideId}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{ver.legalFullName}</span>
                    {ver.status === 'verified' && <BadgeCheck className="w-4 h-4 text-[#0B5ED7]" />}
                  </h3>
                  <span className="text-xs font-mono-num font-bold uppercase text-[#0B5ED7]">
                    {ver.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block">CNIC Number</span>
                    <span className="font-mono-num font-semibold text-slate-900">{ver.cnicNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Contact</span>
                    <span>{ver.contactNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Address</span>
                    <span>{ver.address}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Docs: {ver.cnicFrontReference} · {ver.cnicBackReference} · {ver.certificateTitle}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      void adminVerifyGuide(ver.guideId, 'verified', 'CNIC & credentials approved.')
                    }
                    className="px-4 py-1.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] cursor-pointer"
                  >
                    Approve &amp; Verify
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void adminVerifyGuide(
                        ver.guideId,
                        'resubmission_required',
                        'Please upload clearer CNIC scan references.'
                      )
                    }
                    className="px-4 py-1.5 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Request Resubmission
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void adminVerifyGuide(ver.guideId, 'rejected', 'Identity details rejected.')
                    }
                    className="px-4 py-1.5 rounded-full border border-rose-200 bg-rose-50 text-rose-600 text-xs font-semibold cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'partners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Hotel Approvals</h3>
            {hotels.map((h) => (
              <div
                key={h.id}
                className="border-b border-slate-100 pb-3 last:border-none flex items-center justify-between gap-2"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{h.name}</p>
                  <p className="text-xs text-slate-500">
                    {h.destination} · {h.verificationStatus}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => void adminVerifyPartner('hotels', h.id, 'verified')}
                    className="px-3 py-1 rounded-full bg-[#0B5ED7] text-white text-xs font-bold cursor-pointer"
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => void adminVerifyPartner('hotels', h.id, 'rejected')}
                    className="px-3 py-1 rounded-full border border-rose-200 text-rose-600 text-xs font-semibold cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Vehicle Approvals</h3>
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="border-b border-slate-100 pb-3 last:border-none flex items-center justify-between gap-2"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{v.name}</p>
                  <p className="text-xs text-slate-500">
                    {v.category} · {v.pickupLocation} · {v.verificationStatus}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => void adminVerifyPartner('vehicles', v.id, 'verified')}
                    className="px-3 py-1 rounded-full bg-[#0B5ED7] text-white text-xs font-bold cursor-pointer"
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => void adminVerifyPartner('vehicles', v.id, 'rejected')}
                    className="px-3 py-1 rounded-full border border-rose-200 text-rose-600 text-xs font-semibold cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">City</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allUsers.map((u) => (
                <tr key={u.uid}>
                  <td className="p-4 font-semibold text-slate-900">{u.fullName}</td>
                  <td className="p-4 text-slate-600">{u.email}</td>
                  <td className="p-4 text-[#0B5ED7] font-bold uppercase">{u.role}</td>
                  <td className="p-4 text-slate-600">{u.city || '—'}</td>
                  <td className="p-4 text-slate-700">{u.isSuspended ? 'Suspended' : 'Active'}</td>
                  <td className="p-4 text-right">
                    {u.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => void adminToggleUserSuspend(u.uid, !u.isSuspended)}
                        className="px-3 py-1 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {allUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <Users className="w-6 h-6 mx-auto mb-2 text-[#0B5ED7]" />
                    No additional registered user documents yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl bg-white border border-slate-200 shadow-xs p-4 flex flex-wrap justify-between gap-2 text-xs"
            >
              <div>
                <p className="font-bold text-slate-900 text-sm">{b.listingTitle}</p>
                <p className="text-slate-600">
                  {b.touristName} &rarr; {b.providerName} · {b.bookingType} · {b.startDate} to{' '}
                  {b.endDate}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono-num font-bold text-[#0B5ED7]">
                  {formatPkr(b.estimatedTotalPkr)}
                </p>
                <p className="uppercase font-semibold text-slate-500">{b.bookingStatus}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'payments' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-8 space-y-4 max-w-2xl">
          <div className="flex items-center gap-3 text-[#0B5ED7]">
            <CreditCard className="w-6 h-6" />
            <h3 className="text-xl font-bold font-display text-slate-900">
              Online Payment Settings — Disabled (Coming Soon)
            </h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            In the current TravelMate release, online card/wallet gateways are intentionally
            disabled. Bookings record{' '}
            <code className="text-[#0B5ED7] bg-blue-50 px-1.5 py-0.5 rounded">
              paymentStatus: not_required_yet
            </code>{' '}
            independently from booking confirmation status, ready for future payment gateway
            integration without database refactoring.
          </p>
        </div>
      )}
    </div>
  );
}
