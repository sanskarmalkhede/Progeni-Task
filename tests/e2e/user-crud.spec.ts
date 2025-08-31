import { test } from './fixtures/test-fixtures';
import { TestDataManager } from './utils/test-helpers';

test.describe('User CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page first, then clear storage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should create a new user profile successfully', async ({ 
    userProfilePage, 
    testUser 
  }) => {
    // Click the "New Profile" button to open the form
    await userProfilePage.clickElement('button:has-text("New Profile")');
    
    // Fill out the user form
    await userProfilePage.fillUserForm(testUser);
    
    // Submit the form
    await userProfilePage.clickElement('button:has-text("Save")');
    await userProfilePage.waitForPageLoad();
    
    // Verify the user appears in the list
    await userProfilePage.verifyUserDisplayed(testUser);
  });

  test('should edit an existing user profile successfully', async ({ 
    userProfilePage, 
    testUser 
  }) => {
    // First create a user to edit
    await userProfilePage.createUser(testUser);
    
    // Create updated user data
    const updatedUser = TestDataManager.createUniqueTestUser('Updated User');
    
    // Edit the user
    await userProfilePage.clickEditButtonForUser(testUser.fullName);
    await userProfilePage.fillUserForm(updatedUser);
    await userProfilePage.clickElement('button:has-text("Save")');
    await userProfilePage.waitForPageLoad();
    
    // Verify the updated user data is displayed
    await userProfilePage.verifyUserDisplayed(updatedUser);
    await userProfilePage.verifyUserNotDisplayed(testUser);
  });

  test('should delete a user profile successfully', async ({ 
    userProfilePage, 
    testUser 
  }) => {
    // First create a user to delete
    await userProfilePage.createUser(testUser);
    
    // Delete the user
    await userProfilePage.clickDeleteButtonForUser(testUser.fullName);
    await userProfilePage.confirmDeletion();
    await userProfilePage.waitForPageLoad();
    
    // Verify the user is no longer displayed
    await userProfilePage.verifyUserNotDisplayed(testUser);
  });

  test('should persist user data after page refresh', async ({ 
    userProfilePage, 
    testUser 
  }) => {
    // Create a user
    await userProfilePage.createUser(testUser);
    await userProfilePage.verifyUserDisplayed(testUser);
    
    // Refresh the page
    await userProfilePage.pageInstance.reload();
    await userProfilePage.waitForPageLoad();
    
    // Verify user data persists after refresh
    await userProfilePage.verifyUserDisplayed(testUser);
  });
});