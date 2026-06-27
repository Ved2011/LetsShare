import subprocess
import glob

with open('syntax_results.txt', 'w') as out:
    files = glob.glob('**/sidebar.js', recursive=True)
    for f in files:
        if 'node_modules' in f or '(OLD)' in f:
            continue
        res = subprocess.run(['node', '-c', f], capture_output=True, text=True)
        if res.returncode != 0:
            out.write(f"FAILED: {f}\n")
            out.write(res.stderr + "\n")
        else:
            out.write(f"OK: {f}\n")
