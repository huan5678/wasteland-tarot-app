# Passkeys 使用者指南

## 什麼是 Passkey？

Passkey 是一種新型的無密碼登入技術，使用你裝置上的生物辨識功能（如 Touch ID、Face ID、Windows Hello）或裝置 PIN 碼來驗證身份。

### 為什麼使用 Passkey？

✅ **更安全**
- 無法被釣魚攻擊
- 不會被資料洩漏影響
- 基於公開金鑰加密技術

✅ **更方便**
- 無需記憶密碼
- 使用生物辨識快速登入
- 跨裝置同步（視平台而定）

✅ **更快速**
- 一鍵登入
- 減少登入步驟
- 提升使用體驗

---

## 支援的裝置和瀏覽器

### ✅ 完全支援

**桌面裝置**
- macOS: Safari 16+, Chrome 108+, Edge 108+
- Windows: Chrome 108+, Edge 108+（需 Windows Hello）
- Linux: Chrome 108+, Firefox 122+（需 FIDO2 相容裝置）

**行動裝置**
- iOS 16+: Safari, Chrome
- Android 9+: Chrome, Edge

### ⚠️ 部分支援
- 某些舊版瀏覽器可能不支援 Conditional UI（自動填充）
- 需要裝置有生物辨識硬體或支援 PIN 碼

---

## 如何使用 Passkey

### 方案一：新使用者無密碼註冊

**步驟**：
1. 訪問註冊頁面 `/auth/register`
2. 填寫 Email 和名稱
3. 勾選同意條款
4. 點擊「使用 Passkey 註冊（免密碼）」按鈕
5. 瀏覽器會彈出生物辨識驗證視窗
6. 完成驗證後自動登入

**優點**：
- 完全無需設定密碼
- 直接使用 Passkey 作為唯一認證方式
- 適合新使用者

---

### 方案二：已有帳號的使用者新增 Passkey

**步驟**：
1. 使用 Email/密碼或 Google 登入
2. 前往個人資料頁面 `/profile`
3. 點擊「Passkey 管理」
4. 點擊「新增 Passkey」按鈕
5. 完成生物辨識驗證
6. 下次登入可直接使用 Passkey

**優點**：
- 保留原有的密碼登入方式
- 可在多個裝置新增 Passkey
- 靈活切換登入方式

---

### 方案三：使用 Passkey 登入

**Email-guided 登入**：
1. 訪問登入頁面 `/auth/login`
2. 輸入 Email（可選）
3. 點擊「使用 Passkey 登入」按鈕
4. 完成生物辨識驗證
5. 自動登入

**Usernameless 登入**（支援的瀏覽器）：
1. 訪問登入頁面
2. 不輸入任何資訊
3. 點擊「使用 Passkey 登入」按鈕
4. 瀏覽器自動顯示可用的 Passkey
5. 選擇並完成驗證

---

## Passkey 管理

### 查看你的 Passkeys

1. 登入後前往 `/settings/passkeys`
2. 查看所有已註冊的 Passkeys
3. 每個 Passkey 顯示：
   - 裝置名稱
   - 建立日期
   - 最後使用時間
   - 傳輸方式

### 編輯裝置名稱

1. 點擊 Passkey 旁的「編輯」按鈕
2. 輸入新的裝置名稱（例如：「我的 iPhone」）
3. 點擊「儲存」

### 刪除 Passkey

⚠️ **注意事項**：
- 刪除後該裝置將無法使用 Passkey 登入
- 至少需保留一個 Passkey（如果你沒有設定密碼）
- 刪除操作無法復原

**步驟**：
1. 點擊 Passkey 旁的「刪除」按鈕
2. 確認刪除操作
3. Passkey 立即失效

---

## 常見問題 (FAQ)

### Q1: Passkey 和密碼有什麼不同？

**Passkey**：
- 儲存在你的裝置上
- 使用生物辨識驗證
- 無法被釣魚
- 無法被猜測

**密碼**：
- 儲存在伺服器上（雜湊後）
- 需要記憶
- 可能被釣魚
- 可能被猜測或暴力破解

### Q2: 我可以在多個裝置使用 Passkey 嗎？

可以！你可以在每個裝置上分別建立 Passkey：
- iPhone 上建立一個
- MacBook 上建立一個
- Windows 電腦上建立一個

某些平台（如 iCloud Keychain）支援 Passkey 同步。

### Q3: 如果我遺失裝置怎麼辦？

**如果你有多個 Passkey**：
1. 使用其他裝置登入
2. 前往 Passkey 管理頁面
3. 刪除遺失裝置的 Passkey

**如果你只有一個 Passkey**：
- 如果你有設定密碼：使用密碼登入
- 如果你有綁定 Google：使用 Google 登入
- 否則：聯繫客服協助恢復帳號

