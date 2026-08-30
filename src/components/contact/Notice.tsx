// フォームの通知枠。送信エラー／レート制限拒否／SW 未制御／SW 非対応の**4状態で共通**
// （ブリーフ §8：通知枠は3種共通。文言だけ差し替える）。
// 色だけに依存しないよう、先頭にアラートアイコンを置く。role="alert" で動的に読み上げる。
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-md border border-danger-600/30 bg-danger-600/8 px-4 py-3.5 font-sans text-[0.9375rem] leading-[1.75] text-danger-600"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="mt-[5px] flex-none"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{children}</span>
    </div>
  );
}
