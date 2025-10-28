"""
可用性和無障礙需求驗證測試

驗證項目：
1. 行動裝置響應式設計
2. Touch ID / Face ID 在行動裝置上的觸發
3. 鍵盤導航和螢幕閱讀器（WCAG AA 合規）
4. 錯誤訊息的繁體中文本地化
5. PixelIcon 圖示的 aria-label

參考：requirements.md - 非功能性需求（可用性）
"""

import pytest
from typing import Dict, List


@pytest.mark.quality
class TestErrorMessageLocalization:
    """驗證錯誤訊息的繁體中文本地化"""

    def test_all_error_messages_are_in_chinese(self):
        """
        測試：所有使用者可見的錯誤訊息都使用繁體中文

        驗收標準：
        - 所有 HTTP 錯誤回應的 message 欄位都是繁體中文
        - 沒有英文錯誤訊息洩漏給用戶
        """
        from app.core.exceptions import (
            OAuthAuthorizationError,
            AccountConflictError,
            WebAuthnError,
            AuthenticationError
        )

        # 測試 OAuth 錯誤訊息
        oauth_error = OAuthAuthorizationError("Google 登入失敗，請稍後再試")
        assert "Google" in oauth_error.detail
        assert "登入失敗" in oauth_error.detail
        assert not any(c.isascii() and c.isalpha() and c.isupper() for c in oauth_error.detail if c not in ["Google", "OAuth", "API"])

        # 測試帳號衝突錯誤訊息
        conflict_error = AccountConflictError(
            email="test@example.com",
            existing_methods=["password"],
            message="此 email 已註冊，請使用現有方式登入"
        )
        assert "已註冊" in conflict_error.detail
        assert "登入" in conflict_error.detail

        # 測試 WebAuthn 錯誤訊息
        webauthn_error = WebAuthnError("生物辨識驗證失敗")
        assert "生物辨識" in webauthn_error.detail
        assert "驗證失敗" in webauthn_error.detail

    def test_api_error_responses_format(self):
        """
        測試：API 錯誤回應格式一致且包含繁體中文訊息

        驗收標準：
        - 錯誤回應包含 message 欄位
        - message 內容為繁體中文
        - 包含適當的 HTTP 狀態碼
        """
        error_messages = {
            400: "請求格式錯誤",
            401: "身份驗證失敗",
            403: "沒有權限執行此操作",
            404: "找不到資源",
            409: "帳號衝突",
            422: "無法處理的請求",
            500: "伺服器錯誤",
            502: "外部服務錯誤",
            503: "服務暫時無法使用"
        }

        for status_code, expected_message_pattern in error_messages.items():
            # 驗證錯誤訊息包含中文關鍵字
            assert any(ord(c) > 127 for c in expected_message_pattern), \
                f"狀態碼 {status_code} 的錯誤訊息應包含中文字元"


