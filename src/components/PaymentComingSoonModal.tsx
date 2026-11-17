import { CreditCard, Lock, ShieldCheck, X } from 'lucide-react';

interface PaymentComingSoonModalProps {
  open: boolean;
  onClose: () => void;
}

export function PaymentComingSoonModal({ open, onClose }: PaymentComingSoonModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-coming-soon-title"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 p-7 shadow-2xl text-slate-900">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close payment notice"
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B5ED7] mb-5">
          <CreditCard className="w-6 h-6" />
        </div>

        <h3
          id="payment-coming-soon-title"
          className="text-xl font-bold font-display text-slate-900 mb-2"
        >
          Online Payments Coming Soon!
        </h3>

        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          We are working on secure online payments. You can continue with your booking request and
          our team will update you when online payments become available.
        </p>

        <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-200 p-3.5 mb-6 text-xs text-slate-600">
          <Lock className="w-4 h-4 text-[#0B5ED7] shrink-0 mt-0.5" />
          <span>
            No card details or bank credentials are collected in this release. All bookings are
            submitted directly to your verified guide, hotel, or vehicle owner for confirmation.
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-[#0B5ED7]" />
            <span>Pay Later / On Confirmation</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#0B5ED7] text-white font-semibold text-sm hover:bg-[#0842A0] transition-colors cursor-pointer whitespace-nowrap"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
