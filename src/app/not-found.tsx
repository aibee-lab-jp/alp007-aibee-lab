import type { Metadata } from "next";
import Link from "next/link";
import { meta, notFound } from "@/lib/site-content";
import { container, paragraph, sectionHeading } from "@/lib/ui";

// カスタム 404（§2）。Next 既定の 404 はデザインから浮くため独自に持つ。
// metadata で title を設定する（既定だと英語タイトルが出る）。robots 指定は不要（HTTP 404 は索引されない）。
// ヘッダー・フッターは共通レイアウトから自動で付く。
export const metadata: Metadata = {
  title: meta.notFound.title,
};

export default function NotFound() {
  return (
    <div className="py-24 sm:py-32">
      <div className={container}>
        <p className="font-sans text-sm font-medium tracking-[0.14em] text-accent-600">404</p>
        <h1 className={sectionHeading}>{notFound.heading}</h1>
        <p className={`mt-6 max-w-[42ch] ${paragraph}`}>{notFound.body}</p>

        {/* 行き止まりにしない（§2）：戻り先を2つ置く。 */}
        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          {notFound.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex items-center gap-1.5 font-sans text-[0.9375rem] font-medium text-accent-600 underline decoration-accent-100 decoration-1 underline-offset-4 transition-colors hover:text-accent-700 hover:decoration-accent-600"
            >
              {l.label}
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
