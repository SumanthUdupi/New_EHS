from playwright.sync_api import sync_playwright

def verify_incident_features():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app (assuming server running at 8080)
        page.goto("http://localhost:8080")
        page.wait_for_timeout(2000)

        # Go to Incidents
        page.click("a[href='#/incidents']")
        page.wait_for_timeout(1000)

        # View the incident created in previous step (ID #11 usually if state persisted, or #1 if reset)
        # We'll just click the first one
        page.click("#incidents-table tbody tr:first-child .btn-icon[title='View']")
        page.wait_for_timeout(1000)

        # --- Test Sequence Drag and Drop ---
        print("Testing Sequence Drag and Drop...")
        # Add events
        page.fill("#new-seq-event", "Event A")
        page.click("#add-seq-btn")
        page.wait_for_timeout(500)
        page.fill("#new-seq-event", "Event B")
        page.click("#add-seq-btn")
        page.wait_for_timeout(500)
        page.fill("#new-seq-event", "Event C")
        page.click("#add-seq-btn")
        page.wait_for_timeout(500)

        # Get items
        items = page.locator(".sequence-item")
        print(f"Found {items.count()} sequence items")

        if items.count() >= 3:
            # Drag 3rd item (Event C) to 1st position (Event A)
            src = items.nth(2)
            dest = items.nth(0)

            src.drag_to(dest)
            page.wait_for_timeout(1000)

            # Verify order
            text_0 = items.nth(0).text_content()
            text_1 = items.nth(1).text_content()
            text_2 = items.nth(2).text_content()

            print(f"Order after drag: {text_0}, {text_1}, {text_2}")

            # Note: drag_to might not trigger all HTML5 drag events perfectly in headless
            # but we'll capture screenshot to see

        page.screenshot(path="verification_sequence_drag.png")
        print("Screenshot taken: verification_sequence_drag.png")

        # --- Test Adding People (Check Re-render) ---
        print("Testing Adding People...")
        # Ensure People card is visible
        if not page.is_visible("#people-list"):
            page.check("input[value='People']")
            page.click("button:text('Save Configuration')")
            page.wait_for_timeout(1000)

        initial_people = page.locator(".person-entry").count()
        print(f"Initial people count: {initial_people}")

        page.click("#add-person-btn")
        page.wait_for_timeout(500) # Wait for store update and re-render

        new_people = page.locator(".person-entry").count()
        print(f"New people count: {new_people}")

        if new_people == initial_people + 1:
            print("SUCCESS: Person added correctly without double render issues (presumably)")
        else:
            print("FAILURE: Person count did not increase as expected")

        browser.close()

if __name__ == "__main__":
    verify_incident_features()
