import { supabase } from "../supabase-client";
import { User, UserFormData } from "./types";

/**
 * Migrates data from localStorage format to database format
 * Handles field mapping and data type conversions
 */
export function migrateUserDataFormat(localStorageUser: any): UserFormData {
  // Handle various possible localStorage formats
  const migrated: UserFormData = {
    fullName: localStorageUser.fullName || localStorageUser.full_name || localStorageUser.name || "",
    email: localStorageUser.email || "",
    phoneNumber: localStorageUser.phoneNumber || localStorageUser.phone_number || localStorageUser.phone || "",
    bio: localStorageUser.bio || localStorageUser.description || "",
    avatarUrl: localStorageUser.avatarUrl || localStorageUser.avatar_url || localStorageUser.avatar || "",
    dateOfBirth: localStorageUser.dateOfBirth || localStorageUser.date_of_birth || localStorageUser.birthDate || "",
    location: localStorageUser.location || localStorageUser.address || "",
  };

  // Ensure date format is correct (YYYY-MM-DD)
  if (migrated.dateOfBirth) {
    migrated.dateOfBirth = convertDateFormat(migrated.dateOfBirth);
  }

  return migrated;
}

/**
 * Converts various date formats to YYYY-MM-DD format
 * Handles common date formats that might exist in localStorage
 */
