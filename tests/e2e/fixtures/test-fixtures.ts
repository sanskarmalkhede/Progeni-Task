import { test as base } from '@playwright/test';
import { UserProfilePage } from '../pages/user-profile-page';
import { TestDataManager, TestUser } from '../utils/test-helpers';

/**
 * Extended test fixtures with page objects and test data
 */
type TestFixtures = {
  userProfilePage: UserProfilePage;
  testUser: TestUser;
  multipleTestUsers: TestUser[];
};

/**
 * Extend Playwright test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  /**
   * User Profile Page fixture
   */
  userProfilePage: async ({ page }, use) => {
    const userProfilePage = new UserProfilePage(page);
    // Don't navigate here since beforeEach handles it
    await use(userProfilePage);
  },

  /**
   * Single test user fixture
   */
  testUser: async (_, use) => {
    const testUser = TestDataManager.createUniqueTestUser('E2E Test');
    await use(testUser);
  },

  /**
   * Multiple test users fixture
   */
  multipleTestUsers: async (_, use) => {
    const users = [
      TestDataManager.createUniqueTestUser('User 1'),
      TestDataManager.createUniqueTestUser('User 2'),
      TestDataManager.createUniqueTestUser('User 3'),
    ];
    await use(users);
  },
});

/**
 * Export expect for consistency
 */
export { expect } from '@playwright/test';

/**
 * Test hooks for setup and teardown
 */
export class TestHooks {
  /**
   * Setup test environment before each test
   */
  static async beforeEach(page: any) {
    // Clear any existing data or state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Cleanup after each test
   */
  static async afterEach(page: any) {
    // Take screenshot on failure (handled by Playwright config)
    // Clean up any test data if needed
  }

  /**
   * Setup test suite
   */
  static async beforeAll() {
    // Global setup if needed
    console.log('Starting E2E test suite...');
  }

  /**
   * Cleanup test suite
   */
  static async afterAll() {
    // Global cleanup if needed
    console.log('E2E test suite completed.');
  }
}

/**
 * Common test utilities
 */
export class TestUtils {
  /**
   * Wait for application to be ready
   */
  static async waitForAppReady(page: any) {
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('body', { state: 'visible' });
  }

  /**
   * Mock API responses if needed
   */
  static async mockApiResponses(page: any) {
    // Add API mocking if needed for isolated testing
  }

  /**
   * Generate test data for bulk operations
   */
  static generateBulkTestData(count: number): TestUser[] {
    return Array.from({ length: count }, (_, index) => 
      TestDataManager.createUniqueTestUser(`Bulk User ${index + 1}`)
    );
  }
}