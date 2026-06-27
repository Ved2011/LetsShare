import subprocess
import glob

files = glob.glob('**/sidebar.js', recursive=True)
for f in files:
    if 'node_modules' in f or '(OLD)' in f:
        continue
    res = subprocess.run(['node', '-c', f], capture_output=True, text=True)
    if res.returncode != 0:
        print(f"FAILED: {f}")
        print(res.stderr)
    else:
        print(f"OK: {f}")
