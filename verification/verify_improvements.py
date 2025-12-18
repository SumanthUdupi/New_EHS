from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Navigate to Dashboard
        page.goto("http://localhost:8080/#/dashboard")
        page.wait_for_selector('#app-root', state='visible')

        # Verify Dark Mode Toggle
        page.click('#theme-toggle-btn')
        page.wait_for_timeout(500)
        page.screenshot(path="verification/dashboard_dark.png")
        print("Captured dark mode dashboard.")

        # Verify Sidebar Collapse
        page.click('#sidebar-collapse-btn')
        page.wait_for_timeout(500)
        page.screenshot(path="verification/sidebar_collapsed.png")
        print("Captured collapsed sidebar.")

        # 2. Navigate to Incident List (Breadcrumbs check)
        page.click('#theme-toggle-btn') # Revert to light
        page.click('#sidebar-collapse-btn') # Revert sidebar
        page.goto("http://localhost:8080/#/incidents")
        page.wait_for_selector('#incidents-table', state='visible')
        page.screenshot(path="verification/incident_list.png")
        print("Captured incident list with breadcrumbs.")

        # 3. Add Incident Modal (AI Categorization check)
        page.click('#add-incident-btn')
        page.wait_for_selector('#add-incident-form', state='visible')

        # Type description to trigger AI
        page.fill('#inc-desc', 'There was a chemical spill near the lab resulting in a fire.')
        page.click('#inc-title') # Blur to trigger AI
        page.wait_for_timeout(1000) # Wait for simulation

        page.screenshot(path="verification/incident_modal_ai.png")
        print("Captured incident modal with AI suggestion.")

        # 4. Incident Detail (Timeline check)
        page.click('.modal-close-btn')
        page.click('a[href^="#/incidents/"]') # Click first incident
        page.wait_for_selector('.timeline', state='visible')
        page.screenshot(path="verification/incident_detail_timeline.png")
        print("Captured incident detail with timeline.")

        browser.close()

if __name__ == "__main__":
    verify_changes()
