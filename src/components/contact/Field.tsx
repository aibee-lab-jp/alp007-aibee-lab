import type { ReactNode } from "react";

// フォームの1項目ラッパ：ラベル＋「必須」バッジ＋入力＋エラー（キャンバス v2 の造形）。
// id は入力要素の id と一致させる（label の htmlFor、エラーの id=`${id}-error`）。
export function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[9px]">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.02em] text-ink-900"
      >
        {label}
        <span className="rounded-[2px] border border-field px-[5px] py-px text-[10px] font-medium tracking-[0.06em] text-badge">
          必須
        </span>
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-[12.5px] leading-[1.7] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