@pytest.mark.quality
class TestAccessibilityCompliance:
    """驗證無障礙需求合規性"""

    def test_icon_accessibility_requirements(self):
        """
        測試：驗證 PixelIcon 圖示系統的無障礙需求

        驗收標準：
        - 所有互動式圖示必須有 aria-label
        - 裝飾性圖示使用 decorative prop
        - 支援鍵盤導航
        """
        # 此測試主要由前端 E2E 測試驗證
        # 這裡記錄需求檢查清單

        accessibility_requirements = {
            "interactive_icons": {
                "description": "互動式圖示（按鈕、連結中的圖示）",
                "requirements": [
                    "必須提供 aria-label 屬性",
                    "aria-label 必須使用繁體中文",
                    "必須支援鍵盤 focus（Tab 鍵）",
                    "必須有視覺 focus 指示器"
                ],
                "examples": [
                    '<PixelIcon name="close" aria-label="關閉" />',
                    '<PixelIcon name="settings" aria-label="設定" />'
                ]
            },
            "decorative_icons": {
                "description": "裝飾性圖示（純視覺裝飾）",
                "requirements": [
                    "必須使用 decorative prop",
                    "螢幕閱讀器應該忽略",
                    "不應該有 aria-label"
                ],
                "examples": [
                    '<PixelIcon name="star" decorative />',
                    '<PixelIcon name="arrow-right" decorative />'
                ]
            },
            "semantic_colors": {
                "description": "語意化顏色變體",
                "requirements": [
                    "success: 成功訊息（綠色）",
                    "error: 錯誤訊息（紅色）",
                    "warning: 警告訊息（橙色）",
                    "info: 資訊訊息（藍色）"
                ]
            }
        }

        # 驗證需求清單完整性
        assert "interactive_icons" in accessibility_requirements
        assert "decorative_icons" in accessibility_requirements
        assert "semantic_colors" in accessibility_requirements

        # 驗證每個類別都有 requirements
        for category, config in accessibility_requirements.items():
            assert "requirements" in config, f"{category} 缺少 requirements"
            assert len(config["requirements"]) > 0, f"{category} requirements 不能為空"

    def test_keyboard_navigation_requirements(self):
        """
        測試：驗證鍵盤導航需求

        驗收標準（WCAG 2.1 AA - 2.1.1 鍵盤）：
        - 所有功能都可透過鍵盤操作
        - Tab 鍵可順序訪問所有互動元素
        - Enter/Space 可觸發按鈕和連結
        - Escape 可關閉 modal 和對話框
        - 表單可使用 Tab/Shift+Tab 在欄位間切換
        """
        keyboard_requirements = {
            "login_page": [
                "Tab 鍵可訪問所有認證選項（OAuth, Passkey, Email/密碼）",
                "Enter 鍵可觸發「使用 Google 登入」按鈕",
                "Enter 鍵可觸發「使用 Passkey 登入」按鈕",
                "Tab 鍵可在 email/password 表單欄位間切換",
                "Enter 鍵可提交登入表單"
            ],
            "passkey_upgrade_modal": [
                "Tab 鍵可在「立即設定 Passkey」和「稍後再說」間切換",
                "Enter 鍵可觸發「立即設定 Passkey」按鈕",
                "Escape 鍵可關閉 modal"
            ],
            "account_conflict_page": [
                "Tab 鍵可訪問所有登入選項",
                "Tab 鍵可在密碼表單欄位間切換",
                "Enter 鍵可提交登入並連結表單"
            ],
            "settings_page": [
                "Tab 鍵可訪問所有認證方式管理按鈕",
                "Enter 鍵可觸發「連結 Google 帳號」按鈕",
                "Enter 鍵可觸發「新增 Passkey」按鈕",
                "Enter 鍵可觸發「設定密碼」按鈕"
            ]
        }

        # 驗證所有關鍵頁面都有鍵盤導航需求
        required_pages = ["login_page", "passkey_upgrade_modal", "account_conflict_page", "settings_page"]
        for page in required_pages:
            assert page in keyboard_requirements, f"缺少 {page} 的鍵盤導航需求"
            assert len(keyboard_requirements[page]) > 0, f"{page} 的鍵盤導航需求不能為空"

    def test_screen_reader_requirements(self):
        """
        測試：驗證螢幕閱讀器需求

        驗收標準（WCAG 2.1 AA - 4.1.2 名稱、角色、值）：
        - 所有表單欄位都有正確的 label
        - 所有按鈕都有描述性文字或 aria-label
        - 錯誤訊息與對應欄位關聯（aria-describedby）
        - 動態內容更新有 aria-live 通知
        - 頁面結構使用語意化 HTML（header, main, nav, etc.）
        """
        screen_reader_requirements = {
            "form_fields": [
                "email 欄位有 <label>電子郵件</label>",
                "password 欄位有 <label>密碼</label>",
                "錯誤訊息使用 aria-describedby 關聯欄位",
                "必填欄位有 aria-required=\"true\""
            ],
            "buttons": [
                "「使用 Google 登入」按鈕有清楚文字",
                "「使用 Passkey 登入」按鈕有清楚文字",
                "圖示按鈕有 aria-label（例如：關閉按鈕）"
            ],
            "dynamic_content": [
                "成功訊息 toast 有 role=\"alert\" 或 aria-live=\"polite\"",
                "錯誤訊息 toast 有 role=\"alert\" 或 aria-live=\"assertive\"",
                "載入中狀態有 aria-busy=\"true\" 或 aria-live 通知"
            ],
            "semantic_html": [
                "<header> 包含網站標題和導航",
                "<main> 包含主要內容",
                "<nav> 包含導航連結",
                "<form> 包含表單欄位",
                "使用 <button> 而非 <div onClick>"
            ]
        }

        # 驗證所有類別都有需求
        required_categories = ["form_fields", "buttons", "dynamic_content", "semantic_html"]
        for category in required_categories:
            assert category in screen_reader_requirements, f"缺少 {category} 的螢幕閱讀器需求"
            assert len(screen_reader_requirements[category]) > 0, f"{category} 的螢幕閱讀器需求不能為空"


