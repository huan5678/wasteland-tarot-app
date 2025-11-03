"""
TDD 測試 - 內容驗證工具 (ContentValidator)

測試遵循 Red-Green-Refactor 循環：
1. 🔴 Red: 先寫失敗的測試
2. 🟢 Green: 實作最小代碼讓測試通過
3. 🔵 Refactor: 優化代碼（保持測試綠燈）

Task 2: 實作內容驗證工具
- 建立 ContentValidator 類別
- 實作 Markdown 語法移除功能
- 實作純文字長度計算
- 實作願望內容驗證（1-500字）
- 實作管理員回覆驗證（1-1000字）
"""

import pytest


class TestContentValidator:
    """測試 ContentValidator 類別"""

    def test_import_content_validator(self):
        """測試能夠導入 ContentValidator"""
        from app.services.content_validator import ContentValidator

        assert ContentValidator is not None

    def test_import_custom_exceptions(self):
        """測試能夠導入自訂例外"""
        from app.services.content_validator import (
            ContentEmptyError,
            ContentTooLongError
        )

        assert ContentEmptyError is not None
        assert ContentTooLongError is not None


class TestStripMarkdown:
    """測試 Markdown 語法移除功能"""

    def test_strip_markdown_plain_text(self):
        """測試純文字不受影響"""
        from app.services.content_validator import ContentValidator

        text = "這是純文字"
        result = ContentValidator.strip_markdown(text)

        assert result == "這是純文字"

    def test_strip_markdown_bold(self):
        """測試移除粗體語法 **text** 和 __text__"""
        from app.services.content_validator import ContentValidator

        # ** 包裹的粗體
        text1 = "這是**粗體**文字"
        result1 = ContentValidator.strip_markdown(text1)
        assert result1 == "這是粗體文字"

        # __ 包裹的粗體
        text2 = "這是__粗體__文字"
        result2 = ContentValidator.strip_markdown(text2)
        assert result2 == "這是粗體文字"

    def test_strip_markdown_italic(self):
        """測試移除斜體語法 *text* 和 _text_"""
        from app.services.content_validator import ContentValidator

        # * 包裹的斜體
        text1 = "這是*斜體*文字"
        result1 = ContentValidator.strip_markdown(text1)
        assert result1 == "這是斜體文字"

        # _ 包裹的斜體 (需避免與 __粗體__ 混淆)
        text2 = "這是_斜體_文字"
        result2 = ContentValidator.strip_markdown(text2)
        assert result2 == "這是斜體文字"

    def test_strip_markdown_headings(self):
        """測試移除標題符號 #, ##, ###"""
        from app.services.content_validator import ContentValidator

        text1 = "# 一級標題"
        result1 = ContentValidator.strip_markdown(text1)
        assert result1.strip() == "一級標題"

        text2 = "## 二級標題"
        result2 = ContentValidator.strip_markdown(text2)
        assert result2.strip() == "二級標題"

        text3 = "### 三級標題"
        result3 = ContentValidator.strip_markdown(text3)
        assert result3.strip() == "三級標題"

    def test_strip_markdown_links(self):
        """測試移除連結語法，保留顯示文字 [text](url)"""
        from app.services.content_validator import ContentValidator

        text = "請點擊[這個連結](https://example.com)查看"
        result = ContentValidator.strip_markdown(text)

        # 應該只保留 "這個連結"，移除 URL
        assert "這個連結" in result
        assert "https://example.com" not in result

    def test_strip_markdown_images(self):
        """測試完全移除圖片語法 ![alt](url)"""
        from app.services.content_validator import ContentValidator

        text = "這是圖片![圖片說明](https://example.com/image.png)結束"
        result = ContentValidator.strip_markdown(text)

        # 圖片應該完全被移除（包括 alt text）
        assert "圖片說明" not in result
        assert "image.png" not in result
        assert result.strip() == "這是圖片結束"

    def test_strip_markdown_inline_code(self):
        """測試移除行內程式碼語法 `code`"""
        from app.services.content_validator import ContentValidator

        text = "使用`console.log()`來除錯"
        result = ContentValidator.strip_markdown(text)

        # 應該保留程式碼內容，但移除反引號
        assert "console.log()" in result
        assert "`" not in result

    def test_strip_markdown_code_blocks(self):
        """測試移除程式碼區塊 ```language"""
        from app.services.content_validator import ContentValidator

        text = """這是說明
```python
def hello():
    print("Hello")
```
結束"""
        result = ContentValidator.strip_markdown(text)

        # 程式碼區塊應該被移除（包括內容）
        assert "def hello()" not in result
        assert "python" not in result
        assert "```" not in result
        assert "這是說明" in result
        assert "結束" in result

    def test_strip_markdown_blockquotes(self):
        """測試移除引用符號 >"""
        from app.services.content_validator import ContentValidator

        text = "> 這是引用文字"
        result = ContentValidator.strip_markdown(text)

        assert "這是引用文字" in result
        assert ">" not in result

    def test_strip_markdown_lists(self):
        """測試移除清單符號 -, *, +, 1."""
        from app.services.content_validator import ContentValidator

        # 無序清單
        text1 = "- 項目一\n- 項目二"
        result1 = ContentValidator.strip_markdown(text1)
        assert "項目一" in result1
        assert "項目二" in result1

        # 有序清單
        text2 = "1. 第一項\n2. 第二項"
        result2 = ContentValidator.strip_markdown(text2)
        assert "第一項" in result2
        assert "第二項" in result2

    def test_strip_markdown_complex_example(self):
        """測試複雜混合 Markdown 語法"""
        from app.services.content_validator import ContentValidator

        text = """# 標題
這是**粗體**和*斜體*混合。
[連結文字](https://example.com)
`inline code`
> 引用"""

        result = ContentValidator.strip_markdown(text)

        # 應該只保留純文字內容
        assert "標題" in result
        assert "粗體" in result
        assert "斜體" in result
        assert "連結文字" in result
        assert "inline code" in result
        assert "引用" in result

        # 不應該包含任何 Markdown 符號
        assert "#" not in result
        assert "**" not in result
        assert "*" not in result.replace("斜體", "")  # 斜體中可能有 *
        assert "[" not in result
        assert "]" not in result
        assert "https://" not in result
        assert "`" not in result
        assert ">" not in result


