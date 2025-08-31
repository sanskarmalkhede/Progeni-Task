import { Page, expect } from '@playwright/test';
import { BasePage, TestUser } from '../utils/test-helpers';

/**
 * Page Object Model for User Profile management
 */
export class UserProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Get the page instance for direct access when needed
   */
  get pageInstance(): Page {
    return this.page;
  }

  // Selectors
  private readonly selectors = {
    // Form elements
    fullNameInput: 'input[name="fullName"]',
    emailInput: 'input[name="email"]',
    locationInput: 'input[name="location"]',
    bioTextarea: 'textarea[name="bio"]',
    
    // Buttons
    addUserButton: 'button:has-text("New Profile")',
    saveButton: 'button:has-text("Save")',
    editButton: 'button:has-text("Edit")',
    deleteButton: 'button:has-text("Delete")',
    cancelButton: 'button:has-text("Cancel")',
    
    // Search and filter
    searchInput: 'input[placeholder*="Search"]',
    searchButton: 'button:has-text("Search")',
    clearSearchButton: 'button:has-text("Clear")',
    
    // User cards and lists
    userCard: '[data-testid="user-card"]',
    userList: '[data-testid="user-list"]',
    emptyState: '[data-testid="empty-state"]',
    
    // QR Code elements
    qrCodeButton: 'button:has-text("QR Code")',
    qrModal: '[data-testid="qr-modal"]',
    qrCodeImage: '[data-testid="qr-code"]',
    scanQRButton: 'button:has-text("Scan QR")',
    
    // Pagination
    pagination: '[data-testid="pagination"]',
    nextPageButton: 'button:has-text("Next")',
    prevPageButton: 'button:has-text("Previous")',
    pageNumber: '[data-testid="page-number"]',
    
    // Modals and dialogs
    confirmDialog: '[data-testid="confirm-dialog"]',
    confirmYesButton: 'button:has-text("Delete")',
    confirmNoButton: 'button:has-text("Cancel")',
  };

  /**
   * Navigate to the user profile page
   */
  async goto() {
    await this.page.goto('/');
    await this.waitForPageLoad();
  }

  /**
   * Fill user form with provided data
   */
  async fillUserForm(user: TestUser) {
    await this.fillField(this.selectors.fullNameInput, user.fullName);
    await this.fillField(this.selectors.emailInput, user.email);
    await this.fillField(this.selectors.locationInput, user.location);
    await this.fillField(this.selectors.bioTextarea, user.bio);
  }

  /**
   * Create a new user profile
   */
  async createUser(user: TestUser) {
    await this.clickElement(this.selectors.addUserButton);
    await this.fillUserForm(user);
    await this.clickElement(this.selectors.saveButton);
    await this.waitForPageLoad();
  }

  /**
   * Edit an existing user profile
   */
  async editUser(originalUser: TestUser, updatedUser: TestUser) {
    await this.searchForUser(originalUser.fullName);
    await this.clickEditButtonForUser(originalUser.fullName);
    await this.fillUserForm(updatedUser);
    await this.clickElement(this.selectors.saveButton);
    await this.waitForPageLoad();
  }

  /**
   * Delete a user profile
   */
  async deleteUser(user: TestUser) {
    await this.searchForUser(user.fullName);
    await this.clickDeleteButtonForUser(user.fullName);
    await this.confirmDeletion();
    await this.waitForPageLoad();
  }

  /**
   * Search for a user by name
   */
  async searchForUser(searchTerm: string) {
    await this.fillField(this.selectors.searchInput, searchTerm);
    await this.clickElement(this.selectors.searchButton);
    await this.waitForPageLoad();
  }

  /**
   * Clear search results
   */
  async clearSearch() {
    await this.clickElement(this.selectors.clearSearchButton);
    await this.waitForPageLoad();
  }

  /**
   * Click edit button for a specific user
   */
  async clickEditButtonForUser(userName: string) {
    // Look for user card containing the user name and click its edit button
    const userCard = this.page.locator('.bg-white.rounded-xl').filter({ hasText: userName });
    await userCard.locator('button[title="Edit profile"]').click();
  }

  /**
   * Click delete button for a specific user
   */
  async clickDeleteButtonForUser(userName: string) {
    // Look for user card containing the user name and click its delete button
    const userCard = this.page.locator('.bg-white.rounded-xl').filter({ hasText: userName });
    await userCard.locator('button[title="Delete profile"]').click();
  }

  /**
   * Confirm deletion in dialog
   */
  async confirmDeletion() {
    // Wait for confirmation modal and click Delete button
    await this.page.waitForSelector('text=Delete Profile');
    await this.clickElement(this.selectors.confirmYesButton);
  }

  /**
   * Cancel deletion in dialog
   */
  async cancelDeletion() {
    // Wait for confirmation modal and click Cancel button
    await this.page.waitForSelector('text=Delete Profile');
    await this.clickElement(this.selectors.confirmNoButton);
  }

  /**
   * Generate QR code for a user
   */
  async generateQRCodeForUser(userName: string) {
    const userCard = this.page.locator('.bg-white.rounded-xl').filter({ hasText: userName });
    await userCard.locator('button[title="Generate QR Code"]').click();
    await this.waitForElement(this.selectors.qrModal);
  }

  /**
   * Close QR code modal
   */
  async closeQRCodeModal() {
    await this.page.keyboard.press('Escape');
    await this.waitForElementToDisappear(this.selectors.qrModal);
  }

  /**
   * Navigate to next page
   */
  async goToNextPage() {
    await this.clickElement(this.selectors.nextPageButton);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to previous page
   */
  async goToPreviousPage() {
    await this.clickElement(this.selectors.prevPageButton);
    await this.waitForPageLoad();
  }

  /**
   * Get current page number
   */
  async getCurrentPageNumber(): Promise<number> {
    const pageText = await this.getTextContent(this.selectors.pageNumber);
    return parseInt(pageText) || 1;
  }

  /**
   * Check if user exists in the current view
   */
  async userExists(userName: string): Promise<boolean> {
    return await this.elementExists(`.bg-white.rounded-xl:has-text("${userName}")`);
  }

  /**
   * Get total number of users displayed
   */
  async getUserCount(): Promise<number> {
    return await this.page.locator('.bg-white.rounded-xl').count();
  }

  /**
   * Check if empty state is displayed
   */
  async isEmptyStateDisplayed(): Promise<boolean> {
    // Check for empty state text or no user cards
    const userCount = await this.getUserCount();
    return userCount === 0;
  }

  /**
   * Check if pagination is visible
   */
  async isPaginationVisible(): Promise<boolean> {
    return await this.elementExists(this.selectors.pagination);
  }

  /**
   * Verify user data is displayed correctly
   */
  async verifyUserDisplayed(user: TestUser) {
    await expect(this.page.getByText(user.fullName)).toBeVisible();
    await expect(this.page.getByText(user.email)).toBeVisible();
    await expect(this.page.getByText(user.location)).toBeVisible();
  }

  /**
   * Verify user is not displayed
   */
  async verifyUserNotDisplayed(user: TestUser) {
    await expect(this.page.getByText(user.fullName)).not.toBeVisible();
  }

  /**
   * Wait for user list to load
   */
  async waitForUserListToLoad() {
    await this.waitForPageLoad();
  }
}