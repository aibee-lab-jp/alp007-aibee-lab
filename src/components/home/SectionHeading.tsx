import { sectionHeading, sectionLabel } from "@/lib/ui";

// セクション見出し：英字ラベル（小・トラッキング広め）＋日本語見出し（主）の2段構成。
// デスクトップでは sectionGrid の左カラムに入り、モバイルでは本文の上に積まれる。
export function SectionHeading({
  label,
  heading,
  children,
}: {
  label: string;
  heading: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-9 lg:mb-0">
      <p className={sectionLabel}>{label}</p>
      <h2 className={sectionHeading}>{heading}</h2>
      {children}
    </div>
  );
}
