import { Page, expect } from '@playwright/test';

/**
 * Test data interface for user profiles
 */
export interface TestUser {
  fullName: string;
  email: string;
  location: string;
  bio: string;
}

/**
 * Sample test users for E2E testing
 */
export const testUsers: TestUser[] = [
  {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    location: 'New York, NY',
    bio: 'Software developer with 5 years of experience in React and TypeScript.'
  },
  {
    fullName: 'Jane Smith',
    email: 'jane.smith@example.com',
    location: 'San Francisco, CA',
    bio: 'UX designer passionate about creating intuitive user experiences.'
  },
  {
    fullName: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    location: 'Austin, TX',
    bio: 'Full-stack developer specializing in modern web technologies.'
  }
];

/**
 * Base page object for common functionality
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Wait for the page to load completely
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `tests/screenshots/${name}.png` });
  }

  /**
   * Wait for an element to be visible
   */
  async waitForElement(selector: string, timeout = 5000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Fill form field with validation
   */
  async fillField(selector: string, value: string) {
    await this.page.fill(selector, value);
    await expect(this.page.locator(selector)).toHaveValue(value);
  }

  /**
   * Click element with wait
   */
  async clickElement(selector: string) {
    await this.page.click(selector);
  }

  /**
   * Get text content from element
   */
  async getTextContent(selector: string): Promise<string> {
    return await this.page.textContent(selector) || '';
  }

  /**
   * Check if element exists
   */
  async elementExists(selector: string): Promise<boolean> {
    return await this.page.locator(selector).count() > 0;
  }

  /**
   * Wait for element to disappear
   */
  async waitForElementToDisappear(selector: string, timeout = 5000) {
    await this.page.waitForSelector(selector, { state: 'hidden', timeout });
  }
}

/**
 * Utility functions for test data management
 */
export class TestDataManager {
  /**
   * Generate random test user data
   */
  static generateRandomUser(): TestUser {
    const randomId = Math.floor(Math.random() * 10000);
    return {
      fullName: `Test User ${randomId}`,
      email: `testuser${randomId}@example.com`,
      location: `Test City ${randomId}`,
      bio: `This is a test bio for user ${randomId} created during E2E testing.`
    };
  }

  /**
   * Get a specific test user by index
   */
  static getTestUser(index: number): TestUser {
    return testUsers[index % testUsers.length];
  }

  /**
   * Create a unique test user for each test
   */
  static createUniqueTestUser(testName: string): TestUser {
    const timestamp = Date.now();
    return {
      fullName: `${testName} User ${timestamp}`,
      email: `${testName.toLowerCase().replace(/\s+/g, '')}${timestamp}@example.com`,
      location: `${testName} City`,
      bio: `Test user created for ${testName} at ${new Date().toISOString()}`
    };
  }
}

/**
 * Common assertions for user profile testing
 */
export class UserProfileAssertions {
  constructor(private page: Page) {}

  /**
   * Assert that user profile data is displayed correctly
   */
  async assertUserProfileDisplayed(user: TestUser) {
    await expect(this.page.getByText(user.fullName)).toBeVisible();
    await expect(this.page.getByText(user.email)).toBeVisible();
    await expect(this.page.getByText(user.location)).toBeVisible();
    await expect(this.page.getByText(user.bio)).toBeVisible();
  }

  /**
   * Assert that form fields contain expected values
   */
  async assertFormFieldsPopulated(user: TestUser) {
    await expect(this.page.locator('input[name="fullName"]')).toHaveValue(user.fullName);
    await expect(this.page.locator('input[name="email"]')).toHaveValue(user.email);
    await expect(this.page.locator('input[name="location"]')).toHaveValue(user.location);
    await expect(this.page.locator('textarea[name="bio"]')).toHaveValue(user.bio);
  }

  /**
   * Assert that search results contain expected user
   */
  async assertSearchResultsContainUser(user: TestUser) {
    await expect(this.page.getByText(user.fullName)).toBeVisible();
  }

  /**
   * Assert that pagination is working correctly
   */
  async assertPaginationVisible() {
    await expect(this.page.locator('[data-testid="pagination"]')).toBeVisible();
  }

  /**
   * Assert that QR code modal is displayed
   */
  async assertQRCodeModalVisible() {
    await expect(this.page.locator('[data-testid="qr-modal"]')).toBeVisible();
  }
}