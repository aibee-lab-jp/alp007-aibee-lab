import type { ReactNode } from "react";

// フォームの1項目ラッパ：ラベル＋「必須」＋入力＋エラー。
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
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-2 flex items-baseline gap-2">
        <span className="font-sans text-sm font-medium text-ink-700">{label}</span>
        <span className="font-sans text-xs text-accent-600">必須</span>
      </label>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          className="mt-2 font-sans text-[0.8125rem] leading-[1.6] text-danger-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}
