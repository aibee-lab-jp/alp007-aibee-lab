"use client";

import { useEffect } from "react";

// Service Worker（public/sw.js）を登録する。
// SW は Server Action(POST) に x-amz-content-sha256 を付与し、CloudFront OAC 経由の 403 を防ぐ（§5）。
// UI は描画しない。非対応ブラウザでは何もしない（例外を投げない。フォーム側で案内する）。
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    // updateViaCache: "none" … SW スクリプトの更新が HTTP キャッシュで遅延しないようにする（§5）。
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch((err) => {
      // 登録失敗はフォーム側のフォールバック（controller 判定）で送信前に捕捉されるため、ここではログのみ。
      console.error("[sw] 登録に失敗しました:", err);
    });
  }, []);

  return null;
}
