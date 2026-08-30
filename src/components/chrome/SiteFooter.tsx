import Link from "next/link";
import { footerNav, portal, site } from "@/lib/site-content";
import { container } from "@/lib/ui";

// 全ページ共通のフッター（ブリーフ §3）。
// 運営アプリ「とりあえず47」（リンク・小さな添えラベル付き）／お問い合わせ／プライバシーポリシー／© AiBee Lab。
// SNS リンクは置かない（確定）。
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-base-100">
      <div className={`${container} flex flex-col gap-8 py-12 sm:flex-row sm:justify-between`}>
        <div className="flex flex-col gap-1.5">
          <span className="font-sans text-xs tracking-[0.14em] text-ink-400">{portal.label}</span>
          <a
            href={portal.href}
            className="font-serif text-lg text-ink-900 underline decoration-line-strong decoration-1 underline-offset-4 transition-colors hover:text-accent-600 hover:decoration-accent-600"
          >
            {portal.name}
          </a>
        </div>

        <div className="flex flex-col items-start gap-4 sm:items-end">
          <nav aria-label="フッター" className="flex flex-wrap gap-x-6 gap-y-2">
            {footerNav.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-sans text-sm text-ink-500 transition-colors hover:text-accent-600"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <small className="font-sans text-xs tracking-[0.06em] text-ink-400">
            {site.copyright}
          </small>
        </div>
      </div>
    </footer>
  );
}