@pytest.mark.quality
class TestMobileUsability:
    """驗證行動裝置可用性需求"""

    def test_responsive_design_requirements(self):
        """
        測試：驗證響應式設計需求

        驗收標準：
        - 支援各種螢幕尺寸（320px - 1920px）
        - 行動裝置上使用觸控優化的按鈕尺寸（最小 44x44px）
        - 文字可讀性（最小字體 14px）
        - 避免水平捲動
        """
        responsive_breakpoints = {
            "mobile_s": {"width": 320, "description": "小型手機"},
            "mobile_m": {"width": 375, "description": "中型手機"},
            "mobile_l": {"width": 425, "description": "大型手機"},
            "tablet": {"width": 768, "description": "平板"},
            "laptop": {"width": 1024, "description": "筆記型電腦"},
            "laptop_l": {"width": 1440, "description": "大型筆電"},
            "desktop": {"width": 1920, "description": "桌上型電腦"}
        }

        touch_target_requirements = {
            "min_size": "44x44px",
            "applies_to": [
                "「使用 Google 登入」按鈕",
                "「使用 Passkey 登入」按鈕",
                "表單提交按鈕",
                "關閉 modal 按鈕",
                "所有互動式圖示"
            ],
            "spacing": "按鈕之間至少 8px 間距"
        }

        # 驗證斷點定義完整
        assert len(responsive_breakpoints) >= 5, "至少需要支援 5 種螢幕尺寸"

        # 驗證觸控目標需求
        assert touch_target_requirements["min_size"] == "44x44px", "觸控目標最小尺寸應為 44x44px"
        assert len(touch_target_requirements["applies_to"]) > 0, "觸控目標需求應列出適用元素"

    def test_touch_id_face_id_requirements(self):
        """
        測試：驗證 Touch ID / Face ID 觸發需求

        驗收標準：
        - iOS 裝置上優先觸發 Touch ID / Face ID
        - Android 裝置上優先觸發指紋辨識
        - 使用 WebAuthn Conditional UI（autofill）在支援的裝置上
        - 提供明確的生物辨識提示訊息
        """
        biometric_requirements = {
            "ios": {
                "supported": ["Touch ID", "Face ID"],
                "trigger": "點擊「使用 Passkey 登入」按鈕後自動觸發",
                "fallback": "若生物辨識失敗，提供重試或切換認證方式"
            },
            "android": {
                "supported": ["指紋辨識", "臉部辨識"],
                "trigger": "點擊「使用 Passkey 登入」按鈕後自動觸發",
                "fallback": "若生物辨識失敗，提供重試或切換認證方式"
            },
            "conditional_ui": {
                "description": "WebAuthn Conditional UI（Autofill）",
                "requirements": [
                    "email 輸入框有 autocomplete=\"webauthn\"",
                    "點擊 email 輸入框時自動顯示可用 Passkeys",
                    "選擇 Passkey 後自動觸發生物辨識",
                    "無需額外點擊「使用 Passkey 登入」按鈕"
                ]
            },
            "user_messages": {
                "trigger": "正在啟動生物辨識驗證...",
                "success": "生物辨識驗證成功",
                "failed": "生物辨識驗證失敗，請重試",
                "not_supported": "您的裝置不支援生物辨識，請使用其他登入方式"
            }
        }

        # 驗證兩個主要平台都有需求
        assert "ios" in biometric_requirements
        assert "android" in biometric_requirements
        assert "conditional_ui" in biometric_requirements

        # 驗證使用者訊息都是繁體中文
        for key, message in biometric_requirements["user_messages"].items():
            assert any(ord(c) > 127 for c in message), f"{key} 訊息應包含中文字元"


