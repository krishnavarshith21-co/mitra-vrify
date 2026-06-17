import urllib.request
import json
import ssl

PRODUCTION_API_URL = "https://mitra-vrify-production.up.railway.app/api/v1"

# Bypass SSL errors if certificates are missing locally
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def main():
    print("--------------------------------------------------")
    print("MITRA VERIFY - Production Database Purge / Reset")
    print("--------------------------------------------------")
    
    # 1. Login to get JWT Token
    login_url = f"{PRODUCTION_API_URL}/auth/login"
    login_data = json.dumps({
        "email": "admin@mitraverify.com",
        "password": "admin123"
    }).encode("utf-8")
    
    req_login = urllib.request.Request(
        login_url,
        data=login_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    print("Authenticating as admin@mitraverify.com...")
    try:
        with urllib.request.urlopen(req_login, context=ctx) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            token = res_data.get("access_token")
            print("Authentication successful!")
    except Exception as e:
        print(f"Error during authentication: {e}")
        print("Please check if the password for admin@mitraverify.com is 'admin123'.")
        return

    # 2. Call Reset Database API
    reset_url = f"{PRODUCTION_API_URL}/admin/reset-db"
    req_reset = urllib.request.Request(
        reset_url,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    
    print("\nSending database purge command to Railway server...")
    try:
        with urllib.request.urlopen(req_reset, context=ctx) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            print("--------------------------------------------------")
            print("SUCCESS:")
            print(res_data.get("message"))
            print("--------------------------------------------------")
    except Exception as e:
        print(f"Error during database reset: {e}")

if __name__ == "__main__":
    main()
