import { expect, test } from "@playwright/test";
import { API } from "../helpers";
import { adminLogin } from "./admin-helpers";

test("sets up a flash sale that the store's home content then includes", async ({
  page,
  request,
}) => {
  await adminLogin(page, "/content");
  // The flash sale card on the content page.
  const section = page
    .getByRole("heading", { name: "Flash sale", exact: true })
    .locator("xpath=ancestor::div[.//button[normalize-space()='Save flash sale']][1]");
  const switchOn = section.getByLabel("Show the flash sale");
  const wasOn = await switchOn.isChecked();
  // The checkbox is visually hidden behind the switch, so click its label, as a person would.
  const setSwitch = async (on: boolean) => {
    if ((await switchOn.isChecked()) !== on) await section.getByText("Show the flash sale").click();
    await expect(switchOn).toBeChecked({ checked: on });
  };

  // An end time in the past is refused.
  await setSwitch(true);
  await section.getByLabel("Title", { exact: true }).fill("E2E weekend sale");
  await section.getByLabel("Ends at").fill("2020-01-01T10:00");
  await section.getByRole("button", { name: "Save flash sale" }).click();
  await expect(page.getByText("Choose an end time in the future")).toBeVisible();

  // Tomorrow, same time.
  const tomorrow = new Date(Date.now() + 86_400_000);
  const local = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
  await section.getByLabel("Ends at").fill(local);
  await section.getByLabel("Subtitle (optional)").fill("Up to 30% off");
  await section.getByRole("button", { name: "Save flash sale" }).click();
  await expect(page.getByText(/Flash sale saved/)).toBeVisible();

  const home = await (await request.get(`${API}/cms/home`)).json();
  expect(home.data.flashSale).toMatchObject({
    title: "E2E weekend sale",
    subtitle: "Up to 30% off",
  });

  // Switch it back off (or leave it as it was before the test).
  if (!wasOn) {
    await setSwitch(false);
    await section.getByRole("button", { name: "Save flash sale" }).click();
    await expect(page.getByText(/Flash sale saved/).last()).toBeVisible();
    const after = await (await request.get(`${API}/cms/home`)).json();
    expect(after.data.flashSale).toBeNull();
  }
});
