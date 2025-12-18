from playwright.sync_api import sync_playwright

def verify_ehs_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the dashboard
        page.goto("http://localhost:8080/index.html")

        # Wait for the dashboard to load (look for specific elements)
        page.wait_for_selector(".kpi-grid")

        # Take a screenshot of the dashboard
        page.screenshot(path="verification/dashboard.png")

        # Navigate to Incidents
        page.click('a[href="#/incidents"]')
        page.wait_for_selector("#incidents-table")
        page.screenshot(path="verification/incidents.png")

        # Navigate to Risks
        page.click('a[href="#/risks"]')
        page.wait_for_selector("#risks-table")
        page.screenshot(path="verification/risks.png")

        browser.close()

if __name__ == "__main__":
    verify_ehs_dashboard()
