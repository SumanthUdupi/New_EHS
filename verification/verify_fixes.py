
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

        # Test XSS
        page.evaluate("""
            const mockData = { type: "<script>alert(1)</script>", description: "<b>Bold</b>", date: "2023", status: "Open" };
            Data.incidents.unshift(mockData);
            app.renderIncidents();
        """)

        # Verify XSS is escaped
        content = page.content()
        if "<script>alert(1)</script>" in content:
             print("XSS Mitigation Failed: Script tag found in DOM")
        else:
             print("XSS Mitigation Passed")

        # Check rendered text
        element_text = page.locator("#incident-table-body tr").first.inner_text()
        if "<script>" in element_text:
             print("XSS Mitigation Passed: Tags rendered as text")

        # Test Training Modal
        page.click("text=Training")
        page.click("text=+ Assign Training")
        page.wait_for_selector("#training-form-modal")
        page.screenshot(path="verification/training_modal.png")

        browser.close()

if __name__ == "__main__":
    run()
