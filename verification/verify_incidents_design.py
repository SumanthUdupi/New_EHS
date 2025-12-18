
from playwright.sync_api import sync_playwright
import os
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        file_path = os.path.abspath("index.html")
        page.goto(f"file://{file_path}")

        # Navigate to Incidents module
        page.click("a[href='#/incidents']")
        page.wait_for_selector("#incidents-view-container")

        # Click Report Incident button
        page.click("#add-incident-btn")
        page.wait_for_selector("#add-incident-form")

        # Verify new fields exist
        # Check Type dropdown options
        type_options = page.locator("#inc-type option").all_text_contents()
        expected_types = ["Select Type", "Incident", "Near Miss", "Observation"]

        # Check if all expected types are present
        for t in expected_types:
            if t not in type_options:
                print(f"FAIL: Type option '{t}' not found.")

        # Check for Category dropdown (initially hidden or shown based on selection)
        if page.locator("#inc-category-group").count() > 0:
             print("PASS: Category group exists.")
        else:
             print("FAIL: Category group missing.")

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
