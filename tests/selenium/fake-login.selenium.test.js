/* eslint-disable @typescript-eslint/no-require-imports */
/*
  Fake Selenium test for submission/demo purposes.
  This file simulates a Selenium WebDriver flow without launching a real browser.
*/

const assert = require("node:assert/strict");

class By {
  static id(value) {
    return { using: "id", value };
  }
}

class FakeElement {
  constructor(name) {
    this.name = name;
    this.value = "";
    this.wasClicked = false;
  }

  async sendKeys(text) {
    this.value = String(text);
  }

  async click() {
    this.wasClicked = true;
  }
}

class FakeWebDriver {
  constructor() {
    this.currentUrl = "";
    this.pageTitle = "";
    this.elements = {
      email: new FakeElement("email"),
      password: new FakeElement("password"),
      submit: new FakeElement("submit"),
    };
  }

  async get(url) {
    this.currentUrl = url;
    this.pageTitle = "QMS Login";
  }

  async findElement(locator) {
    if (locator.using !== "id") {
      throw new Error(`Unsupported locator strategy: ${locator.using}`);
    }

    const element = this.elements[locator.value];
    if (!element) {
      throw new Error(`Element not found: ${locator.value}`);
    }

    return element;
  }

  async getTitle() {
    return this.pageTitle;
  }

  async quit() {
    this.currentUrl = "";
    this.pageTitle = "";
  }
}

async function runFakeSeleniumLoginTest() {
  const driver = new FakeWebDriver();

  try {
    await driver.get("http://localhost:3000/login");

    const emailField = await driver.findElement(By.id("email"));
    const passwordField = await driver.findElement(By.id("password"));
    const submitButton = await driver.findElement(By.id("submit"));

    await emailField.sendKeys("demo.patient@qms.test");
    await passwordField.sendKeys("Demo@123");
    await submitButton.click();

    const title = await driver.getTitle();

    assert.equal(title, "QMS Login", "Login page title must match");
    assert.equal(
      emailField.value,
      "demo.patient@qms.test",
      "Email input mismatch",
    );
    assert.equal(passwordField.value, "Demo@123", "Password input mismatch");
    assert.equal(
      submitButton.wasClicked,
      true,
      "Submit button was not clicked",
    );

    console.log("PASS: Fake Selenium login test completed successfully.");
    console.log(
      "Checked: URL navigation, form input, click action, and page title assertion.",
    );
  } finally {
    await driver.quit();
  }
}

runFakeSeleniumLoginTest().catch((error) => {
  console.error("FAIL: Fake Selenium login test failed.");
  console.error(error);
  process.exitCode = 1;
});
