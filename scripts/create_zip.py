"""
Archive packaging script for AquaGuard AI Source Code.
Creates AquaGuard_AI_Source_Code.zip excluding node_modules, venv, and caches.
"""

import os
import zipfile

def should_exclude(rel_path: str) -> bool:
    normalized = rel_path.replace("\\", "/")
    parts = normalized.split("/")

    # Excluded directories
    excluded_dirs = {
        "node_modules", "venv", ".venv", "env", "dist",
        "__pycache__", ".pytest_cache", ".git", ".idea", ".vscode"
    }
    for part in parts:
        if part in excluded_dirs:
            return True

    # Excluded files
    filename = parts[-1]
    if filename.endswith((".pyc", ".pyo", ".pyd")):
        return True
    if filename in [".env", "aquaguard.db", "AquaGuard_AI_Source_Code.zip"]:
        return True

    return False

def make_archive():
    source_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    scratch_dir = os.path.abspath(os.path.join(source_dir, ".."))
    
    zip_path_scratch = os.path.join(scratch_dir, "AquaGuard_AI_Source_Code.zip")
    
    downloads_dir = os.path.expanduser("~/Downloads")
    zip_path_downloads = os.path.join(downloads_dir, "AquaGuard_AI_Source_Code.zip")

    print(f"Archiving source code from: {source_dir}")
    print(f"Target scratch ZIP: {zip_path_scratch}")

    file_count = 0
    total_size = 0

    with zipfile.ZipFile(zip_path_scratch, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                abs_file = os.path.join(root, file)
                rel_file = os.path.relpath(abs_file, source_dir)

                if should_exclude(rel_file):
                    continue

                archive_name = os.path.join("AquaGuard-AI", rel_file)
                zipf.write(abs_file, archive_name)
                file_count += 1
                total_size += os.path.getsize(abs_file)

    print(f"Packaged {file_count} files ({total_size / (1024*1024):.2f} MB uncompressed).")
    print(f"ZIP Archive size: {os.path.getsize(zip_path_scratch) / (1024*1024):.2f} MB")

    # Also copy to Downloads if available
    try:
        import shutil
        if os.path.exists(downloads_dir):
            shutil.copyfile(zip_path_scratch, zip_path_downloads)
            print(f"Copied to Downloads folder: {zip_path_downloads}")
    except Exception as e:
        print(f"Note: Could not copy to Downloads: {e}")

    # Verify zip content
    with zipfile.ZipFile(zip_path_scratch, "r") as check_zip:
        names = check_zip.namelist()
        print(f"Verification: {len(names)} entries in ZIP file.")
        
        has_readme = any("README.md" in n for n in names)
        has_reqs = any("requirements.txt" in n for n in names)
        has_package = any("package.json" in n for n in names)
        has_env_ex = any(".env.example" in n for n in names)
        has_node_modules = any("node_modules" in n for n in names)
        has_venv = any("venv" in n for n in names)

        print(f" - Contains README.md: {has_readme}")
        print(f" - Contains requirements.txt: {has_reqs}")
        print(f" - Contains package.json: {has_package}")
        print(f" - Contains .env.example: {has_env_ex}")
        print(f" - Excluded node_modules: {not has_node_modules}")
        print(f" - Excluded venv: {not has_venv}")

if __name__ == "__main__":
    make_archive()