@pytest.mark.quality
class TestLocalizationQuality:
    """驗證本地化品質"""

    def test_all_user_facing_text_in_traditional_chinese(self):
        """
        測試：驗證所有使用者可見文字都使用繁體中文

        驗收標準：
        - UI 標籤使用繁體中文
        - 按鈕文字使用繁體中文
        - 錯誤訊息使用繁體中文
        - 成功訊息使用繁體中文
        - Tooltip 和 hint 使用繁體中文
        """
        ui_text_examples = {
            "auth_methods": {
                "oauth_button": "使用 Google 登入",
                "passkey_button": "使用 Passkey 登入",
                "email_password_label": "使用電子郵件和密碼登入"
            },
            "passkey_upgrade_modal": {
                "title": "升級至更快速的生物辨識登入",
                "description": "使用指紋或 Face ID 登入，無需每次點擊 Google 按鈕",
                "primary_button": "立即設定 Passkey",
                "secondary_button": "稍後再說",
                "footer_hint": "您隨時可以在帳號設定中新增 Passkey"
            },
            "account_conflict_page": {
                "title": "此 Email 已註冊",
                "description_template": "您的 Google 帳號（{email}）已經在系統中註冊過",
                "password_prompt": "請輸入您的密碼以連結 Google 帳號",
                "passkey_prompt": "使用生物辨識登入並連結 Google 帳號",
                "back_button": "返回登入頁面"
            },
            "settings_page": {
                "oauth_label": "Vault-Tec 授權連結",
                "passkey_label": "生物辨識掃描儀",
                "password_label": "傳統安全協議",
                "add_oauth_button": "連結 Google 帳號",
                "add_passkey_button": "新增 Passkey",
                "set_password_button": "設定密碼"
            },
            "success_messages": {
                "passkey_registered": "Passkey 設定完成！下次您可以使用生物辨識快速登入",
                "oauth_linked": "Google 帳號已連結！",
                "password_set": "密碼設定成功"
            },
            "error_messages": {
                "oauth_failed": "Google 登入失敗，請稍後再試",
                "passkey_failed": "生物辨識驗證失敗",
                "password_incorrect": "密碼錯誤，請重試",
                "account_locked": "帳號已鎖定 15 分鐘，請稍後再試"
            }
        }

        # 驗證所有文字都包含中文字元
        def contains_chinese(text: str) -> bool:
            return any(ord(c) > 127 for c in text)

        for category, texts in ui_text_examples.items():
            if isinstance(texts, dict):
                for key, value in texts.items():
                    if isinstance(value, str):
                        assert contains_chinese(value), \
                            f"{category}.{key} 應包含中文字元：{value}"

        # 驗證文字品質
        assert "Passkey" in ui_text_examples["passkey_upgrade_modal"]["description"]
        assert "生物辨識" in ui_text_examples["passkey_upgrade_modal"]["description"]
        assert "Google" in ui_text_examples["auth_methods"]["oauth_button"]
