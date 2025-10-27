# Passkey 使用者指南

> **歡迎來到廢土塔羅系統** - 使用 Pip-Boy 生物辨識技術保護你的避難所帳號

---

## 目錄

1. [什麼是 Passkey？](#什麼是-passkey)
2. [為什麼要使用 Passkey？](#為什麼要使用-passkey)
3. [支援的裝置與瀏覽器](#支援的裝置與瀏覽器)
4. [如何註冊 Passkey](#如何註冊-passkey)
5. [如何使用 Passkey 登入](#如何使用-passkey-登入)
6. [如何管理你的 Passkeys](#如何管理你的-passkeys)
7. [常見問題（FAQ）](#常見問題faq)
8. [疑難排解](#疑難排解)

---

## 什麼是 Passkey？

### 簡單來說

**Passkey** 是一種新型態的登入方式，讓你可以使用 **Face ID**、**Touch ID** 或 **指紋辨識** 來登入網站，完全不需要記憶密碼。

### Fallout 世界觀

在廢土世界中，Pip-Boy 搭載了先進的生物辨識掃描系統。每位避難所居民都會留下獨一無二的生物特徵，這比任何密碼都更安全、更方便。

### 技術原理（給進階使用者）

Passkey 使用 **WebAuthn 標準**（由 W3C 和 FIDO 聯盟開發），基於 **公鑰加密技術**：

- **Private Key（私鑰）**: 儲存在你的裝置上，永遠不會離開
- **Public Key（公鑰）**: 儲存在我們的伺服器
- **生物辨識**: 用於解鎖你裝置上的私鑰

即使我們的伺服器被駭客入侵，他們也無法用你的 Passkey 登入，因為私鑰永遠不會傳輸到網路上。

---

## 為什麼要使用 Passkey？

### 優點

#### 1. 更安全
- ❌ **不會被釣魚**: 即使你訪問假冒網站，Passkey 也不會運作（因為 origin 驗證）
- ❌ **不會洩漏**: 沒有密碼可以洩漏或被竊取
- ❌ **不會被暴力破解**: 沒有密碼可以嘗試猜測
- ✅ **抗中間人攻擊**: 使用公鑰加密，無法被攔截

#### 2. 更方便
- 不用記憶複雜的密碼
- 不用定期更換密碼
- 不用擔心密碼管理器
- 一鍵登入（Touch ID / Face ID）

#### 3. 更快速
- 生物辨識登入只需 **1-2 秒**
- 比輸入密碼快 **5-10 倍**
- 支援 **自動填入**（Autofill UI）

### 與傳統密碼的比較

| 功能 | 傳統密碼 | Passkey |
|-----|---------|---------|
| **安全性** | 可能被竊取、釣魚 | 幾乎無法破解 |
| **便利性** | 需要記憶 | 不需記憶 |
| **速度** | 需輸入（慢） | 生物辨識（快） |
| **多裝置** | 需同步密碼 | 可在每個裝置新增 |
| **抗釣魚** | ❌ 無法抵抗 | ✅ 完全抵抗 |

---

## 支援的裝置與瀏覽器

### 桌面平台

#### macOS
- ✅ **Safari** 16+ (推薦)
- ✅ **Chrome** 108+
- ✅ **Edge** 108+
- ✅ **Firefox** 119+
- 需要：Touch ID 或 Apple Watch

#### Windows
- ✅ **Chrome** 108+
- ✅ **Edge** 108+
- ✅ **Firefox** 119+
- 需要：Windows Hello（臉部辨識、指紋、PIN）

#### Linux
- ✅ **Chrome** 108+
- ✅ **Firefox** 119+
- 需要：實體安全金鑰（YubiKey）或系統生物辨識

### 行動平台

#### iOS / iPadOS
- ✅ **Safari** 16+ (推薦)
- ✅ **Chrome** 108+
- ✅ **Edge** 108+
- 需要：Face ID 或 Touch ID
- 版本：iOS 16+, iPadOS 16+

#### Android
- ✅ **Chrome** 108+ (推薦)
- ✅ **Edge** 108+
- ✅ **Firefox** 119+
- 需要：指紋辨識或臉部辨識
- 版本：Android 9+

### 實體安全金鑰

- ✅ **YubiKey 5 系列**
- ✅ **Google Titan Key**
- ✅ **其他 FIDO2 相容金鑰**

---

## 如何註冊 Passkey

### 新使用者註冊（無密碼）

#### 步驟 1：訪問註冊頁面

訪問 [https://wastelandtarot.com/register](https://wastelandtarot.com/register)

#### 步驟 2：輸入 Email 和姓名

填寫：
- **Email**: 你的 email 地址（用於識別帳號）
- **姓名**: 你的顯示名稱

#### 步驟 3：點擊「使用 Passkey 註冊」

點擊綠色的 **「使用 Passkey 註冊」** 按鈕。

![Pip-Boy 準備掃描生物辨識...](https://via.placeholder.com/600x300?text=Pip-Boy+Scanning)

#### 步驟 4：完成生物辨識

瀏覽器會彈出提示：

- **iOS/macOS**: 使用 Face ID 或 Touch ID
- **Android**: 使用指紋辨識或臉部辨識
- **Windows**: 使用 Windows Hello

#### 步驟 5：完成！

成功後你會看到：

```
✅ 生物辨識掃描完成！
歡迎加入避難所，居民。Pip-Boy 已啟動。
Karma +50 🎉
```

自動導向至 Dashboard。

---

### 已登入使用者新增 Passkey

如果你已經有帳號（使用密碼或 Google 登入），可以新增 Passkey：

#### 步驟 1：前往設定頁面

訪問 [https://wastelandtarot.com/settings/passkeys](https://wastelandtarot.com/settings/passkeys)

#### 步驟 2：點擊「新增 Passkey」

點擊 **「新增 Passkey」** 按鈕。

#### 步驟 3：完成生物辨識

按照瀏覽器提示完成驗證。

#### 步驟 4：設定裝置名稱（可選）

為這個 Passkey 取個名字，例如：
- "iPhone 15 Pro"
- "MacBook Air Touch ID"
- "YubiKey 5C"

#### 步驟 5：完成！

新 Passkey 會出現在你的 Passkeys 清單中。

**獎勵**: 首次新增 Passkey 獲得 +10 Karma 🎉

---

## 如何使用 Passkey 登入

### 方法 1：Email-guided 登入（桌面推薦）

#### 步驟 1：訪問登入頁面

訪問 [https://wastelandtarot.com/login](https://wastelandtarot.com/login)

#### 步驟 2：輸入 Email

輸入你註冊時使用的 email。

#### 步驟 3：點擊「使用 Passkey 登入」

點擊綠色的 **「使用 Passkey 登入」** 按鈕。

#### 步驟 4：完成生物辨識

瀏覽器會顯示你在這個裝置上註冊的 Passkey，選擇一個並完成驗證。

#### 步驟 5：完成！

自動導向至 Dashboard。

**獎勵**: 首次使用 Passkey 登入獲得 +20 Karma 🎉

---

### 方法 2：快速登入（Autofill，行動裝置推薦）

#### 步驟 1：訪問登入頁面

訪問 [https://wastelandtarot.com/login](https://wastelandtarot.com/login)

#### 步驟 2：點擊 Email 輸入框

**不用輸入任何東西**，只要點擊 email 輸入框。

#### 步驟 3：從自動填入選擇帳號

瀏覽器會在鍵盤上方顯示可用的 Passkey 帳號，點擊你想登入的帳號。

![iOS Autofill](https://via.placeholder.com/400x200?text=iOS+Autofill+UI)

#### 步驟 4：完成生物辨識

使用 Face ID、Touch ID 或指紋辨識。

#### 步驟 5：完成！

自動登入並導向 Dashboard。

---

## 如何管理你的 Passkeys

### 查看所有 Passkeys

訪問 [設定 > Passkeys 管理](https://wastelandtarot.com/settings/passkeys)

你會看到：

```
📱 iPhone 15 Pro
   最後使用：2025-10-28 12:30
   裝置類型：平台認證器（內建）
   傳輸方式：internal

💻 MacBook Air Touch ID
   最後使用：2025-10-27 08:15
   裝置類型：平台認證器（內建）
   傳輸方式：internal

🔑 YubiKey 5C
   最後使用：2025-10-25 14:00
   裝置類型：漫遊認證器（外接）
   傳輸方式：usb
```

### 新增新的 Passkey

點擊 **「新增 Passkey」** 按鈕，按照提示完成。

**限制**: 每個帳號最多可以新增 **10 個 Passkeys**。

### 重新命名 Passkey

1. 點擊 Passkey 卡片上的 **編輯圖示**
2. 輸入新名稱（例如："工作 MacBook"）
3. 點擊「儲存」

### 刪除 Passkey

1. 點擊 Passkey 卡片上的 **刪除圖示**
2. 確認刪除

**重要**: 如果這是你唯一的認證方式（沒有密碼、沒有 Google 登入），系統會警告你無法刪除最後一個 Passkey。

---

## 常見問題（FAQ）

### Q1: 我可以在多個裝置使用 Passkey 嗎？

**A**: 可以！你可以在每個裝置上新增 Passkey。例如：

- iPhone 上新增一個 Passkey
- MacBook 上新增另一個 Passkey
- YubiKey 上新增第三個 Passkey

每個裝置都有獨立的 Passkey，互不影響。

---

### Q2: 如果我遺失裝置怎麼辦？

**A**: 不用擔心！你可以：

1. 用其他裝置登入（如果有多個 Passkey）
2. 或使用密碼登入（如果有設定密碼）
3. 或使用 Google 登入（如果有綁定 Google）
4. 登入後，前往「設定 > Passkeys 管理」刪除遺失裝置的 Passkey

**建議**: 至少在兩個裝置上新增 Passkey，以防萬一。

---

### Q3: Passkey 安全嗎？

**A**: **非常安全！** 原因：

1. **私鑰永遠不離開你的裝置**: 即使我們的伺服器被駭，駭客也無法用你的 Passkey 登入。
2. **抗釣魚**: 即使你訪問假冒網站，Passkey 也不會運作（因為 domain 驗證）。
3. **不會被截獲**: 使用公鑰加密，網路傳輸的都是加密資料。
4. **生物辨識保護**: 只有你可以解鎖 Passkey。

---

### Q4: 我可以同時使用 Passkey 和密碼嗎？

**A**: 可以！你可以同時設定：

- Passkey（快速、安全）
- 密碼（備用）
- Google 登入（備用）

選擇你喜歡的方式登入。

---

### Q5: 如果瀏覽器不支援 Passkey 怎麼辦？

**A**: 系統會自動偵測瀏覽器支援度：

- **不支援**: 顯示「請使用密碼登入」或「升級瀏覽器」提示
- **支援但未啟用**: 顯示啟用步驟

建議使用最新版的 Chrome、Safari 或 Edge。

---

### Q6: Passkey 會同步到其他裝置嗎？

**A**: 取決於平台：

- **Apple 裝置**: 如果啟用 iCloud Keychain，Passkey 會自動同步到所有 Apple 裝置（iPhone, iPad, Mac）
- **Android 裝置**: 如果啟用 Google Password Manager，Passkey 會同步到你的 Google 帳號
- **實體安全金鑰**: 不會同步（儲存在金鑰上）

---

### Q7: 我可以在別人的電腦上使用 Passkey 嗎？

**A**: 可以，但不建議。你可以：

1. **使用手機掃描 QR code**: 用你的手機 Passkey 登入別人的電腦（某些瀏覽器支援）
2. **使用實體安全金鑰**: 插入 YubiKey 登入

**注意**: 登入後記得登出！

---

### Q8: 註冊 Passkey 會獲得 Karma 獎勵嗎？

**A**: 會！

- **首次註冊 Passkey**: +50 Karma
- **首次使用 Passkey 登入**: +20 Karma
- **新增額外 Passkey**: +10 Karma

這是避難所為了鼓勵居民使用安全的生物辨識系統而提供的獎勵。

---

### Q9: 我可以用 Passkey 在其他網站登入嗎？

**A**: 不行。每個 Passkey 只對特定網站有效（透過 origin 驗證）。

如果其他網站也支援 Passkey，你需要在那裡另外註冊。

---

### Q10: 如果我的指紋/臉部辨識壞掉怎麼辦？

**A**: 你可以：

1. **使用 PIN 碼**: 大部分裝置支援 PIN 碼作為生物辨識的備用方式
2. **使用其他裝置的 Passkey**: 用另一個裝置登入
3. **使用密碼或 Google 登入**: 備用認證方式

---

## 疑難排解

### 問題 1: 瀏覽器沒有彈出生物辨識提示

**可能原因**:
- 瀏覽器不支援 WebAuthn
- 裝置沒有生物辨識硬體
- 生物辨識功能未啟用

**解決方案**:

#### macOS
1. 確認 Touch ID 已設定：**系統設定 > Touch ID 與密碼**
2. 確認瀏覽器有權限：**系統設定 > 隱私權與安全性 > Touch ID**
3. 重啟瀏覽器

#### iOS
1. 確認 Face ID/Touch ID 已啟用：**設定 > Face ID 與密碼**
2. 確認 Safari 有權限：**設定 > Safari > 自動填寫**
3. 重啟 Safari

#### Windows
1. 確認 Windows Hello 已設定：**設定 > 帳戶 > 登入選項**
2. 確認瀏覽器有權限
3. 重啟瀏覽器

#### Android
1. 確認指紋辨識已啟用：**設定 > 安全性 > 指紋**
2. 確認 Chrome 有權限
3. 重啟 Chrome

---

### 問題 2: 顯示「Challenge 已過期」

**原因**: Challenge 有效期限只有 5 分鐘，可能你等太久才完成驗證。

**解決方案**:
1. 重新點擊「使用 Passkey 註冊/登入」按鈕
2. 在 5 分鐘內完成生物辨識

---

### 問題 3: 顯示「生物辨識註冊失敗」

**可能原因**:
- 網路連線中斷
- 伺服器暫時無法連線
- 瀏覽器安全性設定阻擋

**解決方案**:
1. 檢查網路連線
2. 確認你訪問的是 `https://wastelandtarot.com`（必須是 HTTPS）
3. 清除瀏覽器快取和 Cookie
4. 嘗試其他瀏覽器

---

### 問題 4: 顯示「找不到 Passkey」

**原因**: 你在這個裝置上沒有註冊 Passkey。

**解決方案**:
1. 使用密碼或 Google 登入
2. 登入後新增 Passkey（設定 > Passkeys 管理）

---

### 問題 5: 無法刪除 Passkey

**原因**: 這是你唯一的認證方式，系統保護你不會鎖住自己的帳號。

**解決方案**:
1. 先設定密碼或綁定 Google 帳號
2. 或新增另一個 Passkey
3. 然後就可以刪除舊的 Passkey

---

### 問題 6: 達到 10 個 Passkeys 上限

**原因**: 為了安全性和效能，每個帳號最多 10 個 Passkeys。

**解決方案**:
1. 刪除不再使用的 Passkey（例如舊手機、遺失裝置）
2. 然後新增新的 Passkey

---

### 問題 7: 行動裝置上看不到 Autofill

**可能原因**:
- 瀏覽器不支援 Conditional UI
- 自動填寫功能未啟用

**解決方案**:

#### iOS Safari
1. **設定 > Safari > 自動填寫** > 啟用「通行金鑰」
2. 重新載入登入頁面

#### Android Chrome
1. **設定 > 密碼與帳戶 > Google** > 啟用「自動登入」
2. 重新載入登入頁面

#### 備用方案
使用 Email-guided 登入（輸入 email 後點擊「使用 Passkey 登入」）。

---

### 問題 8: 實體安全金鑰無法運作

**可能原因**:
- 金鑰未插入
- USB 埠故障
- 瀏覽器不支援 USB 認證器

**解決方案**:
1. 確認金鑰已正確插入
2. 嘗試其他 USB 埠
3. 確認金鑰指示燈有閃爍
4. 使用最新版 Chrome 或 Edge（Firefox 對 USB 支援較差）
5. 如果是 NFC 金鑰，確認裝置支援 NFC

---

## 還需要協助嗎？

如果以上方法都無法解決你的問題，請聯絡我們：

### 技術支援

- **Email**: support@wastelandtarot.com
- **線上客服**: [https://wastelandtarot.com/support](https://wastelandtarot.com/support)
- **Discord 社群**: [https://discord.gg/wasteland-tarot](https://discord.gg/wasteland-tarot)

### 回報問題時請提供

1. **裝置資訊**: 例如 "iPhone 15 Pro, iOS 17.2"
2. **瀏覽器**: 例如 "Safari 17.2"
3. **錯誤訊息**: 完整的錯誤訊息截圖
4. **重現步驟**: 如何觸發這個問題

我們會盡快回覆！

---

## 延伸閱讀

想了解更多關於 Passkey 和 WebAuthn 的資訊？

- [WebAuthn 官方指南](https://webauthn.guide/)
- [FIDO Alliance](https://fidoalliance.org/)
- [Passkey.org](https://www.passkeys.org/)
- [Apple Passkeys 說明](https://support.apple.com/zh-tw/HT213305)
- [Google Passkeys 說明](https://support.google.com/accounts/answer/13548313)

---

**文件版本**: 1.0.0
**最後更新**: 2025-10-28
**維護者**: Wasteland Tarot Support Team

---

> **Pip-Boy 系統訊息**: 此文件會定期更新，請訂閱我們的 Newsletter 以獲得最新資訊。
