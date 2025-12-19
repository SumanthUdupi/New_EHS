from playwright.sync_api import sync_playwright

def verify_incident_management():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app (assuming server running at 8080)
        page.goto("http://localhost:8080")

        # Wait for potential redirects
        page.wait_for_timeout(2000)

        # Click on Incidents link in sidebar
        page.click("a[href='#/incidents']")
        page.wait_for_timeout(1000)

        # 1. Verify Report Incident Modal
        print("Opening Report Incident Modal...")
        page.click("#add-incident-btn")
        page.wait_for_timeout(1000)

        # Fill out the form
        page.select_option("#inc-type", "Incident")
        page.wait_for_selector("#inc-category") # Ensure category appears
        page.select_option("#inc-category", "Chemical")
        page.fill("#inc-date", "2023-10-27T10:00")
        page.fill("input[name='reportingPerson']", "John Doe")
        page.fill("input[name='site']", "Factory A")
        page.fill("input[name='area']", "Warehouse")
        page.fill("#inc-location", "Loc 123")
        page.select_option("#inc-severity", "High")
        page.fill("#inc-desc", "Chemical spill test incident")
        page.fill("textarea[name='immediateActions']", "Evacuated area")

        # Submit
        print("Submitting Incident...")
        page.click("button[type='submit']")
        page.wait_for_timeout(1000)

        # 2. Verify Incident Detail View
        # Click on the first incident (should be the one we just added, at top)
        print("Opening Incident Detail...")
        page.click("#incidents-table tbody tr:first-child .btn-icon[title='View']")
        page.wait_for_timeout(1000)

        page.screenshot(path="verification_detail_basic.png")
        print("Screenshot taken: verification_detail_basic.png")

        # 3. Verify Configuration and Conditional Cards
        print("Configuring Incident...")
        # Check incident elements
        page.check("input[value='People']")
        page.check("input[value='Material']")
        page.check("input[value='Violation']")

        # Enable Investigation
        page.check("#config-investigation-req")

        # Save Configuration
        page.click("button:text('Save Configuration')")
        page.wait_for_timeout(1000)

        page.screenshot(path="verification_detail_cards.png")
        print("Screenshot taken: verification_detail_cards.png")

        # 4. Verify Material Card
        print("Checking Material Card...")
        page.click("#add-material-btn")
        page.fill(".m-name", "Acid")
        page.fill(".m-amount", "50")
        page.click("#cleanup-toggle") # Toggle cleanup response
        page.fill("#cl-cleanup", "Neutralization")

        page.click("#save-material-btn")
        page.wait_for_timeout(500)

        page.screenshot(path="verification_detail_material.png")
        print("Screenshot taken: verification_detail_material.png")

        browser.close()

if __name__ == "__main__":
    verify_incident_management()
