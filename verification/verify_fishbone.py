from playwright.sync_api import sync_playwright

def verify_fishbone_delete_btn():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Navigate to the Incident Management page
        page.goto("http://localhost:8080/#/incidents")
        page.wait_for_timeout(1000)

        # Inject the modal with pre-populated data
        page.evaluate("""
            import('./js/components/fishbone.js').then(module => {
                const data = {
                    problemStatement: 'Test Problem',
                    categories: [
                        {
                            id: 'cat1',
                            title: 'People',
                            causes: [{ text: 'Test Cause 1' }]
                        }
                    ]
                };
                const modal = new module.FishboneModal(1, data, () => {});
                modal.render();
            });
        """)

        # Wait for SVG
        page.wait_for_selector("#fishbone-svg-container svg")

        # Locate the delete button (g.delete-cause-btn)
        delete_btn = page.locator(".delete-cause-btn").first

        # Wait for it to be attached
        delete_btn.wait_for(state="attached")

        # Check computed style opacity
        initial_opacity = delete_btn.evaluate("el => getComputedStyle(el).opacity")
        print(f"Initial Opacity: {initial_opacity}")

        # Take a screenshot of the initial state
        page.screenshot(path="verification/fishbone_initial.png")

        # Hover over the delete button
        # We need to hover over the circle or the text specifically because the group might have 0 opacity (pointer events?)
        # If opacity is 0, pointer events might pass through unless handled.
        # But let's see if playwright can hover.

        # If opacity is 0, is it "visible" to Playwright?
        # Playwright considers elements with opacity:0 as not visible.
        # So delete_btn.hover() might fail if force=False.
        # Let's try force=True to simulate mouse moving over that coordinate.
        delete_btn.hover(force=True)

        # Take a screenshot of the hover state
        page.screenshot(path="verification/fishbone_hover.png")

        # Check computed style opacity
        hover_opacity = delete_btn.evaluate("el => getComputedStyle(el).opacity")
        print(f"Hover Opacity: {hover_opacity}")

        # Move mouse away
        page.mouse.move(0, 0)

        # Take a screenshot of the mouseleave state
        page.screenshot(path="verification/fishbone_leave.png")

        # Check computed style opacity
        leave_opacity = delete_btn.evaluate("el => getComputedStyle(el).opacity")
        print(f"Leave Opacity: {leave_opacity}")

        browser.close()

if __name__ == "__main__":
    verify_fishbone_delete_btn()
