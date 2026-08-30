"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { headerNav, site } from "@/lib/site-content";
import { container } from "@/lib/ui";

// 全ページ共通のヘッダー（ブリーフ §3）。
// ロゴ（単色インク版 SVG・→ トップ）＋テキストリンクのみの静かなナビ。
// モバイル（<768px）はハンバーガーに畳む。閉じる手段：Esc／リンク選択／再押し／メニュー外タップ。
export function SiteHeader() {
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

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-line bg-base-200/90 backdrop-blur-sm"
    >
      <div className={`${container} flex items-center justify-between gap-6 py-4`}>
        <Link href="/" className="inline-flex items-center" aria-label="アイビーラボ ホーム">
          {/* ロゴは既存の単色インク版 SVG（ブリーフ §0・§3）。英字 AiBee Lab はロゴに含まれるため併記しない。
              next/image は使わない（SVG は最適化対象外で、素の img の方が単純・確実）。 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={site.logoSrc} alt={site.name} className="h-7 w-auto sm:h-8" />
        </Link>

        {/* デスクトップ（≥768px）：横一列 */}
        <nav aria-label="サイト内" className="hidden items-center gap-8 md:flex">
          {headerNav.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="font-sans text-sm font-medium tracking-[0.04em] text-ink-500 transition-colors hover:text-accent-600"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* モバイル（<768px）：ハンバーガー */}
        <button
          type="button"
          className="-mr-2 inline-flex size-10 items-center justify-center rounded-md text-ink-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 md:hidden"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={open}
          aria-controls="site-nav-mobile"
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <>
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div id="site-nav-mobile" className="border-t border-line bg-base-200 md:hidden">
          <nav aria-label="サイト内（モバイル）" className={`${container} flex flex-col py-1`}>
            {headerNav.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-3.5 font-sans text-[0.9375rem] font-medium tracking-[0.04em] text-ink-700 last:border-b-0"
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
