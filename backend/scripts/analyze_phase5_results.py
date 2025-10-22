"""
Phase 5: 人工品質評估 - 結果分析腳本

分析測試結果，生成品質報告
"""
import csv
import json
from pathlib import Path
from typing import Dict, List
from datetime import datetime
import statistics


def load_test_results(results_dir: Path) -> List[Dict]:
    """載入所有測試結果"""
    summary_file = results_dir / "test_summary.csv"

    if not summary_file.exists():
        print(f"❌ 找不到測試總結檔案：{summary_file}")
        return []

    results = []
    with open(summary_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # 將評分轉換為數字
            try:
                row['score_psychology'] = int(row['score_psychology']) if row['score_psychology'] else None
                row['score_fallout'] = int(row['score_fallout']) if row['score_fallout'] else None
                row['score_character'] = int(row['score_character']) if row['score_character'] else None
                row['score_usefulness'] = int(row['score_usefulness']) if row['score_usefulness'] else None
                row['score_overall'] = int(row['score_overall']) if row['score_overall'] else None
            except ValueError:
                pass  # 保持為字串或 None

            results.append(row)

    return results


def calculate_statistics(results: List[Dict]) -> Dict:
    """計算統計資料"""

    # 過濾有評分的結果
    scored_results = [
        r for r in results
        if all([
            r.get('score_psychology'),
            r.get('score_fallout'),
            r.get('score_character'),
            r.get('score_usefulness'),
            r.get('score_overall')
        ])
    ]

    if not scored_results:
        return {
            "total_tests": len(results),
            "scored_tests": 0,
            "error": "No scored results found. Please fill in the scores in test_summary.csv"
        }

    # 計算總分（5 個維度）
    total_scores = []
    for r in scored_results:
        total = (
            r['score_psychology'] +
            r['score_fallout'] +
            r['score_character'] +
            r['score_usefulness'] +
            r['score_overall']
        )
        r['total_score'] = total
        total_scores.append(total)

    # 基本統計
    stats = {
        "total_tests": len(results),
        "scored_tests": len(scored_results),
        "success_rate": len(scored_results) / len(results) * 100 if results else 0,

        # 總分統計（滿分 25）
        "mean_total_score": statistics.mean(total_scores),
        "median_total_score": statistics.median(total_scores),
        "stdev_total_score": statistics.stdev(total_scores) if len(total_scores) > 1 else 0,
        "min_total_score": min(total_scores),
        "max_total_score": max(total_scores),

        # 高分率（≥ 20/25）
        "high_score_count": sum(1 for s in total_scores if s >= 20),
        "high_score_rate": sum(1 for s in total_scores if s >= 20) / len(total_scores) * 100,

        # 低分率（< 15/25）
        "low_score_count": sum(1 for s in total_scores if s < 15),
        "low_score_rate": sum(1 for s in total_scores if s < 15) / len(total_scores) * 100,

        # 各維度平均分
        "avg_psychology": statistics.mean([r['score_psychology'] for r in scored_results]),
        "avg_fallout": statistics.mean([r['score_fallout'] for r in scored_results]),
        "avg_character": statistics.mean([r['score_character'] for r in scored_results]),
        "avg_usefulness": statistics.mean([r['score_usefulness'] for r in scored_results]),
        "avg_overall": statistics.mean([r['score_overall'] for r in scored_results]),
    }

    # 角色分組統計
    character_stats = {}
    for character in set(r['character'] for r in scored_results if r.get('character')):
        char_results = [r for r in scored_results if r['character'] == character]
        char_scores = [r['total_score'] for r in char_results]

        character_stats[character] = {
            "count": len(char_results),
            "mean_score": statistics.mean(char_scores),
            "min_score": min(char_scores),
            "max_score": max(char_scores),
        }

    stats['character_stats'] = character_stats

    # 找出最佳和最差案例
    sorted_results = sorted(scored_results, key=lambda r: r['total_score'], reverse=True)
    stats['top_5'] = sorted_results[:5]
    stats['bottom_3'] = sorted_results[-3:]

    return stats


def generate_report(stats: Dict, output_file: Path):
    """生成 Markdown 報告"""

    if "error" in stats:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"# Phase 5: 測試結果報告\n\n")
            f.write(f"❌ **錯誤**：{stats['error']}\n\n")
            f.write(f"測試總數：{stats['total_tests']}\n")
            f.write(f"已評分：{stats['scored_tests']}\n")
        return

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# Phase 5: 人工品質評估結果報告\n\n")
        f.write(f"生成時間：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

        # 執行摘要
        f.write("## 執行摘要\n\n")
        f.write(f"- **測試總數**：{stats['total_tests']}\n")
        f.write(f"- **成功執行**：{stats['scored_tests']} ({stats['success_rate']:.1f}%)\n")
        f.write(f"- **平均總分**：{stats['mean_total_score']:.1f}/25 ({stats['mean_total_score']/25*100:.1f}%)\n")
        f.write(f"- **中位數**：{stats['median_total_score']}/25\n")
        f.write(f"- **標準差**：{stats['stdev_total_score']:.2f}\n")
        f.write(f"- **分數範圍**：{stats['min_total_score']}-{stats['max_total_score']}\n\n")

        # 成功標準檢查
        f.write("## 成功標準檢查\n\n")

        criteria = [
            ("平均分數 ≥ 18/25 (72%)", stats['mean_total_score'] >= 18),
            ("高分率 ≥ 40% (≥20分)", stats['high_score_rate'] >= 40),
            ("低分率 ≤ 10% (<15分)", stats['low_score_rate'] <= 10),
        ]

        for criterion, passed in criteria:
            icon = "✅" if passed else "❌"
            f.write(f"- {icon} {criterion}\n")

        all_passed = all(passed for _, passed in criteria)
        f.write(f"\n**整體評估**：{'✅ 通過所有標準' if all_passed else '⚠️ 部分標準未達成'}\n\n")

        # 分數分布
        f.write("## 分數分布\n\n")
        f.write(f"- **高分案例** (≥20分)：{stats['high_score_count']} ({stats['high_score_rate']:.1f}%)\n")
        f.write(f"- **中等案例** (15-19分)：{stats['scored_tests'] - stats['high_score_count'] - stats['low_score_count']}\n")
        f.write(f"- **低分案例** (<15分)：{stats['low_score_count']} ({stats['low_score_rate']:.1f}%)\n\n")

        # 各維度平均分
        f.write("## 各維度平均分\n\n")
        f.write("| 維度 | 平均分 | 百分比 |\n")
        f.write("|------|--------|--------|\n")
        f.write(f"| 榮格心理學深度 | {stats['avg_psychology']:.2f}/5 | {stats['avg_psychology']/5*100:.1f}% |\n")
        f.write(f"| Fallout 世界觀 | {stats['avg_fallout']:.2f}/5 | {stats['avg_fallout']/5*100:.1f}% |\n")
        f.write(f"| 角色個性鮮明度 | {stats['avg_character']:.2f}/5 | {stats['avg_character']/5*100:.1f}% |\n")
        f.write(f"| 解讀實用性 | {stats['avg_usefulness']:.2f}/5 | {stats['avg_usefulness']/5*100:.1f}% |\n")
        f.write(f"| 整體滿意度 | {stats['avg_overall']:.2f}/5 | {stats['avg_overall']/5*100:.1f}% |\n\n")

        # 角色表現
        f.write("## 角色表現\n\n")
        f.write("| 角色 | 測試數 | 平均總分 | 分數範圍 |\n")
        f.write("|------|--------|----------|----------|\n")

        for character, char_stats in sorted(
            stats['character_stats'].items(),
            key=lambda x: x[1]['mean_score'],
            reverse=True
        ):
            f.write(f"| {character} | {char_stats['count']} | ")
            f.write(f"{char_stats['mean_score']:.1f}/25 | ")
            f.write(f"{char_stats['min_score']}-{char_stats['max_score']} |\n")

        f.write("\n")

        # Top 5 案例
        f.write("## 🏆 Top 5 優秀案例\n\n")
        for i, result in enumerate(stats['top_5'], 1):
            f.write(f"### {i}. {result['test_id']} - 總分 {result['total_score']}/25\n\n")
            f.write(f"- **牌卡**：{result['card_name']}\n")
            f.write(f"- **角色**：{result['character']}\n")
            f.write(f"- **問題類型**：{result['question_type']}\n")
            f.write(f"- **評分**：心理學 {result['score_psychology']}, ")
            f.write(f"Fallout {result['score_fallout']}, ")
            f.write(f"角色 {result['score_character']}, ")
            f.write(f"實用性 {result['score_usefulness']}, ")
            f.write(f"整體 {result['score_overall']}\n")
            if result.get('comments'):
                f.write(f"- **評語**：{result['comments']}\n")
            f.write("\n")

        # Bottom 3 案例
        f.write("## ⚠️ 需改進案例 (Bottom 3)\n\n")
        for i, result in enumerate(stats['bottom_3'], 1):
            f.write(f"### {i}. {result['test_id']} - 總分 {result['total_score']}/25\n\n")
            f.write(f"- **牌卡**：{result['card_name']}\n")
            f.write(f"- **角色**：{result['character']}\n")
            f.write(f"- **問題類型**：{result['question_type']}\n")
            f.write(f"- **評分**：心理學 {result['score_psychology']}, ")
            f.write(f"Fallout {result['score_fallout']}, ")
            f.write(f"角色 {result['score_character']}, ")
            f.write(f"實用性 {result['score_usefulness']}, ")
            f.write(f"整體 {result['score_overall']}\n")
            if result.get('comments'):
                f.write(f"- **評語**：{result['comments']}\n")
            f.write("\n")

        # 建議行動
        f.write("## 建議行動項目\n\n")

        if all_passed:
            f.write("✅ **所有品質標準已達成！**\n\n")
            f.write("建議行動：\n")
            f.write("1. 繼續監控實際使用中的品質\n")
            f.write("2. 收集用戶反饋進一步優化\n")
            f.write("3. 考慮進行 A/B 測試驗證改進效果\n")
        else:
            f.write("⚠️ **部分標準未達成，建議採取以下行動：**\n\n")

            if stats['mean_total_score'] < 18:
                f.write("1. **提升整體品質**：平均分低於 18，建議檢視低分案例並優化 Prompt\n")

            if stats['high_score_rate'] < 40:
                f.write("2. **提高高分率**：優秀案例不足 40%，建議強化心理學深度和角色個性\n")

            if stats['low_score_rate'] > 10:
                f.write("3. **減少低分案例**：低分案例超過 10%，建議針對性改進底部 3 個案例\n")

            # 角色特定建議
            weak_characters = [
                char for char, char_stats in stats['character_stats'].items()
                if char_stats['mean_score'] < 15
            ]

            if weak_characters:
                f.write(f"\n4. **改進弱勢角色**：以下角色平均分低於 15，建議優化 Prompt：\n")
                for char in weak_characters:
                    f.write(f"   - {char}\n")

        f.write("\n")

        # 結論
        f.write("## 結論\n\n")
        f.write(f"本次測試共執行 {stats['scored_tests']} 個案例，")
        f.write(f"平均總分為 {stats['mean_total_score']:.1f}/25 ({stats['mean_total_score']/25*100:.1f}%)。\n\n")

        if all_passed:
            f.write("**✅ 新版 Character Prompt 品質優良，達到預期目標。**\n")
        else:
            f.write("**⚠️ 新版 Character Prompt 仍有改進空間，建議針對弱項進行優化。**\n")


def main():
    """主執行函數"""

    print("=" * 80)
    print("Phase 5: 結果分析")
    print("=" * 80)
    print()

    # 尋找結果目錄
    results_dir = Path(__file__).parent.parent / ".kiro/specs/refactor-tarot-system-prompt/phase5_results"

    if not results_dir.exists():
        print(f"❌ 找不到結果目錄：{results_dir}")
        print("請先執行：python scripts/execute_phase5_manual_test.py")
        return

    # 載入結果
    print("📂 載入測試結果...")
    results = load_test_results(results_dir)

    if not results:
        print("❌ 無法載入測試結果")
        return

    print(f"✅ 載入 {len(results)} 個測試結果")
    print()

    # 計算統計
    print("📊 計算統計資料...")
    stats = calculate_statistics(results)

    if "error" in stats:
        print(f"⚠️ {stats['error']}")
        print("請在 test_summary.csv 中填寫評分後再執行此腳本")
    else:
        print(f"✅ 統計完成")
        print(f"   平均總分：{stats['mean_total_score']:.1f}/25")
        print(f"   高分率：{stats['high_score_rate']:.1f}%")
        print(f"   低分率：{stats['low_score_rate']:.1f}%")

    print()

    # 生成報告
    report_file = results_dir / "PHASE5_TEST_RESULTS.md"
    print(f"📝 生成報告：{report_file}")
    generate_report(stats, report_file)

    print("✅ 報告生成完成！")
    print()
    print(f"請查看：{report_file}")


if __name__ == "__main__":
    main()
