from playwright.sync_api import sync_playwright

def verify_incident_management():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to Incidents
        page.goto("http://localhost:8080/#/incidents")
        page.wait_for_selector("#incidents-view-container")

        # Verify Export (Check for no console errors when clicking)
        # We catch the download event to ensure it triggered
        with page.expect_download() as download_info:
            page.click("#export-btn")

        download = download_info.value
        print(f"Download started: {download.suggested_filename}")

        # 1. Report Incident
        page.click("#add-incident-btn")
        page.fill("#inc-title", "Test Incident Verification")
        # Set date manually or let it be
        page.fill("#inc-date", "2023-10-27T10:00")
        page.select_option("#inc-type", "Incident")
        page.select_option("#inc-category", "Equipment")
        page.select_option("#inc-severity", "Recordable")
        page.fill("#inc-location", "Factory Floor 1")
        page.fill("#inc-desc", "Machine malfunction caused minor injury.")
        page.click("#add-incident-form button[type='submit']")

        # Wait for notification
        page.wait_for_selector(".notification.success")

        # 2. View Incident Details (Get the first one, which should be the new one due to sorting)
        # Or find by text
        page.click("text=Test Incident Verification")
        page.wait_for_selector("#start-investigation-btn")

        # 3. Start Investigation
        page.click("#start-investigation-btn")
        page.fill("#inv-root-cause", "Primary cause: worn out gear. Secondary cause: skipped maintenance.")
        page.click("#investigation-form button[type='submit']")

        # Wait for notification
        page.wait_for_selector("text=Investigation analysis saved")

        # Verify Investigation data is shown
        page.wait_for_selector("text=Primary cause: worn out gear")

        # 4. Add Corrective Action
        page.click("#add-action-btn")
        page.fill("#action-desc", "Replace gear and schedule maintenance.")
        # Select first available user
        page.select_option("#action-assignee", index=1)
        page.fill("#action-due-date", "2023-11-01")
        page.select_option("#action-status", "Pending")
        # Use a more specific selector for the submit button
        page.click("#add-action-form button[type='submit']")

        # Wait for notification
        page.wait_for_selector("text=Corrective action added")

        # Verify Action is listed
        page.wait_for_selector("text=Replace gear and schedule maintenance.")

        # 5. Take Screenshot
        page.screenshot(path="verification/incident_verified_v2.png")

        browser.close()

if __name__ == "__main__":
    verify_incident_management()
