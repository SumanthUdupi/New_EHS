
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
        # Since router uses innerHTML, it might take a tick
        time.sleep(1)

        # Try to verify if we are on the page
        if "incidents" not in page.url:
            print("FAIL: URL did not change to incidents")

        try:
             page.wait_for_selector("#incidents-view-container", timeout=10000)
             print("PASS: Incidents container found")
        except:
             print("FAIL: Incidents container NOT found")
             # Screenshot for debugging
             page.screenshot(path="verification/debug_incidents.png")
             print(page.content())
             return

        # Wait for list to render (spinner to go away or table to appear)
        try:
            page.wait_for_selector("#add-incident-btn", timeout=10000)
            print("PASS: Add Incident button found")
        except:
             print("FAIL: Add Incident button NOT found")
             return

        # Click Report Incident button
        page.click("#add-incident-btn")
        page.wait_for_selector("#add-incident-form")

        # Verify new fields exist
        # Check Type dropdown options
        type_options = page.locator("#inc-type option").all_text_contents()
        expected_types = ["Select Type", "Incident", "Near Miss", "Observation"]

        print("Type options found:", type_options)

        # Check if all expected types are present
        all_types_present = True
        for t in expected_types:
            if t not in type_options:
                print(f"FAIL: Type option '{t}' not found.")
                all_types_present = False
        if all_types_present:
            print("PASS: All expected types found.")

        # Check for Category dropdown (initially hidden)
        if page.is_visible("#inc-category-group") == False:
             print("PASS: Category group initially hidden.")
        else:
             print("FAIL: Category group should be hidden initially.")

        # Select 'Incident' to show category
        page.select_option("#inc-type", "Incident")
        if page.is_visible("#inc-category-group"):
             print("PASS: Category group visible after selecting Incident.")
        else:
             print("FAIL: Category group not visible after selecting Incident.")

        # Check for Location button
        if page.locator("#btn-get-location").count() > 0:
             print("PASS: Get Location button exists.")
        else:
             print("FAIL: Get Location button missing.")

        # Check for File input
        if page.locator("#inc-photos").count() > 0:
             print("PASS: Photo input exists.")
        else:
             print("FAIL: Photo input missing.")

        # Close modal
        page.click(".modal-close-btn")

        browser.close()

if __name__ == "__main__":
    try:
        run()
    except Exception as e:
        print(f"Error: {e}")
