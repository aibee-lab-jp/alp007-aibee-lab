"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { headerNav, site } from "@/lib/site-content";
import { container } from "@/lib/ui";

// 全ページ共通のヘッダー（ブリーフ §3／キャンバス v2）。
// 淡いブルーグレーの面（#EDF1F7）＋下端の細い罫。ロゴ（単色インク版 SVG・→ トップ）と
// テキストリンクのみの静かなナビ。モバイル（<768px）は2本線のアイコンで畳む。
// 閉じる手段：Esc／リンク選択／再押し／メニュー外タップ。
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  // 現在のページのナビ項目は差し色にする（キャンバス：/contact 表示時の Contact）。
  const isCurrent = (href: string) => href.startsWith("/") && !href.includes("#") && pathname === href;

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-line-header bg-header"
    >
      <div className={`${container} flex items-center justify-between gap-6 py-4 md:py-[22px]`}>
        <Link href="/" className="inline-flex items-center" aria-label="アイビーラボ ホーム">
          {/* ロゴは既存の単色インク版 SVG（ブリーフ §0・§3）。英字 AiBee Lab はロゴに含まれるため併記しない。
              next/image は使わない（SVG は最適化対象外で、素の img の方が単純・確実）。 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={site.logoSrc} alt={site.name} className="block h-11 w-auto md:h-[42px]" />
        </Link>

        {/* デスクトップ（≥768px）：横一列 */}
        <nav aria-label="サイト内" className="hidden items-center gap-10 md:flex">
          {headerNav.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              aria-current={isCurrent(l.href) ? "page" : undefined}
              className={`text-[13px] font-medium tracking-[0.08em] transition-colors hover:opacity-70 ${
                isCurrent(l.href) ? "text-accent" : "text-nav"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* モバイル（<768px）：2本線のアイコン（キャンバスは開閉とも同じ形） */}
        <button
          type="button"
          className="-mr-1.5 inline-flex size-11 flex-col items-end justify-center gap-1.5 text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={open}
          aria-controls="site-nav-mobile"
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true" className="block h-[1.5px] w-[22px] bg-current" />
          <span aria-hidden="true" className="block h-[1.5px] w-[22px] bg-current" />
        </button>
      </div>

      {open && (
        <div id="site-nav-mobile" className="border-b border-line-header bg-header md:hidden">
          <nav aria-label="サイト内（モバイル）" className={`${container} flex flex-col pt-1.5 pb-[22px]`}>
            {headerNav.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isCurrent(l.href) ? "page" : undefined}
                className={`border-b border-line-header py-[15px] text-[14px] font-medium tracking-[0.08em] last:border-b-0 ${
                  isCurrent(l.href) ? "text-accent" : "text-ink-900"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
