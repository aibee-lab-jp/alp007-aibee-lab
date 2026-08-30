// サイトの確定文言を1箇所に集約する（§4）。
//
// **文言の正は docs/SITE_DESIGN_BRIEF.md §4〜§6**。実装の都合で書き換えない（CLAUDE.md）。
// 変更が必要になったらブリーフを直し、ここへ反映する。
// URL はここに書かず env（NEXT_PUBLIC_*）から組み立てる（§2：コードに URL をハードコードしない）。

import { env } from "@/lib/env";

// ---- 識別子・グローバル要素（ブリーフ §1・§3） ----------------------------
export const site = {
  name: "アイビーラボ",
  nameEn: "AiBee Lab",
  // フッターの著作権表記（確定・年なし。英字表記はロゴ準拠）。
  copyright: "© AiBee Lab",
  // ヘッダーのロゴ（単色インク版 SVG。原版の濃色パネル版は favicon / OG のマスター）。
  logoSrc: "/aibee-lab-logo-ink.svg",
  // 共通 OG 画像（1200×630・全ページ共用。ブリーフ §7）。
  // **未作成のプレースホルダ参照**：public/og.png を置けばコード変更なしで有効になる。
  ogImage: "/og.png",
} as const;

// ヘッダーのナビ（確定・英語表記）。
export const headerNav = [
  { label: "Services", href: "/#services" },
  { label: "Works", href: "/#works" },
  { label: "About Us", href: "/#about" },
  { label: "Contact", href: "/contact" },
] as const;

// フッターのリンク（日本語ラベル・確定）。運営アプリは別枠（下記 portal）。
export const footerNav = [
  { label: "お問い合わせ", href: "/contact" },
  { label: "プライバシーポリシー", href: "/privacy" },
] as const;

// 運営アプリ「とりあえず47」への導線。URL は env から。
export const portal = {
  name: "とりあえず47",
  label: "運営アプリ",
  href: env.portalUrl,
  contactHref: `${env.portalUrl}/contact`,
} as const;