### Q4: Passkey 會被同步到雲端嗎？

視平台而定：
- **Apple (iCloud Keychain)**: 自動同步到所有 Apple 裝置
- **Google (Password Manager)**: 同步到 Android 和 Chrome
- **Windows Hello**: 僅儲存在本機
- **安全金鑰 (FIDO2)**: 僅儲存在金鑰上

### Q5: Passkey 比雙因素認證 (2FA) 還安全嗎？

是的！Passkey 結合了：
- 你擁有的東西（裝置）
- 你知道的東西（PIN）或你是誰（生物辨識）

而且 Passkey 天生防釣魚，比傳統 2FA（如簡訊驗證碼）更安全。

### Q6: 我可以同時保留密碼和 Passkey 嗎？

可以！我們支援三種登入方式：
1. Email/密碼
2. Google OAuth
3. Passkey

你可以自由選擇最方便的方式登入。

### Q7: 如何知道我的瀏覽器是否支援 Passkey？

訪問登入或註冊頁面：
- **支援**：會顯示「使用 Passkey 登入/註冊」按鈕
- **不支援**：按鈕不會顯示，可能會有警告訊息

### Q8: Passkey 會過期嗎？

不會！Passkey 是永久有效的，除非：
- 你手動刪除
- 裝置重置/格式化
- 管理員撤銷（極少情況）

---

## 安全建議

### ✅ 建議做法

1. **多裝置備援**
   - 在至少兩個裝置上建立 Passkey
   - 避免單點故障

2. **保留備用登入方式**
   - 設定密碼或綁定 Google
   - 以防 Passkey 裝置遺失

3. **定期檢查 Passkey 列表**
   - 刪除不再使用的裝置
   - 保持 Passkey 列表整潔

4. **使用有意義的裝置名稱**
   - 例如：「我的 iPhone 15」、「公司 MacBook」
   - 方便識別和管理

### ❌ 避免做法

1. **不要在公用電腦建立 Passkey**
   - 其他人可能使用你的 Passkey 登入

2. **不要刪除所有 Passkey**
   - 至少保留一個或設定備用登入方式

3. **不要分享裝置解鎖方式**
   - PIN 碼、生物辨識資訊應保密

---

## 疑難排解

### 問題：無法建立 Passkey

**可能原因**：
1. 瀏覽器不支援 WebAuthn
2. 裝置沒有生物辨識硬體
3. 未啟用生物辨識功能

**解決方案**：
1. 更新瀏覽器到最新版本
2. 檢查裝置設定，啟用 Touch ID / Face ID / Windows Hello
3. 嘗試使用其他瀏覽器

---

### 問題：Passkey 驗證失敗

**可能原因**：
1. 生物辨識驗證失敗
2. 裝置 PIN 碼輸入錯誤
3. Passkey 已被刪除

**解決方案**：
1. 重試生物辨識驗證
2. 確認 PIN 碼正確
3. 使用其他登入方式並重新建立 Passkey

---

### 問題：找不到「使用 Passkey」按鈕

**可能原因**：
1. 瀏覽器不支援
2. 網站未啟用 Passkey 功能
3. JavaScript 被封鎖

**解決方案**：
1. 檢查瀏覽器版本
2. 確認網站是 HTTPS
3. 檢查瀏覽器擴充功能是否封鎖 JavaScript

---

## 技術細節

### WebAuthn 標準

本系統使用 W3C WebAuthn 標準：
- **規範版本**: WebAuthn Level 2
- **支援演算法**: ES256, RS256
- **認證器類型**: Platform、Cross-platform（安全金鑰）

### 隱私保護

- Passkey 使用公開金鑰加密
- 伺服器僅儲存公鑰，私鑰永遠保留在你的裝置
- 無法透過公鑰反推私鑰
- 每個網站的 Passkey 都是獨立的

### 資料儲存

**客戶端（你的裝置）**：
- 私鑰（加密儲存）
- 憑證 ID

**伺服器端**：
- 公鑰
- 憑證 ID
- 簽名計數器（防重放攻擊）
- 裝置名稱（你設定的）
- 建立/使用時間

---

## 更多資源

- [WebAuthn 官方規範](https://www.w3.org/TR/webauthn-2/)
- [FIDO Alliance](https://fidoalliance.org/)
- [Passkeys 官方網站](https://www.passkeys.com/)

---

## 需要協助？

如果你遇到問題或有任何疑問：
1. 查看本指南的「常見問題」和「疑難排解」章節
2. 聯繫客服支援
3. 回報問題到 GitHub Issues

---

**最後更新**: 2025-10-03
**版本**: 1.0.0