export function convertDateFormat(dateString: string): string {
  if (!dateString) return "";

  try {
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const date = new Date(dateString + 'T00:00:00');
      if (!isNaN(date.getTime())) {
        return dateString;
      }
    }

    // Handle various date formats
    let date: Date;
    
    // Try parsing common formats
    if (dateString.includes('/')) {
      // Handle MM/DD/YYYY or DD/MM/YYYY formats
      const parts = dateString.split('/');
      if (parts.length === 3) {
        // Assume MM/DD/YYYY format (US standard)
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        // Validate ranges
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year > 1900) {
          date = new Date(year, month - 1, day);
        } else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }
    } else {
      // Try direct parsing for formats like "January 1, 1990"
      date = new Date(dateString);
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date format: ${dateString}`);
      return "";
    }

    // Return in YYYY-MM-DD format using local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn(`Error converting date format: ${dateString}`, error);
    return "";
  }
}

/**
 * Migrates users from localStorage to the database
 * Reads from localStorage and inserts into Supabase
 */
export async function migrateFromLocalStorage(localStorageKey: string = "users"): Promise<{
  success: boolean;
  message: string;
  migratedCount?: number;
  errors?: string[];
}> {
  try {
    console.log(`🔄 Starting migration from localStorage key: ${localStorageKey}`);

    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return {
        success: false,
        message: "localStorage is not available in this environment",
      };
    }

    // Get data from localStorage
    const localStorageData = localStorage.getItem(localStorageKey);
    if (!localStorageData) {
      return {
        success: true,
        message: `No data found in localStorage key: ${localStorageKey}`,
        migratedCount: 0,
      };
    }

    let localUsers: any[];
    try {
      localUsers = JSON.parse(localStorageData);
    } catch (parseError) {
      return {
        success: false,
        message: `Failed to parse localStorage data: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`,
      };
    }

    if (!Array.isArray(localUsers)) {
      return {
        success: false,
        message: "localStorage data is not an array of users",
      };
    }

    if (localUsers.length === 0) {
      return {
        success: true,
        message: "No users found in localStorage",
        migratedCount: 0,
      };
    }

    console.log(`📋 Found ${localUsers.length} users in localStorage`);

    // Migrate each user
    const migratedUsers: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < localUsers.length; i++) {
      try {
        const localUser = localUsers[i];
        const migratedUser = migrateUserDataFormat(localUser);

        // Validate required fields
        if (!migratedUser.fullName) {
          errors.push(`User ${i + 1}: Missing fullName`);
          continue;
        }
        if (!migratedUser.email) {
          errors.push(`User ${i + 1}: Missing email`);
          continue;
        }

        // Transform to database format
        const dbUser = {
          full_name: migratedUser.fullName,
          email: migratedUser.email,
          phone_number: migratedUser.phoneNumber || null,
          bio: migratedUser.bio || null,
          avatar_url: migratedUser.avatarUrl || null,
          date_of_birth: migratedUser.dateOfBirth || null,
          location: migratedUser.location || null,
        };

        migratedUsers.push(dbUser);
      } catch (error) {
        errors.push(`User ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (migratedUsers.length === 0) {
      return {
        success: false,
        message: "No valid users could be migrated",
        errors,
      };
    }

    // Insert migrated users into database
    const { data, error } = await supabase
      .from("users")
      .insert(migratedUsers)
      .select();

    if (error) {
      console.error("❌ Error inserting migrated users:", error);
      return {
        success: false,
        message: `Failed to insert migrated users: ${error.message}`,
        errors,
      };
    }

    const insertedCount = data?.length || 0;
    console.log(`✅ Successfully migrated ${insertedCount} users from localStorage`);

    return {
      success: true,
      message: `Successfully migrated ${insertedCount} users from localStorage`,
      migratedCount: insertedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error("❌ Unexpected error during migration:", error);
    return {
      success: false,
      message: `Unexpected error during migration: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Backs up current database data to localStorage
 * Useful for creating a backup before migration
 */
export async function backupToLocalStorage(localStorageKey: string = "users_backup"): Promise<{
  success: boolean;
  message: string;
  backedUpCount?: number;
}> {
  try {
    console.log(`💾 Creating backup to localStorage key: ${localStorageKey}`);

    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return {
        success: false,
        message: "localStorage is not available in this environment",
      };
    }

    // Get all users from database
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      return {
        success: false,
        message: `Failed to fetch users for backup: ${error.message}`,
      };
    }

    if (!users || users.length === 0) {
      return {
        success: true,
        message: "No users found to backup",
        backedUpCount: 0,
      };
    }

    // Transform to frontend format
    const backupData = users.map(user => ({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phoneNumber: user.phone_number || "",
      bio: user.bio || "",
      avatarUrl: user.avatar_url || "",
      dateOfBirth: user.date_of_birth || "",
      location: user.location || "",
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));

    // Save to localStorage
    localStorage.setItem(localStorageKey, JSON.stringify(backupData));

    console.log(`✅ Successfully backed up ${users.length} users to localStorage`);

    return {
      success: true,
      message: `Successfully backed up ${users.length} users to localStorage`,
      backedUpCount: users.length,
    };
  } catch (error) {
    console.error("❌ Unexpected error during backup:", error);
    return {
      success: false,
      message: `Unexpected error during backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Tests the migration process with sample data
 * Creates test data in localStorage and migrates it
 */
export async function testMigration(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    console.log("🧪 Testing migration process...");

    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return {
        success: false,
        message: "localStorage is not available in this environment",
      };
    }

    const testKey = "test_migration_users";
    
    // Create test data in various formats to test migration robustness
    const testUsers = [
      {
        // Standard format
        fullName: "Test User 1",
        email: "test1@example.com",
        phoneNumber: "+1-555-0001",
        bio: "Test user for migration",
        avatarUrl: "https://example.com/avatar1.jpg",
        dateOfBirth: "1990-01-01",
        location: "Test City, TC"
      },
      {
        // Alternative field names
        full_name: "Test User 2",
        email: "test2@example.com",
        phone_number: "+1-555-0002",
        description: "Another test user",
        avatar_url: "https://example.com/avatar2.jpg",
        date_of_birth: "1985-06-15",
        address: "Another Test City, TC"
      },
      {
        // Mixed format with different date format
        name: "Test User 3",
        email: "test3@example.com",
        phone: "+1-555-0003",
        bio: "Third test user",
        avatar: "https://example.com/avatar3.jpg",
        birthDate: "June 15, 1992",
        location: "Third Test City, TC"
      }
    ];

    // Save test data to localStorage
    localStorage.setItem(testKey, JSON.stringify(testUsers));

    // Perform migration
    const migrationResult = await migrateFromLocalStorage(testKey);

    // Clean up test data
    localStorage.removeItem(testKey);

    // If migration was successful, clean up database test data
    if (migrationResult.success && migrationResult.migratedCount && migrationResult.migratedCount > 0) {
      // Delete test users from database
      await supabase
        .from("users")
        .delete()
        .in("email", ["test1@example.com", "test2@example.com", "test3@example.com"]);
    }

    return {
      success: migrationResult.success,
      message: `Migration test completed: ${migrationResult.message}`,
      details: migrationResult,
    };
  } catch (error) {
    console.error("❌ Unexpected error during migration test:", error);
    return {
      success: false,
      message: `Unexpected error during migration test: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Export utility functions for development console
if (typeof window !== 'undefined') {
  (window as any).migrateFromLocalStorage = migrateFromLocalStorage;
  (window as any).backupToLocalStorage = backupToLocalStorage;
  (window as any).testMigration = testMigration;
  (window as any).convertDateFormat = convertDateFormat;
}