class TestGetPlainTextLength:
    """測試純文字長度計算"""

    def test_get_plain_text_length_simple(self):
        """測試簡單純文字長度計算"""
        from app.services.content_validator import ContentValidator

        text = "測試文字"
        length = ContentValidator.get_plain_text_length(text)

        assert length == 4

    def test_get_plain_text_length_with_markdown(self):
        """測試帶 Markdown 的文字長度計算"""
        from app.services.content_validator import ContentValidator

        # **粗體** 應該計算為 2 字（粗體），而非 6 字
        text = "**粗體**"
        length = ContentValidator.get_plain_text_length(text)
        assert length == 2

        # [連結](url) 應該計算為 2 字（連結），忽略 URL
        text2 = "[連結](https://example.com)"
        length2 = ContentValidator.get_plain_text_length(text2)
        assert length2 == 2

    def test_get_plain_text_length_unicode(self):
        """測試 Unicode 字元（繁體中文）長度計算"""
        from app.services.content_validator import ContentValidator

        text = "繁體中文測試字元"
        length = ContentValidator.get_plain_text_length(text)

        assert length == 8

    def test_get_plain_text_length_empty(self):
        """測試空字串長度"""
        from app.services.content_validator import ContentValidator

        text = ""
        length = ContentValidator.get_plain_text_length(text)

        assert length == 0

    def test_get_plain_text_length_whitespace_only(self):
        """測試純空白字串（應該 trim 後計算）"""
        from app.services.content_validator import ContentValidator

        text = "   \n\t  "
        length = ContentValidator.get_plain_text_length(text)

        assert length == 0


