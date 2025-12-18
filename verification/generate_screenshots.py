
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file via localhost
        page.goto("http://localhost:8081/index.html")

        # Navigate to Incidents module
        # Wait for the app to load
        page.wait_for_selector("#app-root")

        # Click the link
        page.click("a[href='#/incidents']")

        # Wait for container
        page.wait_for_selector("#incidents-view-container", timeout=10000)

        # Wait for list to render
        page.wait_for_selector("#add-incident-btn", timeout=10000)

        # Click Report Incident button
        page.click("#add-incident-btn")
        page.wait_for_selector("#add-incident-form")

        # Fill in minimal info to take a screenshot of the form with new fields
        page.select_option("#inc-type", "Incident")

        # Wait a bit for the category to appear
        time.sleep(0.5)

        # Take screenshot of the form
        page.screenshot(path="verification/incident_form_design.png")
        print("Screenshot saved to verification/incident_form_design.png")

        # Close modal
        page.click(".modal-close-btn")

        # Now click on an incident to view details
        # Assuming there is at least one incident
        page.click("#incidents-table tbody tr:first-child .btn-icon[title='View']")

        # Wait for details
        page.wait_for_selector(".card-title")

        # Take screenshot of details
        page.screenshot(path="verification/incident_detail_design.png")
        print("Screenshot saved to verification/incident_detail_design.png")

        browser.close()

if __name__ == "__main__":
    try:
        run()
    except Exception as e:
        print(f"Error: {e}")
