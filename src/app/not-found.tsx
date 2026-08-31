import type { Metadata } from "next";
import Link from "next/link";
import { meta, notFound } from "@/lib/site-content";
import { container, paragraph, sectionGrid } from "@/lib/ui";

// カスタム 404（§2／キャンバス v2）。Next 既定の 404 はデザインから浮くため独自に持つ。
// metadata で title を設定する（既定だと英語タイトルが出る）。robots 指定は不要（HTTP 404 は索引されない）。
// ヘッダー・フッターは共通レイアウトから自動で付く。
export const metadata: Metadata = {
  title: meta.notFound.title,
};

export default function NotFound() {
  return (
    <div className="pt-22 pb-30 lg:pt-42 lg:pb-50">
      <div className={container}>
        <div className={sectionGrid}>
          <p className="mb-3.5 text-[11px] font-semibold tracking-[0.22em] text-accent lg:mb-0">
            404
          </p>

          <div className="lg:max-w-[620px]">
            <h1 className="text-[25px] font-bold leading-[1.55] tracking-[-0.01em] text-ink-900 lg:text-[34px] lg:leading-[1.5] lg:tracking-[-0.02em]">
              {notFound.heading}
            </h1>
            <p className={`mt-5 text-pretty lg:mt-6 ${paragraph}`}>{notFound.body}</p>

            {/* 行き止まりにしない（§2）：戻り先を2つ置く。
                モバイルは罫線で区切った縦並び、デスクトップは上罫の下に横並び（キャンバス v2）。 */}
            <div className="mt-9 flex flex-col border-b border-line lg:mt-11 lg:flex-row lg:gap-10 lg:border-b-0 lg:border-t lg:pt-[26px]">
              {notFound.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="border-t border-line py-4 text-[14.5px] font-medium text-accent transition-opacity hover:opacity-70 lg:border-t-0 lg:py-0"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
