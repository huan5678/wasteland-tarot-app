#!/usr/bin/env python3
"""
檢查所有 API endpoints 是否有適當的 commit 操作
"""

import re
import os
from pathlib import Path
from typing import List, Dict, Tuple


class CommitChecker:
    """檢查 endpoints 中的 commit 操作"""

    def __init__(self, backend_dir: str = "."):
        self.backend_dir = Path(backend_dir)
        self.endpoints_dir = self.backend_dir / "app" / "api" / "v1" / "endpoints"

    def find_endpoint_files(self) -> List[Path]:
        """找到所有 endpoint 文件"""
        if not self.endpoints_dir.exists():
            print(f"❌ Endpoints directory not found: {self.endpoints_dir}")
            return []

        return list(self.endpoints_dir.glob("*.py"))

    def analyze_file(self, file_path: Path) -> Dict[str, any]:
        """分析單個文件中的 endpoint"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        result = {
            "file": file_path.name,
            "endpoints": [],
            "has_writes": False,
            "has_commits": False
        }

        # 查找所有 endpoint 函數
        endpoint_pattern = r'@router\.(post|put|patch|delete|get)\((.*?)\)(.*?)async def (\w+)\('
        endpoints = re.findall(endpoint_pattern, content, re.DOTALL)

        # 查找寫入操作關鍵字
        write_keywords = [
            'await db.commit()',
            'await session.commit()',
            '.add(',
            '.delete(',
            '.update(',
            'UPDATE ',
            'INSERT ',
            'DELETE '
        ]

        for method, route_info, _, func_name in endpoints:
            # 獲取函數完整內容
            func_pattern = rf'async def {func_name}\(.*?\):(.*?)(?=@router\.|class |def |$)'
            func_match = re.search(func_pattern, content, re.DOTALL)

            if func_match:
                func_content = func_match.group(1)

                # 檢查是否有寫入操作
                has_write = any(keyword in func_content for keyword in write_keywords
                              if keyword not in ['await db.commit()', 'await session.commit()'])

                # 檢查是否有 commit
                has_commit = 'await db.commit()' in func_content or 'await session.commit()' in func_content

                # POST, PUT, PATCH, DELETE 通常是寫入操作
                is_write_method = method.upper() in ['POST', 'PUT', 'PATCH', 'DELETE']

                endpoint_info = {
                    "name": func_name,
                    "method": method.upper(),
                    "has_write_keywords": has_write,
                    "has_commit": has_commit,
                    "is_write_method": is_write_method,
                    "needs_check": (is_write_method or has_write) and not has_commit
                }

                result["endpoints"].append(endpoint_info)

                if has_write:
                    result["has_writes"] = True
                if has_commit:
                    result["has_commits"] = True

        return result

    def check_all(self):
        """檢查所有文件"""
        files = self.find_endpoint_files()

        if not files:
            print("❌ No endpoint files found")
            return

        print("="*80)
        print("COMMIT OPERATION CHECK")
        print("="*80)
        print(f"Checking {len(files)} files in {self.endpoints_dir}\n")

        needs_attention = []
        all_good = []

        for file_path in files:
            result = self.analyze_file(file_path)

            print(f"\n📄 {result['file']}")
            print("-" * 40)

            if not result["endpoints"]:
                print("  ℹ️  No endpoints found")
                continue

            for ep in result["endpoints"]:
                status = ""
                if ep["needs_check"]:
                    status = "⚠️  NEEDS CHECK"
                    needs_attention.append((result['file'], ep))
                elif ep["has_commit"]:
                    status = "✅ Has commit"
                elif not ep["is_write_method"] and not ep["has_write_keywords"]:
                    status = "✅ Read-only"
                    all_good.append((result['file'], ep))
                else:
                    status = "ℹ️  Unknown"

                print(f"  {status}")
                print(f"    {ep['method']:6} {ep['name']}")
                if ep["has_write_keywords"]:
                    print(f"    → Has write operations")
                if ep["has_commit"]:
                    print(f"    → Has commit call")

        # 摘要
        print("\n" + "="*80)
        print("SUMMARY")
        print("="*80)

        if needs_attention:
            print(f"\n⚠️  {len(needs_attention)} endpoints need attention:\n")
            for file, ep in needs_attention:
                print(f"  {file}: {ep['method']} {ep['name']}")
                if ep['is_write_method']:
                    print(f"    → Write method without explicit commit")
                if ep['has_write_keywords']:
                    print(f"    → Has database writes without commit")

        if all_good:
            print(f"\n✅ {len(all_good)} endpoints look good (read-only or have commits)")

        print(f"\n📊 Total endpoints checked: {sum(len(self.analyze_file(f)['endpoints']) for f in files)}")

        if needs_attention:
            print("\n" + "="*80)
            print("RECOMMENDATIONS")
            print("="*80)
            print("""
1. Review endpoints marked "NEEDS CHECK"
2. For write operations, add:
   ```python
   await db.commit()
   ```
3. For read-only operations that were flagged, verify they don't modify data
4. Consider adding explicit commits even for methods like POST if they create resources
            """)


if __name__ == "__main__":
    checker = CommitChecker()
    checker.check_all()
