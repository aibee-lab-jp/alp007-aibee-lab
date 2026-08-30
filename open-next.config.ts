import type { OpenNextConfig } from "@opennextjs/aws/types/open-next";

/**
 * OpenNext 設定（@opennextjs/aws 4.0.3・仕様書 §7）。
 *
 * このサイトは ISR も On-demand Revalidation（revalidateTag / revalidatePath）も使わない
 * （フォーム送信以外はすべて SSG）。そのため OpenNext 既定が前提づける「ISR 用インフラ」を2層で外す：
 *
 * (1) 稼働 server function の override（実行時に触らせない）：
 *   - tagCache 既定 "dynamodb" … revalidateTag / revalidatePath 用の DynamoDB。未使用 → "dummy"。
 *   - queue    既定 "sqs"      … ISR 再検証キュー用の SQS。未使用 → "dummy"。
 *
 * (2) dangerous.disableTagCache（出力記述子から外す）：
 *   - (1) の override だけでは open-next.output.json の additionalProps.initializationFunction
 *     （= dynamodb-provider ＝ デプロイ時に DynamoDB を seed する関数）が残る。これは override では
 *     なく dangerous.disableTagCache で決まる。
 *   - true で initializationFunction が undefined になり、記述子からも DynamoDB が完全に外れる。
 *     副作用は revalidateTag / revalidatePath の無効化のみ＝本サイトは未使用で無害。
 *
 * これにより、Terraform 側で ISR 用の DynamoDB（タグキャッシュ本体＋シード関数）を作らずに済む。
 * ※ SQS の revalidation-function は incrementalCache に紐づくため記述子には残るが、queue: "dummy" で
 *   生成側が居らず、Terraform で SQS を作らないため不活性（§7）。
 *
 * incrementalCache は既定 "s3" のまま（あえて設定しない）。理由（§7）：
 *   - 本サイトは SSG 主体。OpenNext は「incremental cache は ISR と SSG に使う。SSR のみの場合だけ
 *     無効化せよ」としており、SSG サイトでのダミー化は非推奨。
 *   - incrementalCache は S3 を使う。静的配信のため S3 バケットはどのみち必要で、
 *     DynamoDB / SQS のような「新規インフラの追加」にはならない＝外す動機がない。
 *   - disableIncrementalCache は設定しない（SSG を壊す）。
 */
const config: OpenNextConfig = {
  default: {
    override: {
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  dangerous: {
    disableTagCache: true,
  },
};

export default config;
