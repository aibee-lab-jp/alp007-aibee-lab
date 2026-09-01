import Link from "next/link";
import { footerNav, site } from "@/lib/site-content";
import { container } from "@/lib/ui";

// 全ページ共通のフッター（キャンバス v2）。淡いグレーの面。
// お問い合わせ／プライバシーポリシー／© AiBee Lab。SNS リンクは置かない（確定）。
// ロゴはデスクトップのみ（キャンバスどおり）。
// ※「運営アプリ とりあえず47」のブロックは暫定的に外している（site-content.ts の注記）。
//    復帰時はリンク列の左側（デスクトップは gap-[72px] の並び）に戻す。
export function SiteFooter() {
  return (
    <footer className="border-t border-line-soft bg-surface">
      <div className={`${container} pt-11 pb-9 md:pt-14 md:pb-11`}>
        <div className="md:flex md:items-start md:justify-between md:gap-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={site.logoSrc}
            alt={site.name}
            className="hidden h-[38px] w-auto md:block"
          />

          <nav
            aria-label="フッター"
            className="mb-8 flex gap-[22px] text-[13px] md:mb-0 md:flex-col md:gap-3"
          >
            {footerNav.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-ink-600 transition-opacity hover:opacity-70"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="md:mt-11 md:border-t md:border-line md:pt-6">
          <small className="text-[11.5px] tracking-[0.04em] text-ink-400">{site.copyright}</small>
        </div>
      </div>
    </footer>
  );
}
