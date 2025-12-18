from playwright.sync_api import sync_playwright

def verify_ehs_dashboard_debug():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"CONSOLE: {msg.type}: {msg.text}"))
        page.on("pageerror", lambda msg: print(f"PAGE ERROR: {msg}"))
        page.on("requestfailed", lambda request: print(f"FAILED REQUEST: {request.url} - {request.failure}"))

        print("Navigating to dashboard...")
        try:
            page.goto("http://localhost:8080/index.html", timeout=10000)
            print("Navigation complete.")
        except Exception as e:
            print(f"Navigation failed: {e}")

        # Wait a bit to let things settle
        page.wait_for_timeout(2000)

        print("Taking initial screenshot...")
        page.screenshot(path="verification/debug_initial.png")

        print("Checking for .kpi-grid...")
        try:
            # Check if element exists first
            if page.locator(".kpi-grid").count() > 0:
                print("Element .kpi-grid found in DOM.")
                if page.locator(".kpi-grid").is_visible():
                     print("Element .kpi-grid is visible.")
                else:
                     print("Element .kpi-grid is NOT visible.")
            else:
                print("Element .kpi-grid NOT found in DOM.")

            # Print body content if failed
            # content = page.content()
            # print(f"Page Content Preview: {content[:500]}...")

            page.wait_for_selector(".kpi-grid", state="visible", timeout=5000)
            print("Success: .kpi-grid visible")
            page.screenshot(path="verification/dashboard_success.png")
        except Exception as e:
            print(f"Error waiting for selector: {e}")
            page.screenshot(path="verification/dashboard_timeout.png")

        browser.close()

if __name__ == "__main__":
    verify_ehs_dashboard_debug()
