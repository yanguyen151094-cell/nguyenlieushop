import type { WarrantyOption } from '@/types/db';

interface Props {
  value: WarrantyOption[];
  onChange: (next: WarrantyOption[]) => void;
}

const DEFAULT_OPTION: WarrantyOption = { label: 'Bảo hành 7 ngày', days: 7, extra_price: 0 };

export default function WarrantyOptionsEditor({ value, onChange }: Props) {
  const update = (index: number, patch: Partial<WarrantyOption>) => {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const remove = (index: number) => {
    if (value.length <= 1) return;
    onChange(value.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...value, { ...DEFAULT_OPTION, label: `Bảo hành ${value.length * 7} ngày` }]);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-foreground-700">Gói bảo hành & giá cộng thêm</span>
        <button
          type="button"
          onClick={add}
          className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 text-[11px] font-semibold text-primary-700 hover:bg-primary-100 whitespace-nowrap cursor-pointer"
        >
          <i className="ri-add-line text-xs leading-none"></i>
          Thêm gói
        </button>
      </div>

      <div className="space-y-2">
        {value.map((opt, index) => (
          <div key={`warranty-${index}`} className="grid grid-cols-1 sm:grid-cols-[1.4fr_0.7fr_1fr_auto] gap-2 items-center">
            <input
              value={opt.label}
              onChange={(e) => update(index, { label: e.target.value })}
              placeholder="Tên gói bảo hành"
              className="w-full h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
            />
            <div className="relative">
              <input
                type="number"
                min={0}
                value={opt.days}
                onChange={(e) => update(index, { days: Number(e.target.value) || 0 })}
                className="w-full h-9 pl-2.5 pr-8 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-foreground-400">ngày</span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={opt.extra_price}
                onChange={(e) => update(index, { extra_price: Number(e.target.value) || 0 })}
                className="w-full h-9 pl-2.5 pr-6 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-foreground-400">đ</span>
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={value.length <= 1}
              aria-label="Xoá gói bảo hành"
              className="w-9 h-9 flex items-center justify-center rounded-md border border-background-200 text-foreground-500 hover:text-accent-700 hover:border-accent-300 disabled:opacity-40 cursor-pointer"
            >
              <i className="ri-delete-bin-line text-sm leading-none"></i>
            </button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-foreground-500">
        Giá bán = giá gốc cộng giá trị gói bảo hành. Nhập 0 nếu gói không phụ phí.
      </p>
    </div>
  );
}