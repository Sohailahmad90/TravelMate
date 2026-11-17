import { Mail, MapPin, Mountain, Phone } from 'lucide-react';
import { ActivePage } from '../types/travelmate';

interface FooterProps {
  onNavigate: (page: ActivePage, section?: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const go = (page: ActivePage, section?: string) => {
    onNavigate(page, section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-200">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <div className="w-8 h-8 rounded-lg bg-[#0B5ED7] text-white flex items-center justify-center shrink-0">
                <Mountain className="w-4 h-4" />
              </div>
              <span className="text-xl font-extrabold font-display">TravelMate</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your trusted Pakistan travel partner connecting explorers with verified local tour
              guides, mountain hotels, and 4x4 vehicles.
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 font-display mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => go('about', 'about')}
                  className="hover:text-[#0B5ED7] transition-colors cursor-pointer"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => go('guides')}
                  className="hover:text-[#0B5ED7] transition-colors cursor-pointer"
                >
                  Verified Tour Guides
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => go('packages')}
                  className="hover:text-[#0B5ED7] transition-colors cursor-pointer"
                >
                  Tour Packages
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => go('trip-planner')}
                  className="hover:text-[#0B5ED7] transition-colors cursor-pointer"
                >
                  Custom Trip Planner
                </button>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 font-display mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => go('about', 'contact')}
                  className="hover:text-[#0B5ED7] transition-colors cursor-pointer"
                >
                  Contact Support
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => go('about', 'terms')}
                  className="hover:text-[#0B5ED7] transition-colors cursor-pointer"
                >
                  Terms &amp; Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => go('about', 'privacy')}
                  className="hover:text-[#0B5ED7] transition-colors cursor-pointer"
                >
                  Privacy Policy (CNIC Safety)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => go('about', 'cancellation')}
                  className="hover:text-[#0B5ED7] transition-colors cursor-pointer"
                >
                  Cancellation Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 font-display mb-4">Contact Us</h4>
            <div className="space-y-2.5 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#0B5ED7] shrink-0" />
                <span className="font-mono-num">+92 51 844 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0B5ED7] shrink-0" />
                <span>concierge@travelmate.pk</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#0B5ED7] shrink-0 mt-0.5" />
                <span>Blue Area, Islamabad &amp; Karimabad, Hunza</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} TravelMate Pakistan. All rights reserved.</p>
          <p>Online payments disabled in current release · Pay on provider confirmation</p>
        </div>
      </div>
    </footer>
  );
}
