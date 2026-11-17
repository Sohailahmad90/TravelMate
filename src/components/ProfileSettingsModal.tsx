import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, LogOut, Mail, MapPin, Phone, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/travelmate';

const ROLE_LABELS: Record<UserRole, string> = {
  tourist: 'Traveller / Tourist',
  guide: 'Tour Guide',
  hotel_owner: 'Hotel Owner',
  vehicle_owner: 'Vehicle / Fleet Owner',
  admin: 'Administrator',
};

function resizeImageToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const size = 160;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unavailable.'));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ProfileSettingsModal() {
  const {
    firebaseUser,
    profile,
    effectiveRole,
    profileSettingsOpen,
    closeProfileSettings,
    updateProfileInfo,
    switchRole,
    logout,
    isAdmin,
  } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profileSettingsOpen && firebaseUser) {
      setFullName(profile?.fullName || firebaseUser.displayName || '');
      setEmail(profile?.email || firebaseUser.email || '');
      setPhone(profile?.phone || '');
      setCity(profile?.city || 'Islamabad');
      setAvatarUrl(profile?.avatarUrl || firebaseUser.photoURL || '');
      setStatusMsg(null);
      setErrorMsg(null);
    }
  }, [profileSettingsOpen, firebaseUser, profile]);

  if (!profileSettingsOpen || !firebaseUser) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    try {
      const dataUrl = await resizeImageToAvatarDataUrl(file);
      setAvatarUrl(dataUrl);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to process image.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      setErrorMsg('Please enter at least 2 characters for your full name.');
      return;
    }
    setSaving(true);
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      await updateProfileInfo({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim() || 'Islamabad',
        avatarUrl: avatarUrl.trim(),
      });
      setStatusMsg('Profile settings saved successfully.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (fullName || firebaseUser.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-settings-title"
      onClick={closeProfileSettings}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl text-slate-900 my-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeProfileSettings}
          aria-label="Close profile settings"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 id="profile-settings-title" className="text-2xl font-bold font-display text-slate-900">
            Profile Settings
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Update your name, contact details, profile photo, or active role.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Avatar upload & preview */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[#0B5ED7] text-white flex items-center justify-center font-bold text-lg shrink-0 border-2 border-white shadow-sm">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || 'Profile'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:border-[#0B5ED7] hover:text-[#0B5ED7] cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload New Photo</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                type="url"
                value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Or paste image URL (https://...)"
                className="w-full rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0B5ED7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-200 pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-200 pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full rounded-xl bg-white border border-slate-200 pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                City
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Islamabad / Gilgit"
                  className="w-full rounded-xl bg-white border border-slate-200 pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>
            </div>
          </div>

          {/* Active Workspace / Role Switcher */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-800">Active Role Workspace</p>
              <p className="text-xs text-slate-500">
                Currently viewing as{' '}
                <span className="font-semibold text-[#0B5ED7]">
                  {effectiveRole ? ROLE_LABELS[effectiveRole] : 'Traveller'}
                </span>
              </p>
            </div>
            <select
              aria-label="Switch active role"
              value={effectiveRole || 'tourist'}
              onChange={(e) => void switchRole(e.target.value as UserRole)}
              className="rounded-lg bg-white border border-blue-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0B5ED7]"
            >
              <option value="tourist">Traveller / Tourist</option>
              <option value="guide">Tour Guide</option>
              <option value="hotel_owner">Hotel Owner</option>
              <option value="vehicle_owner">Vehicle Owner</option>
              {isAdmin && <option value="admin">Admin Console</option>}
            </select>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
              {errorMsg}
            </p>
          )}
          {statusMsg && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={closeProfileSettings}
                className="px-4 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] disabled:opacity-60 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
