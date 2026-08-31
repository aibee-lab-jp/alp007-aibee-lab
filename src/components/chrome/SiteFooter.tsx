import Link from "next/link";
import { footerNav, portal, site } from "@/lib/site-content";
import { container } from "@/lib/ui";

// 全ページ共通のフッター（ブリーフ §3／キャンバス v2）。淡いグレーの面。
// 運営アプリ「とりあえず47」（リンク・小さな添えラベル付き）／お問い合わせ／プライバシーポリシー／© AiBee Lab。
// SNS リンクは置かない（確定）。ロゴはデスクトップのみ（キャンバスどおり）。
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

          <div className="md:flex md:gap-[72px]">
            <div className="mb-7 md:mb-0">
              <span className="mb-1.5 block text-[11px] text-ink-400 md:mb-2">{portal.label}</span>
              <a
                href={portal.href}
                className="border-b border-line-strong pb-0.5 text-[16px] font-semibold tracking-[0.02em] text-ink-900 transition-opacity hover:opacity-70"
              >
                {portal.name}
              </a>
            </div>

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
        </div>

        <div className="md:mt-11 md:border-t md:border-line md:pt-6">
          <small className="text-[11.5px] tracking-[0.04em] text-ink-400">{site.copyright}</small>
        </div>
      </div>
    </footer>
  );
}
