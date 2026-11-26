import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import type { MessageRow } from '@/types/db';

export default function ChatWidget() {
  const { session, profile } = useAuth();
  const location = useLocation();
  const userId = session?.user?.id ?? null;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback((behavior: 'auto' | 'smooth' = 'smooth') => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!userId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error: queryError } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(200);
      if (queryError) throw queryError;
      setMessages((data ?? []) as MessageRow[]);
    } catch {
      setError('Không tải được tin nhắn.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('yamato:open-chat', handler);
    return () => window.removeEventListener('yamato:open-chat', handler);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const raw = localStorage.getItem('yamato_partner_intent');
    if (!raw) return;
    localStorage.removeItem('yamato_partner_intent');
    let payload: { shopName?: string; phone?: string; note?: string } = {};
    try {
      payload = JSON.parse(raw) as { shopName?: string; phone?: string; note?: string };
    } catch {
      return;
    }
    const content = [
      'Đăng ký làm đối tác bán hàng',
      `Tên shop: ${payload.shopName ?? ''}`,
      `Điện thoại: ${payload.phone || 'Chưa cung cấp'}`,
      `Ghi chú: ${payload.note || 'Không có'}`,
    ]
      .join('\n')
      .slice(0, 1000);
    supabase
      .from('messages')
      .insert({ user_id: userId, sender_role: 'user', content })
      .then(() => {
        setOpen(true);
        loadMessages();
      });
  }, [userId, loadMessages]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`support-chat-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as MessageRow;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!open || !userId) return;
    const timer = window.setInterval(() => {
      loadMessages();
    }, 12000);
    return () => window.clearInterval(timer);
  }, [open, userId, loadMessages]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      scrollToBottom('auto');
    } else if (userId) {
      const count = messages.filter((m) => m.sender_role !== 'user' && !m.is_read).length;
      setUnread(count);
    }
  }, [messages, open, userId, scrollToBottom]);

  useEffect(() => {
    if (!open || messages.length === 0) return;
    const timer = window.setTimeout(() => scrollToBottom('smooth'), 120);
    return () => window.clearTimeout(timer);
  }, [messages.length, open, scrollToBottom]);

  const send = async () => {
    const content = text.trim();
    if (!content || !userId) return;
    setSending(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from('messages').insert({
        user_id: userId,
        sender_role: 'user',
        content: content.slice(0, 1000),
      });
      if (insertError) throw insertError;
      setText('');
      await loadMessages();
      window.setTimeout(() => scrollToBottom('smooth'), 120);
    } catch {
      setError('Không gửi được tin nhắn, vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  if (location.pathname.startsWith('/quan-tri') || profile?.role === 'admin') return null;

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 md:right-6 z-[60] w-[calc(100vw-2rem)] max-w-[360px] rounded-lg border border-background-200 bg-background-50 overflow-hidden animate-fade-up">
          <div className="flex items-center justify-between gap-2 px-3.5 py-3 bg-primary-950">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-full bg-background-50/15 flex items-center justify-center">
                <i className="ri-headphone-line text-background-50 text-sm leading-none"></i>
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-background-50 whitespace-nowrap">Hỗ trợ trực tuyến</p>
                <p className="flex items-center gap-1 text-[10px] text-background-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-dot-pulse"></span>
Admin & đối tác · trả lời trong phòng riêng
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng khung chat"
              className="w-7 h-7 flex items-center justify-center rounded text-background-200 hover:text-background-50 cursor-pointer"
            >
              <i className="ri-close-line text-base leading-none"></i>
            </button>
          </div>

          {!userId ? (
            <div className="px-4 py-8 text-center">
              <span className="mx-auto w-11 h-11 flex items-center justify-center rounded-full bg-background-100 text-foreground-500">
                <i className="ri-lock-2-line text-lg leading-none"></i>
              </span>
              <p className="mt-3 text-sm font-semibold text-foreground-900">Đăng nhập để trò chuyện</p>
              <p className="mt-1 text-[11px] leading-relaxed text-foreground-600">
                Tin nhắn được lưu lại để quản trị viên hỗ trợ bạn nhanh nhất.
              </p>
              <Link
                to="/dang-nhap"
                className="mt-3 inline-flex h-9 px-4 items-center rounded-md bg-primary-500 text-background-50 text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                Đăng nhập
              </Link>
            </div>
          ) : (
            <>
              <div
                ref={listRef}
                className="h-[298px] overflow-y-auto px-3 py-3 space-y-2.5 bg-background-100/60 no-scrollbar"
              >
                {loading && messages.length === 0 ? (
                  <p className="py-6 text-center text-[11px] text-foreground-500">Đang tải tin nhắn...</p>
                ) : messages.length === 0 ? (
                  <div className="flex items-start gap-2">
                    <span className="w-7 h-7 shrink-0 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                      <i className="ri-customer-service-2-line text-xs leading-none"></i>
                    </span>
                    <div className="max-w-[85%] rounded-lg rounded-tl-sm bg-background-50 border border-background-200 px-3 py-2">
                      <p className="text-[11px] leading-relaxed text-foreground-700">
                        Xin chào {profile?.full_name?.trim() || 'bạn'}! Bạn cần hỗ trợ nạp tiền, mua tài khoản hay mở gian
                        hàng đối tác? Nhắn ngay tại đây nhé.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const mine = message.sender_role === 'user';
                    return (
                      <div key={message.id} className={`flex items-end gap-1.5 ${mine ? 'justify-end' : 'justify-start'}`}>
                        {!mine && (
                          <span className="w-7 h-7 shrink-0 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                            <i className="ri-customer-service-2-line text-xs leading-none"></i>
                          </span>
                        )}
                        <div
                          className={`max-w-[80%] px-3 py-2 text-[12px] leading-relaxed ${
                            mine
                              ? 'bg-primary-500 text-background-50 rounded-lg rounded-br-sm'
                              : message.sender_role === 'vendor'
                                ? 'bg-accent-50 text-accent-900 border border-accent-200 rounded-lg rounded-bl-sm'
                                : 'bg-background-50 text-foreground-800 border border-background-200 rounded-lg rounded-bl-sm'
                          }`}
                        >
                          {!mine && (
                            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide opacity-70">
                              {message.sender_role === 'vendor' ? 'Đối tác bán hàng' : 'Hỗ trợ viên'}
                            </p>
                          )}
                          {message.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {error && <p className="px-3 pt-2 text-[11px] text-accent-800">{error}</p>}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-center gap-2 border-t border-background-200 px-2.5 py-2.5 bg-background-50"
              >
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  maxLength={1000}
                  className="flex-1 h-9 px-3 rounded-full border border-background-300 bg-background-100 text-xs focus:outline-none focus:border-primary-400 focus:bg-background-50"
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  aria-label="Gửi tin nhắn"
                  className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-primary-500 text-background-50 hover:bg-primary-600 disabled:opacity-50 cursor-pointer"
                >
                  <i className={`${sending ? 'ri-loader-4-line animate-spin' : 'ri-send-plane-2-fill'} text-sm leading-none`}></i>
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Mở khung chat hỗ trợ"
        className="fixed bottom-5 right-4 md:right-6 z-[60] w-14 h-14 flex items-center justify-center rounded-full bg-primary-500 text-background-50 hover:bg-primary-600 transition-colors cursor-pointer"
      >
        <i className={`${open ? 'ri-close-line' : 'ri-chat-3-line'} text-2xl leading-none`}></i>
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-background-50">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </>
  );
}