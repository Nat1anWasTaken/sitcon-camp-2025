from pathlib import Path
from typing import Dict, Optional


class PromptManager:
    """Prompt 管理器，負責讀取和緩存 prompt 文件"""

    def __init__(self):
        self._cache: Dict[str, str] = {}
        self._file_mtimes: Dict[str, float] = {}

        # 獲取 prompts 目錄的路徑
        current_file = Path(__file__)
        self._prompts_dir = current_file.parent.parent / "prompts"

    def get_prompt(self, prompt_name: str, use_cache: bool = True) -> str:
        """
        獲取 prompt 內容

        Args:
            prompt_name: prompt 文件名（不包含 .md 副檔名）
            use_cache: 是否使用緩存

        Returns:
            prompt 內容

        Raises:
            FileNotFoundError: 如果 prompt 文件不存在
        """
        prompt_path = self._prompts_dir / f"{prompt_name}.md"

        # 如果不使用緩存，直接讀取文件
        if not use_cache:
            return self._read_file(prompt_path)

        # 檢查緩存是否有效
        if self._is_cache_valid(prompt_path, prompt_name):
            return self._cache[prompt_name]

        # 讀取文件並更新緩存
        content = self._read_file(prompt_path)
        self._cache[prompt_name] = content
        self._file_mtimes[prompt_name] = prompt_path.stat().st_mtime

        return content

    def _read_file(self, file_path: Path) -> str:
        """讀取文件內容"""
        if not file_path.exists():
            raise FileNotFoundError(f"找不到 prompt 文件: {file_path}")

        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    def _is_cache_valid(self, file_path: Path, prompt_name: str) -> bool:
        """檢查緩存是否有效"""
        # 如果緩存中沒有這個 prompt，則無效
        if prompt_name not in self._cache:
            return False

        # 如果文件不存在，緩存無效
        if not file_path.exists():
            return False

        # 檢查文件修改時間
        current_mtime = file_path.stat().st_mtime
        cached_mtime = self._file_mtimes.get(prompt_name, 0)

        return current_mtime == cached_mtime

    def clear_cache(self, prompt_name: Optional[str] = None):
        """清除緩存"""
        if prompt_name is None:
            # 清除所有緩存
            self._cache.clear()
            self._file_mtimes.clear()
        else:
            # 清除特定 prompt 的緩存
            self._cache.pop(prompt_name, None)
            self._file_mtimes.pop(prompt_name, None)

    def get_siri_prompt(self, use_cache: bool = True) -> str:
        """獲取 Siri prompt 內容的便捷方法"""
        return self.get_prompt("siri", use_cache)


# 創建全局實例
prompt_manager = PromptManager()
