import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { formatDateTime, timeAgo } from '@/lib/format';
import type { MessageRow } from '@/types/db';
import TestAccountsPanel from './components/TestAccountsPanel';
import WithdrawalPanel from './components/WithdrawalPanel';
import DepositApprovalPanel from './components/DepositApprovalPanel';
import AdminBankAccounts from './components/AdminBankAccounts';
import AdminBannerEditor from './components/AdminBannerEditor';
import AdminLiveShowcaseEditor from './components/AdminLiveShowcaseEditor';
import AdminBrandFilterEditor from './components/AdminBrandFilterEditor';
import AdminFeePanel from './components/AdminFeePanel';

interface PersonMeta {
  full_name: string | null;
  email: string | null;
  role: string;
}

type Tab = 'inbox' | 'deposits' | 'withdrawals' | 'content' | 'fees' | 'tests';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'inbox', label: 'Hộp thư hỗ trợ', icon: 'ri-chat-3-line' },
  { key: 'deposits', label: 'Duyệt nạp tiền', icon: 'ri-wallet-3-line' },
  { key: 'withdrawals', label: 'Duyệt rút tiền', icon: 'ri-bank-card-line' },
  { key: 'content', label: 'Nội dung website', icon: 'ri-image-edit-line' },
  { key: 'fees', label: 'Phí & thông báo', icon: 'ri-money-dollar-circle-line' },
  { key: 'tests', label: 'Tài khoản test', icon: 'ri-user-settings-line' },
];

