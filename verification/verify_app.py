
from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        file_path = os.path.abspath("prototype/index.html")
        page.goto(f"file://{file_path}")

        # Wait for dashboard content
        page.wait_for_selector("#dashboard-view")

        # Take a screenshot of the Dashboard
        page.screenshot(path="verification/dashboard.png", full_page=True)

        # Click on Incidents and take screenshot
        page.click("text=Incidents")
        page.wait_for_selector("#incidents-view.active")
        page.screenshot(path="verification/incidents.png", full_page=True)

        # Click on Report New Incident to see the modal
        page.click("text=+ Report New Incident")
        page.wait_for_selector("#incident-form-modal")
        page.screenshot(path="verification/incident_modal.png")
        page.click("button:has-text(\"X\")")

        # Click on Risk Assessment
        page.click("text=Risk Assessment")
        page.wait_for_selector("#risk-view.active")
        page.screenshot(path="verification/risk.png", full_page=True)

        # Mobile View Test
        page.set_viewport_size({"width": 375, "height": 812})
        page.reload() # Reload to reset any state
        page.wait_for_selector(".menu-toggle")
        page.screenshot(path="verification/mobile_dashboard.png")

        # Toggle Sidebar
        page.click(".menu-toggle")
        page.wait_for_selector("#sidebar.open")
        page.screenshot(path="verification/mobile_sidebar.png")

        browser.close()

if __name__ == "__main__":
    run()