class TestValidateWishContent:
    """測試願望內容驗證（1-500字）"""

    def test_validate_wish_content_valid(self):
        """測試有效願望內容（100字）"""
        from app.services.content_validator import ContentValidator

        content = "希望平台能新增更多功能。" * 10  # 約100字

        # 不應該拋出例外
        ContentValidator.validate_wish_content(content)

    def test_validate_wish_content_valid_exactly_1_char(self):
        """測試恰好 1 字的願望（邊界值）"""
        from app.services.content_validator import ContentValidator

        content = "好"

        # 不應該拋出例外
        ContentValidator.validate_wish_content(content)

    def test_validate_wish_content_valid_exactly_500_chars(self):
        """測試恰好 500 字的願望（邊界值）"""
        from app.services.content_validator import ContentValidator

        content = "字" * 500

        # 不應該拋出例外
        ContentValidator.validate_wish_content(content)

    def test_validate_wish_content_empty(self):
        """測試空願望內容拋出 ContentEmptyError"""
        from app.services.content_validator import (
            ContentValidator,
            ContentEmptyError
        )

        with pytest.raises(ContentEmptyError) as exc_info:
            ContentValidator.validate_wish_content("")

        assert "空" in str(exc_info.value.message)

    def test_validate_wish_content_whitespace_only(self):
        """測試純空白願望內容拋出 ContentEmptyError"""
        from app.services.content_validator import (
            ContentValidator,
            ContentEmptyError
        )

        with pytest.raises(ContentEmptyError) as exc_info:
            ContentValidator.validate_wish_content("   \n\t  ")

        assert "空" in str(exc_info.value.message)

    def test_validate_wish_content_too_long(self):
        """測試超長願望內容（501字）拋出 ContentTooLongError"""
        from app.services.content_validator import (
            ContentValidator,
            ContentTooLongError
        )

        content = "字" * 501

        with pytest.raises(ContentTooLongError) as exc_info:
            ContentValidator.validate_wish_content(content)

        assert "500" in str(exc_info.value.message)

    def test_validate_wish_content_with_markdown(self):
        """測試帶 Markdown 的願望內容（計算純文字長度）"""
        from app.services.content_validator import ContentValidator

        # **粗體** (2字) + 一般文字 (98字) = 100字
        content = "**粗體**" + ("普通文字" * 24) + "普通"

        plain_length = ContentValidator.get_plain_text_length(content)
        assert 90 <= plain_length <= 110  # 允許一些誤差

        # 不應該拋出例外（因為純文字長度在 1-500 之間）
        ContentValidator.validate_wish_content(content)


class TestValidateAdminReply:
    """測試管理員回覆驗證（1-1000字）"""

    def test_validate_admin_reply_valid(self):
        """測試有效管理員回覆（500字）"""
        from app.services.content_validator import ContentValidator

        reply = "感謝您的建議，我們會盡快處理。" * 33  # 約500字

        # 不應該拋出例外
        ContentValidator.validate_admin_reply(reply)

    def test_validate_admin_reply_valid_exactly_1_char(self):
        """測試恰好 1 字的回覆（邊界值）"""
        from app.services.content_validator import ContentValidator

        reply = "好"

        # 不應該拋出例外
        ContentValidator.validate_admin_reply(reply)

    def test_validate_admin_reply_valid_exactly_1000_chars(self):
        """測試恰好 1000 字的回覆（邊界值）"""
        from app.services.content_validator import ContentValidator

        reply = "字" * 1000

        # 不應該拋出例外
        ContentValidator.validate_admin_reply(reply)

    def test_validate_admin_reply_empty(self):
        """測試空回覆內容拋出 ContentEmptyError"""
        from app.services.content_validator import (
            ContentValidator,
            ContentEmptyError
        )

        with pytest.raises(ContentEmptyError) as exc_info:
            ContentValidator.validate_admin_reply("")

        assert "空" in str(exc_info.value.message)

    def test_validate_admin_reply_whitespace_only(self):
        """測試純空白回覆內容拋出 ContentEmptyError"""
        from app.services.content_validator import (
            ContentValidator,
            ContentEmptyError
        )

        with pytest.raises(ContentEmptyError) as exc_info:
            ContentValidator.validate_admin_reply("   \n\t  ")

        assert "空" in str(exc_info.value.message)

    def test_validate_admin_reply_too_long(self):
        """測試超長回覆內容（1001字）拋出 ContentTooLongError"""
        from app.services.content_validator import (
            ContentValidator,
            ContentTooLongError
        )

        reply = "字" * 1001

        with pytest.raises(ContentTooLongError) as exc_info:
            ContentValidator.validate_admin_reply(reply)

        assert "1000" in str(exc_info.value.message)

    def test_validate_admin_reply_with_markdown(self):
        """測試帶 Markdown 的管理員回覆（計算純文字長度）"""
        from app.services.content_validator import ContentValidator

        # 包含 Markdown 的回覆
        reply = "# 回覆標題\n" + ("感謝您的**建議**，我們會處理。" * 50)

        plain_length = ContentValidator.get_plain_text_length(reply)
        assert plain_length <= 1000

        # 不應該拋出例外
        ContentValidator.validate_admin_reply(reply)


