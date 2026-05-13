import subprocess
import os
import sys
import time
import threading

def run_command(command, cwd):
    process = subprocess.Popen(
        command,
        cwd=cwd,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        universal_newlines=True
    )
    for line in process.stdout:
        print(f"[{os.path.basename(cwd).upper()}] {line}", end="")

if __name__ == "__main__":
    print("🚀 Initializing GOO Platform...")
    
    # Paths
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    # Commands
    backend_cmd = f"{sys.executable} run.py"
    frontend_cmd = "npm run dev"

    # Threads
    threads = [
        threading.Thread(target=run_command, args=(backend_cmd, backend_dir), daemon=True),
        threading.Thread(target=run_command, args=(frontend_cmd, frontend_dir), daemon=True)
    ]

    for t in threads:
        t.start()

    print("\n✅ Both services are starting!")
    print("👉 Frontend: http://localhost:5173")
    print("👉 Backend:  http://localhost:8000\n")
    print("Press Ctrl+C to stop both services.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping GOO Platform... Goodbye!")
