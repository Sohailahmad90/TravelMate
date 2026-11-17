import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Plus, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';

interface ContactOption {
  uid: string;
  name: string;
  roleLabel: string;
  listingTitle?: string;
}

export function MessagingPanel() {
  const { firebaseUser, effectiveRole } = useAuth();
  const {
    messages,
    guides,
    hotels,
    vehicles,
    guideRequests,
    bookings,
    messagingTarget,
    setMessagingTarget,
    sendMessage,
  } = useMarketplace();

  const uid = firebaseUser?.uid || '';
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [chosenContactUid, setChosenContactUid] = useState('');

  // Build available contacts from requests, bookings, and marketplace partners
  const contactOptions = useMemo<ContactOption[]>(() => {
    const map = new Map<string, ContactOption>();

    const add = (opt: ContactOption) => {
      if (!opt.uid || opt.uid === uid) return;
      if (!map.has(opt.uid)) {
        map.set(opt.uid, opt);
      }
    };

    for (const r of guideRequests) {
      if (r.touristUid === uid) {
        add({
          uid: r.guideOwnerUid,
          name: r.guideName,
          roleLabel: 'Tour Guide',
          listingTitle: r.tripTitle,
        });
      } else if (r.guideOwnerUid === uid) {
        add({
          uid: r.touristUid,
          name: r.touristName,
          roleLabel: 'Tourist',
          listingTitle: r.tripTitle,
        });
      }
    }

    for (const b of bookings) {
      if (b.touristUid === uid) {
        add({
          uid: b.providerUid,
          name: b.providerName,
          roleLabel:
            b.bookingType === 'hotel'
              ? 'Hotel Owner'
              : b.bookingType === 'vehicle'
              ? 'Vehicle Owner'
              : 'Tour Guide',
          listingTitle: b.listingTitle,
        });
      } else if (b.providerUid === uid) {
        add({
          uid: b.touristUid,
          name: b.touristName,
          roleLabel: 'Guest / Tourist',
          listingTitle: b.listingTitle,
        });
      }
    }

    // For tourists or guides booking stays/rentals, also expose marketplace providers
    if (effectiveRole !== 'guide') {
      for (const g of guides) {
        add({
          uid: g.ownerUid,
          name: g.displayName,
          roleLabel: 'Tour Guide',
          listingTitle: `Tour Guide · ${g.displayName}`,
        });
      }
    }
    for (const h of hotels) {
      if (h.verificationStatus === 'verified') {
        add({
          uid: h.ownerUid,
          name: h.ownerName,
          roleLabel: 'Hotel Owner',
          listingTitle: h.name,
        });
      }
    }
    for (const v of vehicles) {
      if (v.verificationStatus === 'verified') {
        add({
          uid: v.ownerUid,
          name: v.ownerName,
          roleLabel: 'Vehicle Owner',
          listingTitle: v.name,
        });
      }
    }

    return Array.from(map.values());
  }, [uid, effectiveRole, guideRequests, bookings, guides, hotels, vehicles]);

  const threads = useMemo(() => {
    const map = new Map<
      string,
      {
        conversationKey: string;
        otherUid: string;
        otherName: string;
        listingTitle?: string;
        items: typeof messages;
      }
    >();

    for (const msg of messages) {
      const isMeSender = msg.senderUid === uid;
      const otherUid = isMeSender ? msg.recipientUid : msg.senderUid;
      const otherName = isMeSender ? msg.recipientName : msg.senderName;
      const current = map.get(msg.conversationKey) || {
        conversationKey: msg.conversationKey,
        otherUid,
        otherName,
        listingTitle: msg.relatedListingTitle,
        items: [],
      };
      current.items.push(msg);
      map.set(msg.conversationKey, current);
    }

    // Ensure pre-selected messagingTarget appears as an active draft thread immediately
    if (messagingTarget && messagingTarget.recipientUid && messagingTarget.recipientUid !== uid) {
      const pair = [uid, messagingTarget.recipientUid].sort();
      const targetKey = `${pair[0]}__${pair[1]}`.slice(0, 180);
      if (!map.has(targetKey)) {
        map.set(targetKey, {
          conversationKey: targetKey,
          otherUid: messagingTarget.recipientUid,
          otherName: messagingTarget.recipientName,
          listingTitle: messagingTarget.relatedListingTitle,
          items: [],
        });
      }
    }

    return Array.from(map.values());
  }, [messages, uid, messagingTarget]);

  useEffect(() => {
    if (messagingTarget && messagingTarget.recipientUid && uid) {
      const pair = [uid, messagingTarget.recipientUid].sort();
      const targetKey = `${pair[0]}__${pair[1]}`.slice(0, 180);
      setSelectedKey(targetKey);
      setSendErr(null);
    }
  }, [messagingTarget, uid]);

  const activeThread =
    threads.find((t) => t.conversationKey === selectedKey) || threads[0] || null;

  const handleStartContactChat = (e: React.FormEvent) => {
    e.preventDefault();
    const contact = contactOptions.find((c) => c.uid === chosenContactUid);
    if (!contact) return;
    setMessagingTarget({
      recipientUid: contact.uid,
      recipientName: contact.name,
      relatedListingTitle: contact.listingTitle,
    });
    setChosenContactUid('');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim()) return;
    setSending(true);
    setSendErr(null);
    try {
      await sendMessage({
        recipientUid: activeThread.otherUid,
        recipientName: activeThread.otherName,
        relatedListingTitle: activeThread.listingTitle,
        text: replyText.trim(),
      });
      setReplyText('');
    } catch (err) {
      setSendErr(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Start / Jump to Conversation Bar */}
      {contactOptions.length > 0 && (
        <form
          onSubmit={handleStartContactChat}
          className="rounded-2xl bg-white border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center gap-3"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 shrink-0">
            <MessageSquare className="w-4 h-4 text-[#0B5ED7]" />
            <span>Start Conversation:</span>
          </div>
          <select
            value={chosenContactUid}
            onChange={(e) => setChosenContactUid(e.target.value)}
            className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
          >
            <option value="">Select a tourist, guide, hotel, or vehicle owner...</option>
            {contactOptions.map((c) => (
              <option key={c.uid} value={c.uid}>
                {c.name} ({c.roleLabel}
                {c.listingTitle ? ` — ${c.listingTitle}` : ''})
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!chosenContactUid}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#0B5ED7] text-white text-xs font-bold hover:bg-[#0842A0] disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Open Chat</span>
          </button>
        </form>
      )}

      {threads.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-10 text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-[#0B5ED7] mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No conversations yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select a contact above or click &ldquo;Message&rdquo; on any request, tour package,
            hotel, or 4x4 vehicle to chat in real time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden min-h-[420px]">
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-200 divide-y divide-slate-100 bg-slate-50/50">
            {threads.map((th) => (
              <button
                key={th.conversationKey}
                type="button"
                onClick={() => setSelectedKey(th.conversationKey)}
                className={`w-full text-left p-4 transition-colors cursor-pointer ${
                  activeThread?.conversationKey === th.conversationKey
                    ? 'bg-blue-50/90 border-r-2 border-[#0B5ED7]'
                    : 'hover:bg-slate-100/70'
                }`}
              >
                <p className="text-sm font-bold text-slate-900">{th.otherName}</p>
                {th.listingTitle && (
                  <p className="text-[11px] font-medium text-[#0B5ED7] truncate">{th.listingTitle}</p>
                )}
                <p className="text-xs text-slate-500 truncate mt-1">
                  {th.items.length > 0
                    ? th.items[th.items.length - 1]?.text
                    : 'New conversation ready — send a message below'}
                </p>
              </button>
            ))}
          </div>

          <div className="md:col-span-8 flex flex-col justify-between p-4 sm:p-6">
            <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{activeThread?.otherName}</p>
                  {activeThread?.listingTitle && (
                    <p className="text-[11px] text-[#0B5ED7] font-medium">
                      Regarding: {activeThread.listingTitle}
                    </p>
                  )}
                </div>
              </div>

              {activeThread?.items.length === 0 && (
                <p className="text-xs text-slate-400 py-8 text-center">
                  Start your conversation with {activeThread.otherName} below.
                </p>
              )}

              {activeThread?.items.map((m) => {
                const mine = m.senderUid === uid;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        mine
                          ? 'bg-[#0B5ED7] text-white font-medium'
                          : 'bg-slate-100 text-slate-900 border border-slate-200'
                      }`}
                    >
                      <p>{m.text}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">{m.senderName}</span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSend} className="space-y-2 pt-4 mt-4 border-t border-slate-200">
              {sendErr && <p className="text-xs text-rose-600">{sendErr}</p>}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Message ${activeThread?.otherName}...`}
                  className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="px-5 py-2.5 rounded-xl bg-[#0B5ED7] text-white font-bold text-xs inline-flex items-center gap-1.5 hover:bg-[#0842A0] cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
