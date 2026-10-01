import { test, expect } from "@playwright/test";
const routes = [
  "dashboard",
  "customers",
  "agent-analysis",
  "products",
  "orders",
  "leads",
  "pipeline",
  "abandoned-carts",
  "analytics",
  "intelligence",
  "activity",
  "team",
  "settings",
  "notifications",
  "ai-agent",
];
test("all admin routes render without runtime errors and fit desktop", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of routes) {
    await page.goto(`/#/${route}`);
    await expect(page.locator("main h1").first()).toBeVisible();
    await expect(page.locator(".skeleton-view")).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
      )
      .toBe(true);
  }
  expect(errors).toEqual([]);
  await page.goto("/#/dashboard");
  await expect(page.getByText("Revenue overview")).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
});
test("customer filters, notes, assignment and transcript preserve context", async ({
  page,
}) => {
  await page.goto("/#/customers");
  await page.getByLabel("Search customers", { exact: true }).fill("Ruthvik");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: /Ruthvik Reddy ruthvik/ }).click();
  const profile = page.getByRole("dialog", {
    name: "Customer profile",
    exact: true,
  });
  await expect(
    profile.getByRole("heading", { name: "Ruthvik Reddy" }),
  ).toBeVisible();
  await profile.getByRole("button", { name: "Add note", exact: true }).click();
  await profile
    .getByLabel("Private customer note")
    .fill("Prefers the 12-pack; follow up after delivery.");
  await profile.getByRole("button", { name: "Save note", exact: true }).click();
  await expect(
    profile.getByText("Prefers the 12-pack; follow up after delivery."),
  ).toBeVisible();
  await profile.getByRole("button", { name: "Assign", exact: true }).click();
  await profile.getByLabel("Assigned salesperson").selectOption("s2");
  await profile
    .getByRole("button", { name: "Conversations", exact: true })
    .click();
  await profile
    .getByRole("button", { name: /Repeated product interest/ })
    .click();
  const transcript = page.getByRole("dialog", {
    name: "Conversation transcript",
    exact: true,
  });
  await expect(
    transcript.getByText(
      "I liked it last time. Is there a better price for a full pack?",
    ),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(transcript).toHaveCount(0);
  await expect(profile).toBeVisible();
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByLabel("Search customers", { exact: true }).fill("Ruthvik");
  await page.getByRole("button", { name: /Ruthvik Reddy ruthvik/ }).click();
  await expect(
    page.getByText("Prefers the 12-pack; follow up after delivery."),
  ).toBeVisible();
});
test("pipeline movement updates customer stage and survives reload", async ({
  page,
}) => {
  await page.goto("/#/pipeline");
  await page
    .getByLabel("Move Coastal Cafe", { exact: true })
    .selectOption("Call Scheduled");
  const column = page.locator(".pipeline-column").filter({
    has: page.getByRole("heading", { name: "Call Scheduled", exact: true }),
  });
  await expect(
    column.getByRole("button", { name: /Coastal Cafe/ }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByLabel("Move Coastal Cafe", { exact: true }),
  ).toHaveValue("Call Scheduled");
  await page.goto("/#/leads");
  await expect(
    page.getByLabel("Stage for Meera Nair", { exact: true }),
  ).toHaveValue("Call Scheduled");
});
test("create a product, preview the GLB and update order fulfillment", async ({
  page,
}) => {
  await page.goto("/#/products");
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  await page.getByLabel("Product name", { exact: true }).fill("Pear Sparkle");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A crisp pear soda.");
  await page.getByLabel("Price · INR", { exact: true }).fill("1599");
  await page.getByLabel("Pack size", { exact: true }).fill("12 × 250 ml");
  await page.getByLabel("SKU", { exact: true }).fill("FZ-PEAR-12");
  await page
    .getByRole("button", { name: "Create product", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Pear Sparkle 12/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "View Yuzu Citrus", exact: true })
    .click();
  await expect(page.locator(".model-canvas canvas")).toBeVisible();
  await expect(page.locator(".model-fallback")).toHaveCount(0, {
    timeout: 15000,
  });
  await page.screenshot({
    path: "test-results/product-3d.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await page.goto("/#/orders");
  await page.getByRole("button", { name: "#FZ-2048", exact: true }).click();
  await page.getByLabel("Order fulfillment status").selectOption("Shipped");
  await expect(page.locator(".order-meta .badge")).toHaveText("Shipped");
  await page.reload();
  await expect(page.locator("tr").filter({ hasText: "FZ-2048" })).toContainText(
    "Shipped",
  );
});
test("live event honors scoring settings and updates the ledger", async ({
  page,
}) => {
  await page.goto("/#/settings");
  await page.getByRole("button", { name: "Lead Scoring", exact: true }).click();
  await page.getByLabel("Product view weight").fill("7");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.goto("/#/activity");
  await page
    .getByRole("button", { name: "Play live demo", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        await page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("fizzi-admin-v1")!).customers.find(
              (c: any) => c.userId === "ruthvik",
            ).leadScore,
        ),
      { timeout: 15000 },
    )
    .toBe(89);
  await page
    .getByRole("button", { name: "Pause live demo", exact: true })
    .click();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fizzi-admin-v1")!),
  );
  expect(stored.scoreHistory.at(-1).delta).toBe(7);
  expect(stored.events[0].impact).toBe(7);
  expect(stored.customers[0].productViews).toBe(15);
});
test("recovery requests and notification read status persist", async ({
  page,
}) => {
  await page.goto("/#/abandoned-carts");
  await page
    .getByRole("button", { name: "Recover", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Queue demo recovery", exact: true })
    .click();
  await expect(page.locator("tbody tr").first()).toContainText("Queued");
  await page.goto("/#/notifications");
  await page
    .getByRole("button", { name: "Mark all as read", exact: true })
    .click();
  await page.getByRole("button", { name: "Unread", exact: true }).click();
  await expect(page.getByText("You’re all caught up")).toBeVisible();
});
test("global search and responsive pages stay within the viewport", async ({
  page,
}) => {
  await page.goto("/#/dashboard");
  await page.keyboard.press("Control+k");
  await page
    .getByPlaceholder("Customers, orders, products, leads…")
    .fill("Ruthvik");
  await page
    .locator(".search-results button")
    .filter({ hasText: "Customer" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ruthvik Reddy" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  for (const width of [1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "dashboard",
      "customers",
      "agent-analysis",
      "pipeline",
      "analytics",
      "settings",
    ]) {
      await page.goto(`/#/${route}`);
      await expect(page.locator("main h1")).toBeVisible();
      await expect
        .poll(
          () =>
            page.evaluate(
              () =>
                document.documentElement.scrollWidth <= window.innerWidth + 1,
            ),
          { message: `${route} at ${width}` },
        )
        .toBe(true);
    }
  }
  await page.goto("/#/dashboard");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page.getByRole("link", { name: "Customers", exact: true }).click();
  await expect(
    page.getByLabel("Search customers", { exact: true }),
  ).toBeVisible();
});
