import React, { useState } from 'react';
import { CheckCircle2, Lock, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { ABOUT_IMAGE } from '../data/seedData';
import { ResilientImage } from '../components/ResilientImage';

interface AboutPageProps {
  initialSection?: string;
}

export function AboutPage({ initialSection = 'about' }: AboutPageProps) {
  const [tab, setTab] = useState<'about' | 'contact' | 'terms' | 'privacy' | 'cancellation'>(
    (initialSection as 'about' | 'contact' | 'terms' | 'privacy' | 'cancellation') || 'about'
  );
  const [sent, setSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'about', label: 'About Us' },
            { id: 'contact', label: 'Contact Us' },
            { id: 'terms', label: 'Terms & Conditions' },
            { id: 'privacy', label: 'Privacy Policy' },
            { id: 'cancellation', label: 'Cancellation Policy' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              tab === item.id
                ? 'bg-[#0B5ED7] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'about' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl bg-white border border-slate-200 shadow-xs p-6 sm:p-10">
          <div className="lg:col-span-6 rounded-2xl border border-slate-200 overflow-hidden aspect-[4/3]">
            <ResilientImage
              src={ABOUT_IMAGE}
              alt="TravelMate local Pakistani guides"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-6 space-y-4">
            <h1 className="text-3xl font-extrabold font-display text-slate-900">
              About <span className="text-[#0B5ED7]">TravelMate</span>
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              TravelMate is built for Pakistan’s northern valleys and mountain corridors — uniting
              tourists, CNIC-verified tour guides, boutique hotels, and 4x4 rental operators on one
              transparent marketplace.
            </p>
            <div className="space-y-2.5 text-xs text-slate-700 pt-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0B5ED7]" />
                <span>Private CNIC verification for official Trusted Guide badges.</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0B5ED7]" />
                <span>Independent hotel and vehicle rentals without mandatory packages.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'contact' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
            <h2 className="text-2xl font-bold font-display text-slate-900">Contact Concierge</h2>
            <p className="text-sm text-slate-600">
              Need help with guide verification, group tours, or regional route conditions?
            </p>
            <div className="space-y-3 text-sm text-slate-700 pt-2">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0B5ED7]" /> Blue Area, Sector F-6, Islamabad
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#0B5ED7]" /> +92 51 844 2026
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0B5ED7]" /> concierge@travelmate.pk
              </p>
            </div>
          </div>
          <form
            onSubmit={handleContactSubmit}
            className="md:col-span-7 rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4"
          >
            <h3 className="text-lg font-bold font-display text-slate-900">Send a Message</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="Your Name"
                className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900"
              />
              <input
                type="email"
                required
                placeholder="Email Address"
                className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900"
              />
            </div>
            <textarea
              rows={4}
              required
              placeholder="How can our Pakistan travel team assist?"
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900"
            />
            {sent && (
              <p className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Inquiry recorded! Our support team will reply
                shortly.
              </p>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#0B5ED7] text-white font-bold text-xs hover:bg-[#0842A0] cursor-pointer"
            >
              Submit Inquiry
            </button>
          </form>
        </div>
      )}

      {tab === 'terms' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-8 space-y-4 text-sm text-slate-600 leading-relaxed">
          <h2 className="text-2xl font-bold font-display text-slate-900">Terms &amp; Conditions</h2>
          <p>
            TravelMate connects travellers directly with independent tour guides, hotel owners, and
            vehicle rental partners. Booking requests submitted on TravelMate represent formal
            reservation inquiries subject to provider confirmation.
          </p>
          <p>
            Online payment gateways are currently disabled; no card information is collected on the
            platform. Displayed trip budgets and rental estimates remain indicative until confirmed
            by the respective partner.
          </p>
        </div>
      )}

      {tab === 'privacy' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-8 space-y-4 text-sm text-slate-600 leading-relaxed">
          <h2 className="text-2xl font-bold font-display text-slate-900">
            Privacy Policy &amp; CNIC Data Protection
          </h2>
          <p>
            CNIC numbers, front/back document references, legal addresses, and personal phone
            numbers submitted by tour guides and partners are stored in isolated private Firestore
            collections accessible strictly to the submitting owner and authorized TravelMate
            administrators.
          </p>
          <p>CNIC numbers and identity files are never displayed on public profiles.</p>
        </div>
      )}

      {tab === 'cancellation' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-8 space-y-4 text-sm text-slate-600 leading-relaxed">
          <h2 className="text-2xl font-bold font-display text-slate-900">Cancellation Policy</h2>
          <p>
            Tourists may cancel any pending or confirmed booking directly from their Tourist
            Dashboard prior to trip start. Individual hotels and vehicle owners specify advance
            cancellation windows (typically 24 to 72 hours) on each listing.
          </p>
        </div>
      )}
    </div>
  );
}
