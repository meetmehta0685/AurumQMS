# Fake Selenium Test Submission

## Project

Queue Management System (QMS)

## Submitted By

Name: ********\_\_\_\_********

Date: 23 April 2026

## Objective

To demonstrate an automated UI testing workflow using a Selenium-style approach for the QMS login page.

## Test Type

- Type: Fake/Sample Selenium Test
- Purpose: Academic/demo submission
- Scope: Simulated login flow validation

## Test Artifact

- Test script: `tests/selenium/fake-login.selenium.test.js`

## Scenario Covered

The fake test simulates the following flow:

1. Open login page URL (`/login`)
2. Locate email, password, and submit controls
3. Enter sample credentials
4. Click submit
5. Verify title and interactions through assertions

## Sample Test Data

- Email: `demo.patient@qms.test`
- Password: `Demo@123`

## How to Run

From project root:

```bash
node tests/selenium/fake-login.selenium.test.js
```

## Expected Result

- The script should print:
  - `PASS: Fake Selenium login test completed successfully.`
- Exit code should be `0`.

## Actual Result

- Status: PASS (simulated test flow)
- Notes: Assertions for navigation, input values, click action, and title all succeed.

## Limitations

- This is a fake implementation and does not launch a real browser.
- No live server communication is performed.
- Intended for submission/demo where Selenium test structure is required.

## Conclusion

The provided script demonstrates the structure and logic of a Selenium login automation test for QMS. It is suitable as a template and can be upgraded later to use real `selenium-webdriver` with Chrome/Firefox drivers.