// ---- トップ `/`（ブリーフ §4.1） ------------------------------------------
export const home = {
  hero: {
    kicker: "「とりあえず47」運営元",
    title: "クラウドとAIのエンジニアリングラボ",
    lead: "アイビーラボは、企業のクラウド導入・インフラ構築（AWS / Google Cloud / Azure）と、AIの開発・業務導入を支援しています。大手企業の基盤づくりと同じ技術、同じ品質基準で、自社アプリ「とりあえず47」を開発・運営しています。",
  },
  services: {
    id: "services",
    label: "Services",
    heading: "事業内容",
    items: [
      {
        title: "クラウド導入支援・インフラ構築",
        body: "AWS / Google Cloud / Azure によるクラウド基盤の設計・構築・運用を支援しています。金融・製造・小売など、大手企業の本番基盤づくりに携わってきました。導入の検討段階から、構築後の運用・技術教育まで一貫して支援します。",
      },
      {
        title: "AIの開発・業務導入支援",
        body: "生成AI（RAG）基盤の構築、AIを組み込んだシステム開発、活用のための教育・伴走支援を行っています。私たち自身も、インフラ構築や開発の現場でAIを日常的に使いながら、実務に根ざした導入を支援しています。",
      },
      {
        title: "自社アプリの企画・開発・運営",
        body: "都道府県をネタにしたゲーム・アプリのポータル「とりあえず47」を企画・開発・運営しています。本業のクラウド・AI支援と同じ技術、同じ品質基準でつくっています。",
        // 3項目めだけ「とりあえず47 →」へのリンクを持つ（ブリーフ §4.1）。
        link: { label: "とりあえず47", href: portal.href },
      },
    ],
  },
  works: {
    id: "works",
    label: "Works",
    heading: "実績",
    lead: "これまでに携わってきた主な仕事です。守秘の観点から、社名ではなく業界名でご紹介しています。",
    items: [
      {
        title: "大手自動車メーカー",
        body: "Google Cloud 上の大規模データ活用基盤の構築に参画。車両データと生成AIを組み合わせたデータ活用を支える基盤です。",
      },
      {
        title: "クレジットカード会社",
        body: "社内での生成AI活用に向けた RAG 環境を、AWS・Azure 上に構築しました。",
      },
      {
        title: "大手飲料メーカー",
        body: "AWS 上に生成AIの利用環境を構築しました。",
      },
      {
        title: "小売（ネットスーパー）",
        body: "AWS の導入とサーバーレス化を支援しました。",
      },
      {
        title: "開発会社への技術支援",
        body: "エンジニアチームへの AWS 設計の技術支援と、AWS 認定資格の取得に向けた教育を行っています。",
      },
    ],
  },
  history: {
    id: "history",
    label: "History",
    heading: "沿革",
    // ※ 2026 は「開始」のまま実装する（アプリ公開後に差し替える運用注記は画面に出さない。ブリーフ §8）。
    items: [
      { year: "2021", body: "創業。企業のクラウド導入支援・インフラ構築（AWS）を開始" },
      { year: "2024", body: "生成AI基盤（RAG）の構築支援へ領域を拡大（AWS・Azure）" },
      {
        year: "2025",
        body: "Google Cloud による大規模データ活用基盤の構築に参画。AI活用の開発支援・教育へ拡大",
      },
      { year: "2026", body: "自社アプリ事業「とりあえず47」を開始" },
    ],
  },
  about: {
    id: "about",
    label: "About Us",
    heading: "アイビーラボ",
    // 代表名・電話番号・メールアドレスは記載しない（確定）。地図の埋め込みもしない。
    items: [
      { key: "屋号", value: "アイビーラボ（英語表記：AiBee Lab）" },
      {
        key: "所在地",
        value: "〒221-0052 神奈川県横浜市神奈川区栄町5-1 横浜クリエーションスクエア14階",
      },
      { key: "創業", value: "2021年" },
      {
        key: "事業内容",
        value:
          "クラウド導入支援・インフラ構築、AIの開発・業務導入支援、自社アプリの企画・開発・運営",
      },
    ],
    cta: { label: "お問い合わせ", href: "/contact" },
  },
} as const;

// ---- `/contact`（ブリーフ §4.2） ------------------------------------------
export const contact = {
  label: "Contact",
  heading: "お問い合わせ",
  // リードは [とりあえず47のお問い合わせ] がリンク（リンク先は PORTAL_URL + /contact）。
  lead: {
    before: "アイビーラボへのご連絡は、こちらのフォームからお願いします。アプリ「とりあえず47」の不具合やご要望は、",
    linkLabel: "とりあえず47のお問い合わせ",
    after: "からお送りいただくと確実です。",
  },
  fields: {
    lastName: { label: "姓", placeholder: "山田" },
    firstName: { label: "名", placeholder: "太郎" },
    email: { label: "メールアドレス", placeholder: "mail@example.com" },
    subject: { label: "件名", placeholder: "（例）掲載内容について" },
    body: { label: "本文", placeholder: "お問い合わせ内容をご記入ください" },
  },
  // 必須エラーは「{ラベル}を入力してください」の同型（ブリーフ §4.2）。
  requiredError: (label: string) => `${label}を入力してください`,
  emailFormatError: "メールアドレスの形式が正しくありません",
  submit: "送信する",
  submitting: "送信しています…",
  thanks: {
    heading: "お問い合わせを受け付けました",
    body: "ご入力いただいたメールアドレス宛に、受付確認のメールをお送りしました。内容を確認のうえ、必要に応じてご連絡いたします。確認メールが届かない場合は、迷惑メールフォルダをご確認ください。",
  },
  // 通知枠は3種で共通のコンポーネントに文言を差し替えて表示する（ブリーフ §8）。
  notices: {
    submitFailed: "送信に失敗しました。お手数ですが、時間をおいて再度お試しください。",
    rateLimited: "送信が集中しています。しばらく時間をおいてからお試しください。",
    swUncontrolled: "送信の準備が整っていません。ページを再読み込みしてから、もう一度お試しください。",
  },
  // SW 非対応：フォームを描画せずこの案内のみ（再読み込みは促さない。§5）。
  swUnsupported: "お使いのブラウザではフォームをご利用いただけません。お手数ですが、最新のブラウザからアクセスしてください。",
  privacyNote: {
    before: "送信いただいた内容の取り扱いについては、",
    linkLabel: "プライバシーポリシー",
    after: "をご覧ください。",
  },
} as const;

