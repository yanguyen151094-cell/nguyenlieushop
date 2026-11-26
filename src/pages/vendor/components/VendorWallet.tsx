import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Profile, VendorBankCard, Withdrawal } from '@/types/db';

interface Props {
  profile: Profile;
  onChanged: () => Promise<void> | void;
}

const STATUS_LABEL: Record<Withdrawal['status'], string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã chuyển',
  rejected: 'Từ chối',
};

export default function VendorWallet({ profile, onChanged }: Props) {
  const [cards, setCards] = useState<VendorBankCard[]>([]);
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bankName, setBankName] = useState('');
  const [bankNumber, setBankNumber] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [savingCard, setSavingCard] = useState(false);
  const [cardNote, setCardNote] = useState<{ ok: boolean; text: string } | null>(null);

  const [selectedCard, setSelectedCard] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [withdrawNote, setWithdrawNote] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cardRes, historyRes] = await Promise.all([
        supabase
          .from('vendor_bank_cards')
          .select('*')
          .eq('vendor_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('withdrawals')
          .select('*')
          .eq('vendor_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);
      if (cardRes.error) throw cardRes.error;
      if (historyRes.error) throw historyRes.error;
      const cardList = (cardRes.data ?? []) as VendorBankCard[];
      setCards(cardList);
      setHistory((historyRes.data ?? []) as Withdrawal[]);
      setSelectedCard((prev) => prev || cardList[0]?.id || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được thông tin ví.');
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const addCard = async () => {
    if (!bankName.trim() || !bankNumber.trim() || !bankHolder.trim()) {
      setCardNote({ ok: false, text: 'Vui lòng nhập đủ tên ngân hàng, số tài khoản và chủ tài khoản.' });
      return;
    }
    setSavingCard(true);
    setCardNote(null);
    try {
      const isFirst = cards.length === 0;
      const { error: insertError } = await supabase.from('vendor_bank_cards').insert({
        vendor_id: profile.id,
        bank_name: bankName.trim(),
        bank_number: bankNumber.trim(),
        bank_holder: bankHolder.trim().toUpperCase(),
        is_default: isFirst,
      });
      if (insertError) throw insertError;
      setBankName('');
      setBankNumber('');
      setBankHolder('');
      setCardNote({ ok: true, text: 'Đã thêm thẻ ngân hàng.' });
      await load();
    } catch (err) {
      setCardNote({ ok: false, text: err instanceof Error ? err.message : 'Không thêm được thẻ.' });
    } finally {
      setSavingCard(false);
    }
  };

  const setDefault = async (cardId: string) => {
    await supabase.from('vendor_bank_cards').update({ is_default: false }).eq('vendor_id', profile.id);
    await supabase.from('vendor_bank_cards').update({ is_default: true }).eq('id', cardId);
    setSelectedCard(cardId);
    load();
  };

  const removeCard = async (cardId: string) => {
    await supabase.from('vendor_bank_cards').delete().eq('id', cardId);
    if (selectedCard === cardId) setSelectedCard('');
    load();
  };

  const submitWithdraw = async () => {
    setWithdrawNote(null);
    const card = cards.find((item) => item.id === selectedCard);
    if (!card) {
      setWithdrawNote({ ok: false, text: 'Vui lòng thêm và chọn thẻ ngân hàng nhận tiền.' });
      return;
    }
    const value = Number(amount);
    if (!value || value < 50000) {
      setWithdrawNote({ ok: false, text: 'Số tiền rút tối thiểu 50.000đ.' });
      return;
    }
    if (value > profile.balance) {
      setWithdrawNote({ ok: false, text: 'Số dư khả dụng không đủ để rút số tiền này.' });
      return;
    }
    setSubmitting(true);
    try {
      const { error: rpcError } = await supabase.rpc('request_withdrawal', {
        p_amount: value,
        p_bank_name: card.bank_name,
        p_bank_number: card.bank_number,
        p_bank_holder: card.bank_holder,
      });
      if (rpcError) throw rpcError;
      setAmount('');
      setWithdrawNote({ ok: true, text: 'Đã gửi lệnh rút tiền, quản trị viên sẽ duyệt sớm.' });
      await load();
      await onChanged();
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      const text = raw.includes('INSUFFICIENT_BALANCE')
        ? 'Số dư không đủ để rút.'
        : raw.includes('AMOUNT_TOO_SMALL')
          ? 'Số tiền rút tối thiểu 50.000đ.'
          : 'Không gửi được lệnh rút tiền. Vui lòng thử lại.';
      setWithdrawNote({ ok: false, text });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-extrabold text-foreground-950">Ví đối tác & rút tiền</h2>
            <p className="mt-1 text-xs text-foreground-600">
              Thêm thẻ ngân hàng của bạn, sau đó tạo lệnh rút về đúng thẻ đã chọn.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-md bg-accent-100 border border-accent-200 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-accent-800">Khả dụng</p>
              <p className="text-sm font-bold text-accent-900 whitespace-nowrap">{formatCurrency(profile.balance)}</p>
            </div>
            <div className="rounded-md bg-secondary-100 border border-secondary-200 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-secondary-800">Đang chờ rút</p>
              <p className="text-sm font-bold text-secondary-900 whitespace-nowrap">
                {formatCurrency(profile.pending_balance)}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-accent-300 bg-accent-50 px-3 py-2.5">
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

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-md border border-background-200 bg-background-100/60 p-3">
            <p className="text-xs font-semibold text-foreground-800">Thẻ ngân hàng nhận tiền</p>
            <p className="mt-0.5 text-[11px] text-foreground-500">Thêm bao nhiêu thẻ cũng được, chọn 1 thẻ mặc định.</p>

            <div className="mt-2.5 space-y-2">
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Tên ngân hàng (VD: Vietcombank)"
                className="w-full h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={bankNumber}
                  onChange={(e) => setBankNumber(e.target.value)}
                  placeholder="Số tài khoản"
                  className="w-full h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
                />
                <input
                  value={bankHolder}
                  onChange={(e) => setBankHolder(e.target.value)}
                  placeholder="Chủ tài khoản"
                  className="w-full h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
                />
              </div>
              <button
                type="button"
                onClick={addCard}
                disabled={savingCard}
                className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-xs font-semibold hover:bg-primary-600 disabled:opacity-60 whitespace-nowrap cursor-pointer"
              >
                {savingCard ? (
                  <i className="ri-loader-4-line animate-spin text-sm leading-none"></i>
                ) : (
                  <i className="ri-add-line text-sm leading-none"></i>
                )}
                Thêm thẻ
              </button>
              {cardNote && (
                <p className={`text-[11px] ${cardNote.ok ? 'text-accent-800' : 'text-primary-700'}`}>{cardNote.text}</p>
              )}
            </div>

            <div className="mt-3 space-y-2">
              {loading ? (
                <div className="h-14 rounded-md bg-background-200/60 animate-pulse"></div>
              ) : cards.length === 0 ? (
                <p className="text-[11px] text-foreground-500">Chưa có thẻ nào. Thêm thẻ để có thể rút tiền.</p>
              ) : (
                cards.map((card) => {
                  const active = selectedCard === card.id;
                  return (
                    <div
                      key={card.id}
                      className={`rounded-md border bg-background-50 px-2.5 py-2 ${
                        active ? 'border-primary-400 ring-2 ring-primary-100' : 'border-background-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button type="button" onClick={() => setSelectedCard(card.id)} className="min-w-0 text-left cursor-pointer">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-foreground-950 truncate">{card.bank_name}</p>
                            {card.is_default && (
                              <span className="h-4 px-1.5 rounded-full bg-accent-100 text-[9px] font-bold text-accent-900 whitespace-nowrap">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-foreground-600">
                            {card.bank_number} · {card.bank_holder}
                          </p>
                        </button>
                        <div className="flex items-center gap-1">
                          {!card.is_default && (
                            <button
                              type="button"
                              onClick={() => setDefault(card.id)}
                              className="h-6 px-1.5 rounded text-[10px] font-semibold text-primary-700 hover:bg-primary-50 whitespace-nowrap cursor-pointer"
                            >
                              Mặc định
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeCard(card.id)}
                            aria-label="Xoá thẻ"
                            className="w-6 h-6 flex items-center justify-center rounded text-foreground-400 hover:text-accent-700 cursor-pointer"
                          >
                            <i className="ri-delete-bin-line text-[11px] leading-none"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-md border border-background-200 bg-background-50 p-3">
            <p className="text-xs font-semibold text-foreground-800">Tạo lệnh rút tiền</p>
            <p className="mt-0.5 text-[11px] text-foreground-500">
              Tối thiểu 50.000đ. Tiền sẽ được trừ khỏi ví và chuyển vào “Đang chờ rút” cho đến khi quản trị duyệt.
            </p>

            <div className="mt-2.5 space-y-2">
              <select
                value={selectedCard}
                onChange={(e) => setSelectedCard(e.target.value)}
                className="w-full h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400 cursor-pointer"
              >
                <option value="">Chọn thẻ nhận tiền</option>
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.bank_name} · {card.bank_number}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Số tiền muốn rút (đ)"
                className="w-full h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
              />
              {Number(amount) > 0 && (
                <p className="text-[11px] text-foreground-500">{formatCurrency(Number(amount))}</p>
              )}
              <button
                type="button"
                onClick={submitWithdraw}
                disabled={submitting}
                className="h-9 px-4 inline-flex items-center gap-1.5 rounded-md bg-accent-500 text-background-50 text-xs font-semibold hover:bg-accent-600 disabled:opacity-60 whitespace-nowrap cursor-pointer"
              >
                {submitting ? (
                  <i className="ri-loader-4-line animate-spin text-sm leading-none"></i>
                ) : (
                  <i className="ri-bank-card-line text-sm leading-none"></i>
                )}
                Gửi lệnh rút
              </button>
              {withdrawNote && (
                <p className={`text-[11px] leading-relaxed ${withdrawNote.ok ? 'text-accent-800' : 'text-primary-700'}`}>
                  {withdrawNote.text}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
        <h3 className="font-heading text-sm font-bold text-foreground-950">Lịch sử rút tiền</h3>
        {loading ? (
          <div className="mt-3 h-16 rounded-md bg-background-100 animate-pulse"></div>
        ) : history.length === 0 ? (
          <p className="mt-2 text-xs text-foreground-500">Chưa có lệnh rút tiền nào.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-background-200 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground-950">{formatCurrency(item.amount)}</p>
                  <p className="mt-0.5 text-[11px] text-foreground-500 truncate">
                    {item.bank_name} · {item.bank_number} · {item.bank_holder}
                  </p>
                  <p className="text-[10px] text-foreground-400">{formatDateTime(item.created_at)}</p>
                </div>
                <span
                  className={`h-6 px-2 inline-flex items-center rounded-full text-[10px] font-semibold whitespace-nowrap ${
                    item.status === 'approved'
                      ? 'bg-accent-100 text-accent-900'
                      : item.status === 'rejected'
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-secondary-100 text-secondary-900'
                  }`}
                >
                  {STATUS_LABEL[item.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}