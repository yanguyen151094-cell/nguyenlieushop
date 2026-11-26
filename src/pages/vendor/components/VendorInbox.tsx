import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatDateTime, timeAgo } from '@/lib/format';
import type { MessageRow } from '@/types/db';

interface Props {
  vendorId: string;
}

interface RoomInfo {
  user_id: string;
  name: string;
  email: string;
}

export default function VendorInbox({ vendorId }: Props) {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: roomRows, error: roomError } = await supabase
        .from('chat_rooms')
        .select('user_id')
        .eq('vendor_id', vendorId);
      if (roomError) throw roomError;
      const userIds = (roomRows ?? []).map((row) => (row as { user_id: string }).user_id);

      if (userIds.length === 0) {
        setRooms([]);
        setMessages([]);
        return;
      }

      const [profileRes, messageRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').in('id', userIds),
        supabase
          .from('messages')
          .select('*')
          .in('user_id', userIds)
          .order('created_at', { ascending: true })
          .limit(800),
      ]);
      if (profileRes.error) throw profileRes.error;
      if (messageRes.error) throw messageRes.error;

      const infoMap: Record<string, { name: string; email: string }> = {};
      (profileRes.data ?? []).forEach((row) => {
        const item = row as { id: string; full_name: string | null; email: string | null };
        infoMap[item.id] = {
          name: item.full_name?.trim() || item.email?.split('@')[0] || 'Người mua',
          email: item.email ?? '',
        };
      });

      setRooms(
        userIds.map((id) => ({
          user_id: id,
          name: infoMap[id]?.name ?? 'Người mua',
          email: infoMap[id]?.email ?? '',
        })),
      );
      setMessages((messageRes.data ?? []) as MessageRow[]);
      setSelected((prev) => prev && userIds.includes(prev) ? prev : userIds[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được hộp thư.');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => load(), 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  const thread = useMemo(
    () =>
      messages
        .filter((message) => message.user_id === selected)
        .slice()
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages, selected],
  );

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [thread.length, selected]);

  const send = async () => {
    const content = text.trim();
    if (!content || !selected) return;
    setSending(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from('messages').insert({
        user_id: selected,
        sender_role: 'vendor',
        content: content.slice(0, 1000),
      });
      if (insertError) throw insertError;
      setText('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-lg border border-background-200 bg-background-50 overflow-hidden">
      <div className="p-4 md:p-5 border-b border-background-200">
        <h2 className="font-heading text-base font-extrabold text-foreground-950">Hộp thư khách hàng</h2>
        <p className="mt-1 text-xs text-foreground-600">
          Những phòng chat mà quản trị viên đã thêm bạn vào. Tin nhắn hiển thị cho cả người mua, bạn và admin.
        </p>
      </div>

      {error && (
        <div className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-md border border-accent-300 bg-accent-50 px-3 py-2.5">
          <p className="text-xs text-accent-900">{error}</p>
          <button
            type="button"
            onClick={load}
            className="h-8 px-3 rounded-md bg-background-50 text-xs font-semibold text-accent-900 whitespace-nowrap cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {loading && rooms.length === 0 ? (
        <div className="p-4">
          <div className="h-40 rounded-md bg-background-100 animate-pulse"></div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <span className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-background-100 text-foreground-500">
            <i className="ri-chat-3-line text-xl leading-none"></i>
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground-900">Chưa được thêm vào phòng chat nào</p>
          <p className="mt-1 text-xs leading-relaxed text-foreground-600">
            Khi người mua liên hệ và quản trị viên thêm bạn vào phòng, hội thoại sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr]">
          <aside className="border-b lg:border-b-0 lg:border-r border-background-200 max-h-[420px] overflow-y-auto">
            {rooms.map((room) => {
              const last = messages
                .filter((message) => message.user_id === room.user_id)
                .slice()
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
              const active = selected === room.user_id;
              return (
                <button
                  key={room.user_id}
                  type="button"
                  onClick={() => setSelected(room.user_id)}
                  className={`w-full text-left px-3.5 py-3 border-b border-background-100 last:border-0 cursor-pointer ${
                    active ? 'bg-primary-50' : 'hover:bg-background-100'
                  }`}
                >
                  <p className="text-xs font-semibold text-foreground-950 truncate">{room.name}</p>
                  <p className="mt-0.5 text-[11px] text-foreground-600 line-clamp-1">
                    {last?.content ?? 'Chưa có tin nhắn'}
                  </p>
                  {last && (
                    <p className="mt-0.5 text-[10px] text-foreground-400">{timeAgo(last.created_at)}</p>
                  )}
                </button>
              );
            })}
          </aside>

          <div className="flex flex-col min-h-[360px]">
            {selected && (
              <>
                <div className="px-4 py-2.5 border-b border-background-200">
                  <p className="text-sm font-bold text-foreground-950">
                    {rooms.find((room) => room.user_id === selected)?.name ?? 'Người mua'}
                  </p>
                  <p className="text-[11px] text-foreground-500">
                    {rooms.find((room) => room.user_id === selected)?.email ?? ''}
                  </p>
                </div>
                <div ref={threadRef} className="flex-1 max-h-[300px] overflow-y-auto px-4 py-3 space-y-2.5 bg-background-100/50">
                  {thread.length === 0 ? (
                    <p className="py-6 text-center text-xs text-foreground-500">Chưa có tin nhắn trong phòng này.</p>
                  ) : (
                    thread.map((message) => {
                      const mine = message.sender_role === 'vendor';
                      const fromAdmin = message.sender_role === 'admin';
                      return (
                        <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] px-3 py-2 text-[12px] leading-relaxed rounded-lg ${
                              mine
                                ? 'bg-primary-500 text-background-50 rounded-br-sm'
                                : fromAdmin
                                  ? 'bg-accent-50 text-accent-900 border border-accent-200 rounded-bl-sm'
                                  : 'bg-background-50 text-foreground-800 border border-background-200 rounded-bl-sm'
                            }`}
                          >
                            {!mine && (
                              <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide opacity-70">
                                {fromAdmin ? 'Quản trị viên' : 'Người mua'}
                              </p>
                            )}
                            <p>{message.content}</p>
                            <p className={`mt-1 text-[9px] ${mine ? 'text-background-200' : 'text-foreground-400'}`}>
                              {formatDateTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                  className="border-t border-background-200 p-3 flex items-end gap-2"
                >
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={2}
                    maxLength={1000}
                    placeholder="Trả lời người mua..."
                    className="flex-1 px-3 py-2 rounded-md border border-background-300 bg-background-50 text-sm resize-none focus:outline-none focus:border-primary-400"
                  />
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="h-10 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-sm font-semibold hover:bg-primary-600 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                  >
                    <i className={`${sending ? 'ri-loader-4-line animate-spin' : 'ri-send-plane-2-fill'} text-sm leading-none`}></i>
                    Gửi
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}