// ---- `/privacy`（ブリーフ §4.3・全文） -------------------------------------
export const privacy = {
  label: "Privacy Policy",
  heading: "プライバシーポリシー",
  // 制定日はリリース時に実日付を記入する（ブリーフ §4.3 の指定どおり、現時点は伏字）。
  establishedAt: "●●",
  sections: [
    {
      id: "scope",
      heading: "適用範囲",
      body: "本ポリシーは、アイビーラボ（以下「当ラボ」）が運営する本サイト（www.aibee-lab.jp）に適用されます。当ラボが運営するアプリ、および「とりあえず47」のサイトにおける情報の取り扱いについては、それぞれのサイト・アプリのプライバシーポリシーに定めます。",
    },
    {
      id: "contact-data",
      heading: "お問い合わせで取得する情報と利用目的",
      body: "お問い合わせフォームでは、氏名・メールアドレス・お問い合わせ内容をお預かりします。これらは、内容の確認とご返信、および受付確認メールの送信のために利用し、それ以外の目的には利用しません。お預かりした内容は、当ラボが管理するデータベースに保存します。",
    },
    {
      id: "spam",
      heading: "スパム対策のための情報の一時保存",
      body: "連続した送信を防ぐため、フォームの送信時に IP アドレスを復元できない形式（ハッシュ化）で一時的に保存します。この情報は送信回数の確認のみに使用し、一定時間の経過後に自動で削除されます。",
    },
    {
      id: "cookie",
      heading: "Cookie について",
      body: "当サイトは Cookie を使用していません。アクセス解析ツールも使用していません。",
    },
    {
      id: "hosting",
      heading: "ホスティングについて",
      body: "当サイトは AWS（アマゾン ウェブ サービス）上で運用しており、お預かりした情報も AWS 上で保管します。",
    },
    {
      id: "revision",
      heading: "本ポリシーの改定",
      body: "本ポリシーの内容は、必要に応じて改定することがあります。改定した場合は、本ページでお知らせします。",
    },
  ],
  // 7. お問い合わせ先だけ本文中にリンクを含むため別扱い。
  contactSection: {
    id: "inquiry",
    heading: "お問い合わせ先",
    before: "本ポリシーに関するお問い合わせは、",
    linkLabel: "お問い合わせフォーム",
    after: "からお願いします。",
  },
} as const;

// ---- 404（ブリーフ §4.4） --------------------------------------------------
export const notFound = {
  heading: "ページが見つかりません",
  body: "お探しのページは、移動または削除された可能性があります。URL をご確認いただくか、以下からお進みください。",
  links: [
    { label: "トップページへ", href: "/" },
    { label: "お問い合わせ", href: "/contact" },
  ],
} as const;

// ---- メタ（ブリーフ §6） ---------------------------------------------------
export const meta = {
  home: {
    title: "アイビーラボ｜クラウドとAIのエンジニアリングラボ",
    description:
      "「とりあえず47」の運営元、アイビーラボの紹介です。企業のクラウド導入・インフラ構築（AWS / Google Cloud / Azure）と、AIの開発・業務導入支援を行うエンジニアリングラボです。",
  },
  contact: {
    title: "お問い合わせ｜アイビーラボ",
    description:
      "アイビーラボへのお問い合わせフォームです。内容を確認のうえ、必要に応じてご連絡いたします。",
  },
  privacy: {
    title: "プライバシーポリシー｜アイビーラボ",
    description: "本サイト（www.aibee-lab.jp）における個人情報の取り扱いについてご案内します。",
  },
  notFound: {
    title: "ページが見つかりません｜アイビーラボ",
  },
} as const;
