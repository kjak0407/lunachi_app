# GitHub Desktopで外から開けるようにする

## 公開範囲について

GitHub Pagesの通常のサイトには「URLを知っている人だけ」という閲覧制限がありません。URLを共有した人に気軽に遊んでもらう用途には使えますが、URLが伝わると他の人も開けます。

アプリと音声素材のページには検索エンジン向けの `noindex` を設定済みです。対応する検索エンジンに検索結果への掲載をしないよう指示します。アクセス制限ではなく、GitHub上で公開したコードも非公開にはなりません。外部サイトで宣伝せず、URLを家族にだけ伝える運用が簡単です。

普通の個人アカウントのGitHub Freeでは、GitHub Pagesを使うリポジトリはPublicにする必要があります。GitHub ProなどではPrivateのリポジトリでもPagesを使えますが、サイトの閲覧制限は別です。閲覧を制限するGitHub Pagesの機能は、GitHub Enterprise Cloudの組織向けです。

閲覧者を確実に家族に限定するなら、GitHubにはPrivateでコードを保存し、Cloudflare Pagesなどでサイトを配信してCloudflare Accessのメール認証で守る構成を選んでください。この場合は家族のメールアドレスを許可し、初回に届くコードでログインしてもらいます。公開前に、本番URL・プレビューURLの両方が未認証では開けないことを確認してください。「プレビューだけ保護」は本番サイトを保護しません。

## 方法A：GitHub Pagesで、URLを家族に共有する

### 1. このフォルダーをGitHub Desktopに追加

1. GitHub Desktopを開き、GitHubアカウントにログインします。
2. **File → Add local repository** を選びます。
3. **Choose…** で `C:\Users\shu_0\Desktop\SelfApps\lunachi_app` を選びます。
4. このフォルダーにはまだGitの保存履歴がありません。「Git repositoryではありません」の案内が出たら **create a repository here** を選び、同じフォルダー内に作成してください。別の入れ子フォルダーを作らないでください。
5. 名前は `lunachi_app`。`.gitignore`とREADMEは用意済みなので、追加のテンプレートを選ぶ必要はありません。
6. **Changes** にファイルが残っていたら、**Summary** に `最初のあそびば` と入力し、**Commit to main**（ブランチ名は設定により異なります）を押します。

`.tools`は素材の加工用フォルダーで、GitHubに送らない設定済みです。アプリ本体と動物の画像・音声は `dist` に入っています。

### 2. GitHubに保存する

1. 上部の **Publish repository** を押します。
2. 名前を確認します。
3. **GitHub Freeで方法Aを使う場合**は **Keep this code private** のチェックを外します。コードと画像・音声が公開されます。
4. **Publish repository** を押します。
5. **Repository → View on GitHub** でブラウザにリポジトリを表示します。

Privateのコード保存を希望する場合はチェックを付けたままにし、下の方法Bを使ってください。GitHub Pro等でPrivateからPagesを使う場合でも、閲覧者限定にはなりません。

### 3. GitHub Pagesを有効にする

**「Upgrade or make this repository public to enable Pages」と表示され、Sourceがない場合**：リポジトリがPrivateで、現在のプランではPagesを使えない状態です。有料プランへの変更は必須ではありません。コード・画像・音声・コミット履歴が誰でも見られる状態にしてよければ、**Settings → General → ページ下部のDanger Zone → Change repository visibility → Change visibility → Make public** で、画面の確認に従ってPublicに変更します。その後 **Settings → Pages** を開き直すと、Sourceを設定できます。公開範囲を広げる操作なので、非公開を保ちたい場合は変更せず方法Bを選んでください。

1. ブラウザのリポジトリ画面で **Settings → Pages** を開きます。
2. **Build and deployment → Source** を **GitHub Actions** にします。
3. ページ上部まで戻り、**Code / Issues / Pull requests / Actions / Settings** と並んでいる、**上部のActionsタブ**をクリックします。Settingsの左側にある **Actions → General** は権限設定で、別の画面です。上部のActionsタブを開いたら、左側の **Publish playroom to GitHub Pages** を選びます。
4. **Run workflow** を押し、通常のメインブランチを選んで実行します。
5. 緑色のチェックが付いたら **Settings → Pages** に戻ります。
6. 表示された **Visit site** を開きます。そのURLを家族に共有してください。

公開先は一般に `https://アカウント名.github.io/リポジトリ名/` です。正確なURLは **Visit site** に表示されたものを使います。

上部のActionsタブでもワークフロー名が見つからない場合は、GitHubの **Code** タブで `.github/workflows/pages.yml` があるか確認してください。PCにはこのファイルを用意しています。まだGitHubに送られていない場合は、GitHub Desktopで変更をCommitし、**Push origin** を押します。**Run workflow** の手動実行には、このファイルがリポジトリのデフォルトブランチに存在する必要があります。

公開用の設定は `.github/workflows/pages.yml` に用意済みです。アップロードするのは `dist` の中だけです。PCのプレビューサーバーや加工用の素材はサイトには含めません。

### 4. 更新する

iPhoneのホーム画面用アイコンは、添付の子犬の画像をそのまま使った `dist/apple-touch-icon.png` です。更新をPushして公開サイトに反映した後、iPhoneのSafariでサイトを開き、共有メニューの **ホーム画面に追加** を選びます。古いアイコンで登録済みの場合はホーム画面のショートカットを削除して、追加し直してください。

アプリを変更したら、GitHub Desktopで **Changes → Summaryを入力 → Commit → Push origin** を押します。メインブランチにある `dist` の変更は自動でサイトに反映されます。失敗した場合は **Actions** に理由が表示されます。

## 方法B：コードもPrivate、サイトは家族のログイン限定

1. 上の手順2で **Keep this code private** を付け、GitHubにPrivateで保存します。
2. Cloudflare PagesのGit連携でそのリポジトリを選びます。ビルドのプリセットは **None**、ビルドコマンドは空欄、出力フォルダーは **dist**、ルートフォルダーはプロジェクトのルートです。
3. Cloudflare Accessで家族のメールアドレスだけを許可する設定を作り、メールのワンタイムコードをログイン方法にします。
4. **本番の配信URLも保護対象に追加**します。プレビュー保護だけでは本番は公開されたままです。別の公開URLや独自ドメインを追加した場合も保護対象にします。
5. 自分のログインしていないブラウザで本番URLを開き、ログイン画面が出ることを確認してから家族に共有します。

URLだけでログインなしに開く方法Aと、家族のメール認証が必要な方法Bは、使い勝手と公開範囲が異なります。

## 公式の説明

- [GitHub Desktopで既存のプロジェクトを追加する](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop?platform=windows)
- [GitHub Pagesについて](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)
- [GitHub Pagesの公開範囲](https://docs.github.com/en/enterprise-cloud%40latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site)
- [GitHub Pagesの公開用ワークフロー](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Cloudflare Pagesのプレビューとアクセス保護](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
- [検索結果への掲載を止めるnoindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