class TestCustomExceptions:
    """測試自訂例外類別"""

    def test_content_empty_error_structure(self):
        """測試 ContentEmptyError 例外結構"""
        from app.services.content_validator import ContentEmptyError

        error = ContentEmptyError("測試訊息")

        assert hasattr(error, "status_code")
        assert hasattr(error, "message")
        assert hasattr(error, "error_code")
        assert error.message == "測試訊息"

    def test_content_too_long_error_structure(self):
        """測試 ContentTooLongError 例外結構"""
        from app.services.content_validator import ContentTooLongError

        error = ContentTooLongError("測試訊息", max_length=500, actual_length=600)

        assert hasattr(error, "status_code")
        assert hasattr(error, "message")
        assert hasattr(error, "error_code")
        assert hasattr(error, "details")
        assert error.details["max_length"] == 500
        assert error.details["actual_length"] == 600

    def test_content_empty_error_default_message(self):
        """測試 ContentEmptyError 預設訊息"""
        from app.services.content_validator import ContentEmptyError

        error = ContentEmptyError()

        assert "空" in error.message or "不可為空" in error.message

    def test_content_too_long_error_default_message(self):
        """測試 ContentTooLongError 預設訊息"""
        from app.services.content_validator import ContentTooLongError

        error = ContentTooLongError(max_length=500)

        assert "500" in error.message
        assert "超過" in error.message or "過長" in error.message


class TestEdgeCases:
    """測試邊界情況與特殊案例"""

    def test_strip_markdown_with_nested_formatting(self):
        """測試巢狀格式化（粗體中包含斜體）"""
        from app.services.content_validator import ContentValidator

        text = "**粗體中的*斜體*文字**"
        result = ContentValidator.strip_markdown(text)

        # 應該移除所有格式化符號
        assert "粗體中的斜體文字" in result
        assert "*" not in result

    def test_strip_markdown_with_special_chars(self):
        """測試包含特殊字元的文字"""
        from app.services.content_validator import ContentValidator

        text = "測試 @#$%^&*() 特殊字元"
        result = ContentValidator.strip_markdown(text)

        # 非 Markdown 符號應該保留
        assert "@#$%^&*()" in result

    def test_validate_wish_content_with_long_markdown(self):
        """測試 Markdown 語法很長但純文字很短的願望"""
        from app.services.content_validator import ContentValidator

        # 長 URL 但顯示文字很短
        content = "[短](https://very-very-long-url.com/path/to/page?query=params)" * 10

        plain_length = ContentValidator.get_plain_text_length(content)
        assert plain_length == 10  # 只有 "短" * 10

        # 不應該拋出例外（純文字長度符合 1-500）
        ContentValidator.validate_wish_content(content)

    def test_validate_wish_content_code_blocks_not_counted(self):
        """測試程式碼區塊不計入字數"""
        from app.services.content_validator import ContentValidator

        content = """我的願望是改進功能
```python
# 這是一大段程式碼
# 不應該計入字數
def very_long_function_name_here():
    pass
```
希望能實現"""

        plain_length = ContentValidator.get_plain_text_length(content)

        # 程式碼區塊應該被移除，只計算前後文字
        assert plain_length < 50
        assert "我的願望是改進功能" in ContentValidator.strip_markdown(content)
        assert "希望能實現" in ContentValidator.strip_markdown(content)
        assert "def very_long" not in ContentValidator.strip_markdown(content)
