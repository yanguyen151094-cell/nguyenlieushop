interface Props {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { box: 'w-9 h-9 rounded-[10px]', letter: 'text-[19px]' },
  md: { box: 'w-10 h-10 rounded-[11px]', letter: 'text-[21px]' },
  lg: { box: 'w-14 h-14 rounded-2xl', letter: 'text-[30px]' },
} as const;

export default function BrandMark({ size = 'md' }: Props) {
  const s = SIZES[size];

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-primary-700 ring-1 ring-accent-400/70 ${s.box}`}
    >
      <span
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(150deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0) 46%), radial-gradient(circle at 82% 92%, rgba(255,255,255,0.16), transparent 58%)',
        }}
      />
      <span className="absolute -right-3 -bottom-3 w-8 h-8 rotate-45 bg-accent-400/25" />
      <span className="absolute inset-[3px] rounded-[7px] border border-accent-300/25" />
      <span className={`relative font-heading font-extrabold leading-none text-accent-200 ${s.letter}`}>
        Y
      </span>
    </span>
  );
}