export default function AdminPage() {
  const { profile, loading, profileLoading, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('inbox');
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [people, setPeople] = useState<Record<string, PersonMeta>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Record<string, string | null>>({});
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [assignNote, setAssignNote] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(800);
      if (queryError) throw queryError;
      const list = (data ?? []) as MessageRow[];
      setRows(list);

      const [roomRes, vendorRes] = await Promise.all([
        supabase.from('chat_rooms').select('user_id, vendor_id'),
        supabase.from('profiles').select('id, full_name, store_name, email').eq('role', 'vendor'),
      ]);
      const roomMap: Record<string, string | null> = {};
      (roomRes.data ?? []).forEach((row) => {
        const item = row as { user_id: string; vendor_id: string | null };
        roomMap[item.user_id] = item.vendor_id;
      });
      setRooms(roomMap);
      setVendors(
        (vendorRes.data ?? []).map((row) => {
          const item = row as { id: string; full_name: string | null; store_name: string | null; email: string | null };
          return {
            id: item.id,
            name: item.store_name?.trim() || item.full_name?.trim() || item.email?.split('@')[0] || 'Đối tác',
          };
        }),
      );

      const ids = Array.from(new Set(list.map((item) => item.user_id)));
      if (ids.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .in('id', ids);
        const map: Record<string, PersonMeta> = {};
        (profileRows ?? []).forEach((row) => {
          const item = row as { id: string; full_name: string | null; email: string | null; role: string };
          map[item.id] = { full_name: item.full_name, email: item.email, role: item.role };
        });
        setPeople(map);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được hộp thư.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const row = payload.new as MessageRow;
        setRows((prev) => (prev.some((m) => m.id === row.id) ? prev : [row, ...prev]));
        if (!people[row.user_id]) {
          supabase
            .from('profiles')
            .select('id, full_name, email, role')
            .eq('id', row.user_id)
            .maybeSingle()
            .then(({ data }) => {
              const item = data as { id: string; full_name: string | null; email: string | null; role: string } | null;
              if (item) {
                setPeople((prev) => ({
                  ...prev,
                  [item.id]: { full_name: item.full_name, email: item.email, role: item.role },
                }));
              }
            });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [people]);

  const conversations = useMemo(() => {
    const map = new Map<string, { userId: string; last: MessageRow; unread: number; total: number }>();
    rows.forEach((row) => {
      const current = map.get(row.user_id);
      const unread = row.sender_role === 'user' && !row.is_read ? 1 : 0;
      if (!current) {
        map.set(row.user_id, { userId: row.user_id, last: row, unread, total: 1 });
      } else {
        current.unread += unread;
        current.total += 1;
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.last.created_at).getTime() - new Date(a.last.created_at).getTime(),
    );
  }, [rows]);

  const totalUnread = conversations.reduce((sum, item) => sum + item.unread, 0);

  useEffect(() => {
    if (!selected && conversations.length > 0) setSelected(conversations[0].userId);
  }, [conversations, selected]);

  const thread = useMemo(
    () =>
      rows
        .filter((row) => row.user_id === selected)
        .slice()
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [rows, selected],
  );

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [thread.length, selected]);

  useEffect(() => {
    if (!selected) return;
    const hasUnread = rows.some((row) => row.user_id === selected && row.sender_role === 'user' && !row.is_read);
    if (!hasUnread) return;
    supabase
      .from('messages')
      .update({ is_read: true })
      .eq('user_id', selected)
      .eq('sender_role', 'user')
      .eq('is_read', false)
      .then(() => {
        setRows((prev) =>
          prev.map((row) =>
            row.user_id === selected && row.sender_role === 'user' ? { ...row, is_read: true } : row,
          ),
        );
      });
  }, [selected, rows]);

  const assignVendor = async (userId: string, vendorId: string) => {
    setAssigning(true);
    setAssignNote(null);
    try {
      const payloadVendor = vendorId || null;
      const { error: upsertError } = await supabase.from('chat_rooms').upsert(
        {
          user_id: userId,
          vendor_id: payloadVendor,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      if (upsertError) throw upsertError;
      setRooms((prev) => ({ ...prev, [userId]: payloadVendor }));
      setAssignNote(payloadVendor ? 'Đã thêm đối tác vào phòng chat 3 bên.' : 'Đã gỡ đối tác khỏi phòng chat.');
    } catch (err) {
      setAssignNote(err instanceof Error ? err.message : 'Không cập nhật được phòng chat.');
    } finally {
      setAssigning(false);
    }
  };

  const sendReply = async () => {
    const content = reply.trim();
    if (!content || !selected) return;
    setSending(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from('messages').insert({
        user_id: selected,
        sender_role: 'admin',
        content: content.slice(0, 1000),
      });
      if (insertError) throw insertError;
      setReply('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="w-full px-4 md:px-8 py-10">
        <div className="h-72 rounded-lg bg-background-100 animate-pulse"></div>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="w-full px-4 md:px-8 py-16 text-center">
        <span className="mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-accent-100 text-accent-800">
          <i className="ri-shield-cross-line text-2xl leading-none"></i>
        </span>
        <h1 className="mt-4 font-heading text-xl font-extrabold text-foreground-950">Khu vực quản trị</h1>
        <p className="mt-1.5 text-sm text-foreground-600">
          Chỉ tài khoản quản trị viên mới xem được trang này. Vui lòng đăng nhập bằng tài khoản admin.
        </p>
        <Link
          to="/dang-nhap"
          className="mt-5 inline-flex h-10 px-4 items-center rounded-md bg-primary-500 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer"
        >
          Đăng nhập quản trị
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 py-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-extrabold tracking-tight text-foreground-950">
            Trung tâm quản trị
          </h1>
          <p className="mt-1 text-xs text-foreground-600">
            Duyệt tiền, quản lý ngân hàng nhận nạp, chỉnh nội dung website và phí trưng bày gian hàng.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-secondary-100 text-[11px] font-semibold text-secondary-900 whitespace-nowrap">
            <i className="ri-chat-3-line text-xs leading-none"></i>
            {conversations.length} hội thoại
          </span>
          <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-accent-100 text-[11px] font-semibold text-accent-900 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500"></span>
            {totalUnread} tin chưa đọc
          </span>
          <span className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-background-100 border border-background-200 text-[11px] font-semibold text-foreground-800 whitespace-nowrap max-w-[220px]">
            <span className="w-5 h-5 shrink-0 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold uppercase">
              {(profile?.full_name?.trim() || profile?.email || 'A').slice(0, 1)}
            </span>
            <span className="truncate">{profile?.full_name?.trim() || profile?.email || 'Quản trị viên'}</span>
          </span>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate('/', { replace: true });
            }}
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border border-background-300 text-[11px] font-semibold text-foreground-800 hover:bg-background-100 hover:text-primary-700 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-logout-box-r-line text-sm leading-none"></i>
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 p-1 rounded-full bg-background-100 border border-background-200 w-full overflow-x-auto no-scrollbar">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              tab === item.key ? 'bg-primary-500 text-background-50' : 'text-foreground-700 hover:text-primary-600'
            }`}
          >
            <i className={`${item.icon} text-sm leading-none`}></i>
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'tests' && <TestAccountsPanel />}

        {tab === 'deposits' && (
          <div className="space-y-4">
            <DepositApprovalPanel onChanged={refreshProfile} />
            <AdminBankAccounts />
          </div>
        )}

        {tab === 'withdrawals' && <WithdrawalPanel />}

        {tab === 'content' && (
          <div className="space-y-4">
            <AdminBannerEditor />
            <AdminBrandFilterEditor />
            <AdminLiveShowcaseEditor />
          </div>
        )}

        {tab === 'fees' && <AdminFeePanel />}

        {tab === 'inbox' && (
          <>
            {error && (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-accent-300 bg-accent-50 px-3 py-2.5">
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

            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
              <aside className="rounded-lg border border-background-200 bg-background-50 overflow-hidden">
                <div className="px-3.5 py-2.5 border-b border-background-200">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-500">
                    Danh sách hội thoại
                  </p>
                </div>
                <div className="max-h-[440px] overflow-y-auto">
                  {loadingData && conversations.length === 0 ? (
                    <p className="px-3.5 py-6 text-center text-xs text-foreground-500">Đang tải...</p>
                  ) : conversations.length === 0 ? (
                    <p className="px-3.5 py-6 text-center text-xs text-foreground-500">Chưa có tin nhắn nào.</p>
                  ) : (
                    conversations.map((item) => {
                      const person = people[item.userId];
                      const name = person?.full_name?.trim() || person?.email?.split('@')[0] || 'Người dùng';
                      const active = selected === item.userId;
                      return (
                        <button
                          key={item.userId}
                          type="button"
                          onClick={() => setSelected(item.userId)}
                          className={`w-full text-left px-3.5 py-3 border-b border-background-100 last:border-0 transition-colors cursor-pointer ${
                            active ? 'bg-primary-50' : 'hover:bg-background-100'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground-950 truncate">{name}</span>
                            {item.unread > 0 && (
                              <span className="min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-accent-500 text-[9px] font-bold text-background-50">
                                {item.unread}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-foreground-600 line-clamp-1">{item.last.content}</p>
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-foreground-400">
                            <span className="truncate max-w-[150px]">{person?.email ?? 'không rõ email'}</span>
                            <span>·</span>
                            <span className="whitespace-nowrap">{timeAgo(item.last.created_at)}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </aside>

              <section className="rounded-lg border border-background-200 bg-background-50 overflow-hidden flex flex-col min-h-[420px]">
                {!selected ? (
                  <div className="flex-1 flex items-center justify-center px-4 py-12 text-center">
                    <p className="text-sm text-foreground-500">Chọn một hội thoại để xem tin nhắn.</p>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-3 border-b border-background-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground-950 truncate">
                          {people[selected]?.full_name?.trim() || people[selected]?.email?.split('@')[0] || 'Người dùng'}
                        </p>
                        <p className="text-[11px] text-foreground-500 truncate">
                          {people[selected]?.email ?? 'không rõ email'} · {people[selected]?.role ?? 'user'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 h-7 px-2 rounded-full bg-background-100 text-[10px] font-semibold text-foreground-700 whitespace-nowrap">
                          <i className="ri-group-line text-xs leading-none"></i>
                          Phòng 3 bên
                        </span>
                        <select
                          value={rooms[selected ?? ''] ?? ''}
                          onChange={(e) => selected && assignVendor(selected, e.target.value)}
                          disabled={assigning}
                          className="h-7 px-2 rounded-md border border-background-300 bg-background-50 text-[11px] font-medium text-foreground-800 focus:outline-none focus:border-primary-400 cursor-pointer max-w-[200px]"
                        >
                          <option value="">Chưa thêm đối tác</option>
                          {vendors.map((vendor) => (
                            <option key={vendor.id} value={vendor.id}>
                              {vendor.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {assignNote && (
                      <p className="px-4 py-1.5 text-[11px] text-accent-800 bg-accent-50 border-b border-accent-100">
                        {assignNote}
                      </p>
                    )}

                    <div
                      ref={threadRef}
                      className="flex-1 max-h-[360px] overflow-y-auto px-4 py-4 space-y-2.5 bg-background-100/50"
                    >
                      {thread.map((message) => {
                        const mine = message.sender_role === 'admin';
                        return (
                          <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
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
                                  {message.sender_role === 'vendor' ? 'Đối tác' : 'Người mua'}
                                </p>
                              )}
                              <p>{message.content}</p>
                              <p className={`mt-1 text-[9px] ${mine ? 'text-background-200' : 'text-foreground-400'}`}>
                                {formatDateTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendReply();
                      }}
                      className="border-t border-background-200 p-3 flex items-end gap-2"
                    >
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        rows={2}
                        maxLength={1000}
                        placeholder="Nhập câu trả lời cho khách..."
                        className="flex-1 px-3 py-2 rounded-md border border-background-300 bg-background-50 text-sm resize-none focus:outline-none focus:border-primary-400"
                      />
                      <button
                        type="submit"
                        disabled={sending || !reply.trim()}
                        className="h-10 px-4 inline-flex items-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-sm font-semibold hover:bg-primary-600 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                      >
                        <i
                          className={`${
                            sending ? 'ri-loader-4-line animate-spin' : 'ri-send-plane-2-fill'
                          } text-sm leading-none`}
                        ></i>
                        Gửi
                      </button>
                    </form>
                  </>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}