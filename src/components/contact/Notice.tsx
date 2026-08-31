// フォームの通知枠。送信エラー／レート制限拒否／SW 未制御／SW 非対応の**4状態で共通**
// （ブリーフ §8：通知枠は3種共通。文言だけ差し替える）。
// キャンバス v2 の造形：淡い赤地＋細い罫、角丸 2px、アイコンなし。role="status" で動的に読み上げる。
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="rounded-[2px] border border-danger-soft bg-danger-bg px-[18px] py-4"
    >
      <p className="text-[13.5px] leading-[1.95] text-pretty text-danger">{children}</p>
    </div>
  );
}
