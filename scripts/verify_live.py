"""
Quick end-to-end verification script for live HTTP API
"""
import time
import subprocess
import sys
import httpx

def main():
    print("Starting Uvicorn server on port 8000...")
    proc = subprocess.Popen([
        sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8000"
    ])
    try:
        time.sleep(3)
        with httpx.Client(base_url="http://127.0.0.1:8000", timeout=10.0) as client:
            h = client.get("/api/health")
            print("Health Check:", h.status_code, h.json())
            assert h.status_code == 200

            m = client.get("/api/flood/risk-map")
            print("Risk Map Status:", m.status_code)
            data = m.json()
            print(f"City: {data.get('city')}, Segments: {data.get('total_segments')}, Summary: {data.get('summary')}")
            assert data.get("total_segments") == 24

            r = client.get("/api/reports")
            print("Reports count:", len(r.json()))

            print("\nLIVE SERVER VERIFICATION SUCCESSFUL!")
    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    main()
