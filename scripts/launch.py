"""Skills Manager — 原生桌面应用启动器"""
import sys
import os
import subprocess
import time
import threading
import json
import urllib.request
import signal

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(PROJECT_ROOT)

VITE_PORT = 5173
VITE_URL = f"http://localhost:{VITE_PORT}"

def find_vite():
    """Find the Vite binary (npx or local node_modules)"""
    npx = "npx.cmd" if sys.platform == "win32" else "npx"
    return [npx, "vite", "--port", str(VITE_PORT), "--strictPort"]

def wait_for_server(url, timeout=30):
    """Wait for the Vite dev server to be ready"""
    start = time.time()
    while time.time() - start < timeout:
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=1) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            pass
        time.sleep(0.3)
    return False

def start_vite():
    """Start the Vite dev server in background"""
    env = os.environ.copy()
    env["BROWSER"] = "none"

    vite = subprocess.Popen(
        find_vite(),
        cwd=PROJECT_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env=env,
        text=True,
        bufsize=1
    )

    # Print vite output in background
    def log_output():
        for line in vite.stdout:
            print(f"  [vite] {line.rstrip()}")

    threading.Thread(target=log_output, daemon=True).start()

    print(f"  启动 Vite 开发服务器...")
    if not wait_for_server(VITE_URL):
        print("  Vite 启动超时，请检查配置")
        vite.kill()
        return None

    print(f"  服务器就绪: {VITE_URL}")
    return vite

def main():
    print(r"""
  ╔════════════════════════════════╗
  ║     Skills Manager v1.0       ║
  ║   AI Skills 可视化管理工具     ║
  ╚════════════════════════════════╝
    """)

    # Start Vite dev server
    vite_proc = start_vite()
    if vite_proc is None:
        sys.exit(1)

    # Create native desktop window
    import webview

    window = webview.create_window(
        title="Skills Manager",
        url=VITE_URL,
        width=1280,
        height=860,
        min_size=(900, 600),
        resizable=True,
        fullscreen=False,
        easy_drag=False,
        background_color="#1e1e2e",
        text_select=True
    )

    # Start the webview event loop
    webview.start(debug=False)

    # Cleanup when window closes
    print("\n  关闭应用...")
    vite_proc.terminate()
    vite_proc.wait(timeout=5)
    print("  Skills Manager 已退出")

if __name__ == "__main__":
    main()
