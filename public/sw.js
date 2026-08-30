// Service Worker：Server Action(POST) に x-amz-content-sha256 を付与する。
//
// なぜ必要か（docs/SITE_ARCHITECTURE.md §5）：
//   配信は CloudFront → Lambda Function URL（OAC・AWS_IAM）。CloudFront OAC は POST/PUT の body に
//   署名しないため、クライアントが body の SHA-256 を計算して x-amz-content-sha256 ヘッダーに
//   付ける必要がある（AWS 公式仕様。Lambda は署名なしペイロード不可）。無対策だと送信が 403 になる。
//
// 役割はこれだけ。キャッシュ／オフライン／プッシュ通知は扱わない。

self.addEventListener("install", () => {
  // 新しい SW を待機フェーズを飛ばして即有効化。
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // 既に開いているタブ（クライアント）を即座に制御下へ置く。
  event.waitUntil(self.clients.claim());
});

// ArrayBuffer → 16進小文字の SHA-256 文字列。
async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// body の SHA-256 を x-amz-content-sha256 に付けて送り直す。
// body を ArrayBuffer で一度だけ読む（空 body でも空 ArrayBuffer → 空文字列の SHA-256 になり正しく動く）。
async function forwardWithPayloadHash(request) {
  const body = await request.arrayBuffer();
  const headers = new Headers(request.headers);
  headers.set("x-amz-content-sha256", await sha256Hex(body));

  return fetch(
    new Request(request.url, {
      method: request.method,
      headers,
      body,
      credentials: request.credentials, // Cookie 等を維持（同一オリジン）。
      redirect: request.redirect,
    }),
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // POST のみ対象。
  if (request.method !== "POST") return;

  // 同一オリジンのみ（外部への POST には触れない）。
  let sameOrigin = false;
  try {
    sameOrigin = new URL(request.url).origin === self.location.origin;
  } catch {
    sameOrigin = false;
  }
  if (!sameOrigin) return;

  // Server Action の POST だけに絞る。Next.js は Server Action 呼び出しに next-action ヘッダーを付ける
  // （next dist の ACTION_HEADER='next-action' で確認）。これで解析ビーコン等の無関係な POST を巻き込まない。
  if (!request.headers.has("next-action")) return;

  event.respondWith(forwardWithPayloadHash(request));
});
