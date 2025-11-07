#!/usr/bin/env python3
"""
Memory Usage Checker - 快速檢查後端記憶體使用情況
在應用啟動後運行此腳本來查看優化效果
"""

import psutil
import os
import sys
from typing import Dict, Any


def format_bytes(bytes_value: int) -> str:
    """格式化 bytes 為人類可讀格式"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_value < 1024.0:
            return f"{bytes_value:.2f} {unit}"
        bytes_value /= 1024.0
    return f"{bytes_value:.2f} TB"


def get_process_memory_info(pid: int = None) -> Dict[str, Any]:
    """獲取進程記憶體資訊"""
    try:
        process = psutil.Process(pid) if pid else psutil.Process(os.getpid())
        memory_info = process.memory_info()
        
        return {
            "pid": process.pid,
            "name": process.name(),
            "status": process.status(),
            "memory": {
                "rss": memory_info.rss,
                "rss_formatted": format_bytes(memory_info.rss),
                "vms": memory_info.vms,
                "vms_formatted": format_bytes(memory_info.vms),
                "percent": round(process.memory_percent(), 2),
            },
            "cpu": {
                "percent": round(process.cpu_percent(interval=0.5), 2),
            },
            "threads": process.num_threads(),
            "connections": len(process.connections()) if hasattr(process, 'connections') else 0,
            "open_files": len(process.open_files()) if hasattr(process, 'open_files') else 0,
        }
    except (psutil.NoSuchProcess, psutil.AccessDenied) as e:
        return {"error": str(e)}


def find_python_processes() -> list:
    """找到所有 Python 相關進程"""
    python_processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            # 檢查是否為 Python 進程
            if proc.info['name'] and ('python' in proc.info['name'].lower() or 'uvicorn' in proc.info['name'].lower()):
                cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
                if 'app.main' in cmdline or 'uvicorn' in cmdline:
                    python_processes.append(proc.info['pid'])
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return python_processes


def main():
    """主函數"""
    print("🧠 後端記憶體使用情況檢查")
    print("=" * 60)
    
    # 如果提供了 PID
    if len(sys.argv) > 1:
        try:
            pid = int(sys.argv[1])
            info = get_process_memory_info(pid)
            if "error" in info:
                print(f"❌ 錯誤: {info['error']}")
                return
            
            print(f"\n📊 進程資訊 (PID: {info['pid']})")
            print(f"   名稱: {info['name']}")
            print(f"   狀態: {info['status']}")
            print(f"\n💾 記憶體使用:")
            print(f"   RSS (實際物理記憶體): {info['memory']['rss_formatted']}")
            print(f"   VMS (虛擬記憶體): {info['memory']['vms_formatted']}")
            print(f"   記憶體佔比: {info['memory']['percent']}%")
            print(f"\n🔧 資源:")
            print(f"   CPU 使用率: {info['cpu']['percent']}%")
            print(f"   執行緒數: {info['threads']}")
            print(f"   開啟的連線: {info['connections']}")
            print(f"   開啟的檔案: {info['open_files']}")
            
        except ValueError:
            print(f"❌ 無效的 PID: {sys.argv[1]}")
            return
    
    # 自動找到相關進程
    else:
        print("\n🔍 搜尋 Python/Uvicorn 進程...")
        pids = find_python_processes()
        
        if not pids:
            print("❌ 找不到運行中的後端進程")
            print("\n💡 提示: 請先啟動後端服務器")
            print("   cd backend && uv run uvicorn app.main:app --reload")
            return
        
        print(f"\n✅ 找到 {len(pids)} 個相關進程\n")
        
        total_rss = 0
        for pid in pids:
            info = get_process_memory_info(pid)
            if "error" not in info:
                total_rss += info['memory']['rss']
                print(f"📊 PID {info['pid']} ({info['name']})")
                print(f"   RSS: {info['memory']['rss_formatted']}")
                print(f"   CPU: {info['cpu']['percent']}%")
                print(f"   執行緒: {info['threads']}")
                print()
        
        if total_rss > 0:
            print(f"💰 總記憶體使用: {format_bytes(total_rss)}")
            
            # 提供優化建議
            total_mb = total_rss / 1024 / 1024
            print(f"\n📈 分析結果:")
            if total_mb > 400:
                print(f"   ⚠️  記憶體使用偏高 ({total_mb:.0f}MB)")
                print("   建議檢查:")
                print("   - ENABLE_BINGO_COLD_START_CHECK=false")
                print("   - ENABLE_SCHEDULER=false (如果不需要 Bingo 功能)")
                print("   - DATABASE_POOL_SIZE=3")
            elif total_mb > 300:
                print(f"   🟡 記憶體使用中等 ({total_mb:.0f}MB)")
                print("   可以進一步優化，參考 MEMORY_OPTIMIZATION_PLAN.md")
            elif total_mb > 200:
                print(f"   🟢 記憶體使用良好 ({total_mb:.0f}MB)")
            else:
                print(f"   ✅ 記憶體使用優秀 ({total_mb:.0f}MB)")
    
    print("\n" + "=" * 60)
    print("💡 提示: 使用 'python check_memory.py <PID>' 查看特定進程")
    print("   或訪問 http://localhost:8000/api/v1/monitoring/metrics/memory")


if __name__ == "__main__":
    main()
