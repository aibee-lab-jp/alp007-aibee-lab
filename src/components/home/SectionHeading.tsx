import { sectionHeading, sectionLabel } from "@/lib/ui";

// セクション見出し：英字ラベル（小・トラッキング広め）＋日本語見出し（主）の2段構成（ブリーフ §2）。
export function SectionHeading({ label, heading }: { label: string; heading: string }) {
  return (
    <div className="mb-8 sm:mb-10">
      <p className={sectionLabel}>{label}</p>
      <h2 className={sectionHeading}>{heading}</h2>
    </div>
  );
}
