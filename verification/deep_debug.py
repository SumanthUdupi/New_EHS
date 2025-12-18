from playwright.sync_api import sync_playwright

def verify_ehs_dashboard_deep():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"CONSOLE: {msg.type}: {msg.text}"))
        page.on("pageerror", lambda msg: print(f"PAGE ERROR: {msg}"))

        print("Navigating to index...")
        page.goto("http://localhost:8080/index.html")
        page.wait_for_timeout(2000)

        # 1. Check if Chart is defined
        is_chart_defined = page.evaluate("() => typeof Chart !== 'undefined'")
        print(f"Chart.js defined? {is_chart_defined}")

        # 2. Check innerHTML of app-root
        root_html = page.eval_on_selector("#app-root", "el => el.innerHTML")
        print(f"App Root HTML (first 500 chars): {root_html[:500]}")

        # 3. Try navigating to Incidents
        print("Navigating to #/incidents...")
        page.evaluate("window.location.hash = '#/incidents'")
        page.wait_for_timeout(2000)

        root_html_incidents = page.eval_on_selector("#app-root", "el => el.innerHTML")
        print(f"Incidents HTML (first 500 chars): {root_html_incidents[:500]}")

        page.screenshot(path="verification/deep_debug.png")
        browser.close()

if __name__ == "__main__":
    verify_ehs_dashboard_deep()
