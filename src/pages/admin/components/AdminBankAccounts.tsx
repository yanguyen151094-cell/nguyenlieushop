import { useEffect, useState } from 'react';
import { DEFAULT_DEPOSIT_BANKS, SETTING_KEYS, type DepositBank } from '@/lib/siteContent';
import { saveSiteSetting, useSiteSetting } from '@/hooks/useSiteSetting';

interface BankSetting extends Record<string, unknown> {
  banks: DepositBank[];
}

const emptyBank = (): DepositBank => ({
  id: `bank-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  bank_name: '',
  account_number: '',
  account_holder: '',
  branch: '',
  note: '',
  is_active: true,
});

export default function AdminBankAccounts() {
  const { value, loading, refresh } = useSiteSetting<BankSetting>(SETTING_KEYS.banks, {
    banks: DEFAULT_DEPOSIT_BANKS,
  });
  const [banks, setBanks] = useState<DepositBank[]>([]);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setBanks(value.banks ?? DEFAULT_DEPOSIT_BANKS);
  }, [value.banks]);

  const patch = (id: string, field: keyof DepositBank, next: string | boolean) => {
    setBanks((prev) => prev.map((bank) => (bank.id === id ? { ...bank, [field]: next } : bank)));
  };

  const save = async () => {
    const invalid = banks.find(
      (bank) => !bank.bank_name.trim() || !bank.account_number.trim() || !bank.account_holder.trim(),
    );
    if (invalid) {
      setNote({ ok: false, text: 'Mỗi tài khoản cần có tên ngân hàng, số tài khoản và chủ tài khoản.' });
      return;
    }
    setSaving(true);
    setNote(null);
    try {
      await saveSiteSetting(SETTING_KEYS.banks, {
        banks: banks.map((bank) => ({
          ...bank,
          bank_name: bank.bank_name.trim(),
          account_number: bank.account_number.trim(),
          account_holder: bank.account_holder.trim().toUpperCase(),
          branch: bank.branch.trim(),
          note: bank.note.trim(),
        })),
      });
      await refresh();
      setNote({ ok: true, text: 'Đã lưu tài khoản nhận tiền. Trang nạp tiền cập nhật ngay.' });
    } catch {
      setNote({ ok: false, text: 'Không lưu được. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-extrabold text-foreground-950">Tài khoản nhận tiền nạp</h2>
          <p className="mt-1 text-xs text-foreground-600">
            Đây là các tài khoản hiển thị cho người dùng khi nạp tiền. Anh có thể thêm, sửa hoặc thay thế bất cứ lúc nào.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBanks((prev) => [...prev, emptyBank()])}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-background-300 text-xs font-semibold text-foreground-800 hover:bg-background-100 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line text-sm leading-none"></i>
            Thêm tài khoản
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-xs font-semibold hover:bg-primary-600 disabled:opacity-60 whitespace-nowrap cursor-pointer"
          >
            {saving ? (
              <i className="ri-loader-4-line animate-spin text-sm leading-none"></i>
            ) : (
              <i className="ri-save-3-line text-sm leading-none"></i>
            )}
            Lưu thay đổi
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-3 h-24 rounded-md bg-background-100 animate-pulse"></div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="rounded-md border border-accent-200 bg-accent-50 px-3 py-2 text-[11px] leading-relaxed text-accent-900">
            Lưu ý: nếu đây là lần đầu, hãy thay số tài khoản mẫu bằng tài khoản ngân hàng thật của anh rồi bấm “Lưu thay
            đổi”. Người dùng chỉ thấy các tài khoản đang bật “Hiển thị”.
          </p>
          {banks.map((bank) => (
            <div key={bank.id} className="rounded-md border border-background-200 bg-background-100/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-foreground-950">{bank.bank_name || 'Tài khoản mới'}</p>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 text-[11px] text-foreground-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bank.is_active}
                      onChange={(e) => patch(bank.id, 'is_active', e.target.checked)}
                      className="w-3.5 h-3.5 accent-[oklch(var(--primary-500))]"
                    />
                    Hiển thị
                  </label>
                  <button
                    type="button"
                    onClick={() => setBanks((prev) => prev.filter((item) => item.id !== bank.id))}
                    aria-label="Xoá tài khoản"
                    className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-primary-700 cursor-pointer"
                  >
                    <i className="ri-delete-bin-line text-sm leading-none"></i>
                  </button>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={bank.bank_name}
                  onChange={(e) => patch(bank.id, 'bank_name', e.target.value)}
                  placeholder="Tên ngân hàng (VD: Vietcombank)"
                  className="h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
                />
                <input
                  value={bank.account_number}
                  onChange={(e) => patch(bank.id, 'account_number', e.target.value)}
                  placeholder="Số tài khoản"
                  className="h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
                />
                <input
                  value={bank.account_holder}
                  onChange={(e) => patch(bank.id, 'account_holder', e.target.value)}
                  placeholder="Chủ tài khoản"
                  className="h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
                />
                <input
                  value={bank.branch}
                  onChange={(e) => patch(bank.id, 'branch', e.target.value)}
                  placeholder="Chi nhánh (không bắt buộc)"
                  className="h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
                />
              </div>
              <input
                value={bank.note}
                onChange={(e) => patch(bank.id, 'note', e.target.value)}
                placeholder="Ghi chú hiển thị cho người nạp (không bắt buộc)"
                className="mt-2 w-full h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
              />
            </div>
          ))}
          {banks.length === 0 && (
            <p className="text-[11px] text-foreground-500">Chưa có tài khoản nào. Bấm “Thêm tài khoản” để tạo.</p>
          )}
        </div>
      )}

      {note && (
        <p
          className={`mt-3 rounded-md border px-3 py-2 text-[11px] ${
            note.ok ? 'border-accent-200 bg-accent-50 text-accent-900' : 'border-primary-200 bg-primary-50 text-primary-800'
          }`}
        >
          {note.text}
        </p>
      )}
    </section>
  );
}