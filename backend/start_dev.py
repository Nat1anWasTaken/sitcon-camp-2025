#!/usr/bin/env python3
"""
開發環境啟動腳本
提供自動重載功能，方便開發時使用
"""

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # 開啟自動重載
        reload_dirs=["./"],  # 監控當前目錄的變化
    )
