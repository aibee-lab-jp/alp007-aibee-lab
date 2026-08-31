// 版面まわりの共通クラス。値は Claude Design キャンバス v2 の実値に対応する。
//
// 版面：モバイルは左右 22px の1カラム、デスクトップは左右 64px・内容幅 1120px。
// max-w-[1248px]（＝1120 + 64×2）と px-16 の組み合わせで、キャンバスと同じ内容幅になる。
export const container = "mx-auto w-full max-w-[1248px] px-[22px] md:px-16";

// セクションの2段組み（デスクトップ）：左に英字ラベル＋見出し、右に本文。
// モバイルでは縦積み（左カラムの中身が見出しとして先に来る）。
export const sectionGrid = "lg:grid lg:grid-cols-[260px_1fr] lg:gap-16";

// セクション見出しの英字ラベル（小・トラッキング広め・差し色）。
export const sectionLabel =
  "text-[11px] font-semibold tracking-[0.2em] text-accent lg:tracking-[0.22em]";

// セクション見出しの日本語（主）。ウェイトと級数で階層を作る（明朝は使わない）。
export const sectionHeading =
  "mt-2 text-[22px] font-bold tracking-[-0.005em] text-ink-900 lg:mt-2.5 lg:text-[28px] lg:tracking-[-0.01em]";

// 本文段落。行間広め。
export const paragraph = "text-[14px] leading-[2.05] text-ink-600 lg:text-[14.5px] lg:leading-[2.1]";

// セクションの上下余白（キャンバス：モバイル 56/64・デスクトップ 96/104）。
export const sectionPadding = "pt-14 pb-16 lg:pt-24 lg:pb-26";
