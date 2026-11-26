import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useSiteSetting } from '@/hooks/useSiteSetting';
import { SETTING_KEYS, type DepositBank } from '@/lib/siteContent';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Deposit } from '@/types/db';

interface BankSetting extends Record<string, unknown> {
  banks: DepositBank[];
}

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

const STATUS_META: Record<Deposit['status'], { label: string; tone: string; icon: string }> = {
  pending: { label: 'Chờ duyệt', tone: 'bg-secondary-100 text-secondary-900', icon: 'ri-time-line' },
  approved: { label: 'Đã cộng ví', tone: 'bg-accent-100 text-accent-900', icon: 'ri-check-line' },
  rejected: { label: 'Từ chối', tone: 'bg-primary-100 text-primary-800', icon: 'ri-close-line' },
};

export default function DepositPage() {
  const { profile, session, loading, profileLoading, refreshProfile } = useAuth();
  const { value } = useSiteSetting<BankSetting>(SETTING_KEYS.banks, { banks: [] });
  const banks = (value.banks ?? []).filter((bank) => bank.is_active);

  const [selectedBank, setSelectedBank] = useState('');
  const [amount, setAmount] = useState('100000');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [created, setCreated] = useState<Deposit | null>(null);
  const [history, setHistory] = useState<Deposit[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedBank && banks.length > 0) setSelectedBank(banks[0].id);
  }, [banks, selectedBank]);

  const loadHistory = useCallback(async () => {
    if (!profile?.id) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(15);
      if (error) throw error;
      setHistory((data ?? []) as Deposit[]);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  const bank = banks.find((item) => item.id === selectedBank) ?? banks[0];

  const submit = async () => {
    const value = Number(amount);
    if (!value || value < 10000) {
      setNote({ ok: false, text: 'Số tiền nạp tối thiểu 10.000đ.' });
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      const { data, error } = await supabase.rpc('create_deposit', { p_amount: value });
      if (error) throw error;
      setCreated(data as unknown as Deposit);
      setNote({ ok: true, text: 'Đã tạo lệnh nạp. Hãy chuyển khoản đúng nội dung bên dưới.' });
      await loadHistory();
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      setNote({
        ok: false,
        text: raw.includes('AMOUNT_TOO_SMALL')
          ? 'Số tiền nạp tối thiểu 10.000đ.'
          : 'Không tạo được lệnh nạp. Vui lòng thử lại.',
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="w-full px-4 md:px-8 py-10">
        <div className="h-24 rounded-lg bg-background-100 animate-pulse"></div>
        <div className="mt-4 h-64 rounded-lg bg-background-100 animate-pulse"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full px-4 md:px-8 py-16 text-center">
        <span className="mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-primary-100 text-primary-700">
          <i className="ri-wallet-3-line text-2xl leading-none"></i>
        </span>
        <h1 className="mt-4 font-heading text-xl font-extrabold text-foreground-950">Nạp tiền vào ví</h1>
        <p className="mt-1.5 text-sm text-foreground-600">Đăng nhập để tạo lệnh nạp và nhận tài khoản nhận tiền.</p>
        <Link
          to="/dang-nhap"
          className="mt-5 inline-flex h-10 px-4 items-center rounded-md bg-primary-500 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 py-8 md:py-10">
      <nav className="flex items-center gap-1.5 text-xs text-foreground-500 mb-5">
        <Link to="/" className="hover:text-primary-600 transition-colors cursor-pointer">
          Trang chủ
        </Link>
        <i className="ri-arrow-right-s-line text-sm leading-none"></i>
        <Link to="/tai-khoan" className="hover:text-primary-600 transition-colors cursor-pointer">
          Tài khoản
        </Link>
        <i className="ri-arrow-right-s-line text-sm leading-none"></i>
        <span className="text-foreground-800 font-medium">Nạp tiền</span>
      </nav>

      <div className="rounded-lg bg-primary-950 p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-background-50/10 border border-background-50/20 text-[10px] font-bold uppercase tracking-[0.14em] text-background-100">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500"></span>
              Nạp tiền tự động
            </span>
            <h1 className="mt-3 font-heading text-xl md:text-2xl font-extrabold text-background-50">
              Nạp tiền vào ví YAMATO
            </h1>
            <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-background-300">
              Chuyển khoản đúng tài khoản và nội dung mã nạp bên dưới. Quản trị viên duyệt xong, tiền vào ví ngay.
            </p>
          </div>
          <div className="rounded-md bg-background-50/10 border border-background-50/15 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-background-300">Số dư hiện tại</p>
            <p className="mt-1 font-heading text-lg font-extrabold text-background-50 whitespace-nowrap">
              {formatCurrency(profile?.balance ?? 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <section className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
          <h2 className="font-heading text-base font-extrabold text-foreground-950">1. Chọn số tiền cần nạp</h2>
          <p className="mt-1 text-xs text-foreground-600">Tối thiểu 10.000đ. Nạp càng nhiều, duyệt càng nhanh.</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setAmount(String(item))}
                className={`h-9 px-3 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  Number(amount) === item
                    ? 'bg-primary-500 text-background-50'
                    : 'bg-background-100 text-foreground-700 border border-background-200 hover:border-primary-300'
                }`}
              >
                {formatCurrency(item)}
              </button>
            ))}
          </div>

          <div className="mt-3">
            <label htmlFor="deposit-amount" className="text-[11px] font-semibold text-foreground-700">
              Số tiền khác (đ)
            </label>
            <input
              id="deposit-amount"
              type="number"
              min={10000}
              step={10000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full h-11 px-3 rounded-md border border-background-300 bg-background-50 text-sm font-semibold text-foreground-950 focus:outline-none focus:border-primary-400"
            />
          </div>

          <div className="mt-4 rounded-md border border-background-200 bg-background-100/60 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-foreground-500">Ngân hàng nhận tiền</p>
            {banks.length === 0 ? (
              <p className="mt-2 text-xs text-foreground-600">
                Quản trị viên chưa cài tài khoản nhận tiền. Vui lòng liên hệ quản trị viên qua chat.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {banks.map((item) => {
                  const active = bank?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedBank(item.id)}
                      className={`w-full text-left rounded-md border px-3 py-2.5 transition-colors cursor-pointer ${
                        active
                          ? 'border-primary-400 bg-background-50 ring-2 ring-primary-100'
                          : 'border-background-200 bg-background-50 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-foreground-950">{item.bank_name}</p>
                        {active && (
                          <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded-full bg-primary-100 text-[9px] font-bold text-primary-800 whitespace-nowrap">
                            <i className="ri-check-line text-[10px] leading-none"></i>
                            Đang chọn
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-foreground-700 font-mono">{item.account_number}</p>
                      <p className="text-[11px] text-foreground-500">
                        {item.account_holder}
                        {item.branch ? ` · ${item.branch}` : ''}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={busy || banks.length === 0}
            className="mt-4 h-11 w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary-500 text-background-50 text-sm font-bold hover:bg-primary-600 disabled:opacity-60 whitespace-nowrap cursor-pointer"
          >
            {busy ? (
              <i className="ri-loader-4-line animate-spin text-base leading-none"></i>
            ) : (
              <i className="ri-add-circle-line text-base leading-none"></i>
            )}
            Tạo lệnh nạp tiền
          </button>

          {note && (
            <p
              className={`mt-2.5 rounded-md border px-3 py-2 text-[11px] leading-relaxed ${
                note.ok
                  ? 'border-accent-200 bg-accent-50 text-accent-900'
                  : 'border-primary-200 bg-primary-50 text-primary-800'
              }`}
            >
              {note.text}
            </p>
          )}

          {created && bank && (
            <div className="mt-4 rounded-lg border border-accent-300 bg-accent-50 p-3.5">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 flex items-center justify-center rounded-md bg-accent-500 text-background-50">
                  <i className="ri-bank-card-line text-sm leading-none"></i>
                </span>
                <p className="text-xs font-bold text-accent-900">Chuyển khoản theo thông tin sau</p>
              </div>
              <dl className="mt-3 space-y-1.5">
                {[
                  { label: 'Ngân hàng', value: bank.bank_name },
                  { label: 'Số tài khoản', value: bank.account_number },
                  { label: 'Chủ tài khoản', value: bank.account_holder },
                  { label: 'Số tiền', value: formatCurrency(created.amount) },
                  { label: 'Nội dung', value: created.transfer_code },
                ].map((field) => (
                  <div key={field.label} className="flex items-start justify-between gap-2">
                    <dt className="text-[11px] text-accent-800 whitespace-nowrap">{field.label}</dt>
                    <dd className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[11px] font-bold text-accent-950 font-mono text-right break-all">
                        {field.value}
                      </span>
                      <button
                        type="button"
                        onClick={() => copy(field.label, field.value)}
                        aria-label={`Sao chép ${field.label}`}
                        className="w-6 h-6 shrink-0 flex items-center justify-center rounded border border-accent-300 text-accent-800 hover:bg-background-50 cursor-pointer"
                      >
                        <i
                          className={`${
                            copied === field.label ? 'ri-check-line' : 'ri-file-copy-line'
                          } text-[11px] leading-none`}
                        ></i>
                      </button>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2.5 text-[10px] leading-relaxed text-accent-800">
                Ghi đúng nội dung <span className="font-bold">{created.transfer_code}</span> để hệ thống đối chiếu. Sau khi
                chuyển khoản, quản trị viên sẽ duyệt và cộng tiền vào ví.
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-background-200 bg-background-100 p-4">
            <h3 className="font-heading text-sm font-bold text-foreground-950">Lưu ý khi nạp tiền</h3>
            <ul className="mt-2.5 space-y-2">
              {[
                'Chỉ chuyển vào đúng tài khoản hiển thị trên trang này.',
                'Nội dung chuyển khoản phải đúng mã nạp đã tạo.',
                'Sai nội dung có thể làm chậm việc duyệt tiền.',
                'Cần hỗ trợ? Bấm bong bóng chat góc phải màn hình.',
              ].map((text) => (
                <li key={text} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-foreground-600">
                  <i className="ri-checkbox-circle-line text-primary-600 text-xs leading-none mt-0.5"></i>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-background-200 bg-background-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-heading text-sm font-bold text-foreground-950">Lịch sử nạp tiền</h3>
              <button
                type="button"
                onClick={loadHistory}
                aria-label="Tải lại lịch sử nạp"
                className="w-7 h-7 flex items-center justify-center rounded-md border border-background-300 text-foreground-500 hover:text-primary-600 cursor-pointer"
              >
                <i className="ri-refresh-line text-xs leading-none"></i>
              </button>
            </div>

            {historyLoading ? (
              <div className="mt-3 h-16 rounded-md bg-background-100 animate-pulse"></div>
            ) : history.length === 0 ? (
              <p className="mt-2 text-[11px] text-foreground-500">Bạn chưa có lệnh nạp nào.</p>
            ) : (
              <div className="mt-2.5 space-y-2">
                {history.map((item) => {
                  const meta = STATUS_META[item.status];
                  return (
                    <div key={item.id} className="rounded-md border border-background-200 px-2.5 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-foreground-950">{formatCurrency(item.amount)}</p>
                        <span
                          className={`inline-flex items-center gap-1 h-5 px-1.5 rounded-full text-[9px] font-bold whitespace-nowrap ${meta.tone}`}
                        >
                          <i className={`${meta.icon} text-[10px] leading-none`}></i>
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-foreground-500 font-mono">{item.transfer_code}</p>
                      <p className="text-[10px] text-foreground-400">{formatDateTime(item.created_at)}</p>
                      {item.note && <p className="mt-0.5 text-[10px] text-foreground-500">{item.note}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            to="/tai-khoan"
            className="h-10 w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-background-300 text-xs font-semibold text-foreground-800 hover:bg-background-100 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-arrow-left-line text-sm leading-none"></i>
            Về trang tài khoản
          </Link>
        </aside>
      </div>
    </div>
  );
}