import { supabase } from "../supabase-client";
import { UserFormData } from "./types";

// Sample user data that matches the database schema
export const sampleUsers: UserFormData[] = [
  {
    fullName: "John Doe",
    email: "john.doe@example.com",
    phoneNumber: "+1-555-0123",
    bio: "Software developer with 5 years of experience in React and Node.js",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    dateOfBirth: "1988-03-15",
    location: "San Francisco, CA"
  },
  {
    fullName: "Jane Smith",
    email: "jane.smith@example.com",
    phoneNumber: "+1-555-0124",
    bio: "UX designer passionate about user-centered design and accessibility",
    avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
    dateOfBirth: "1992-07-22",
    location: "New York, NY"
  },
  {
    fullName: "Mike Johnson",
    email: "mike.johnson@example.com",
    phoneNumber: "+1-555-0125",
    bio: "Product manager with a background in engineering and data analysis",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    dateOfBirth: "1985-11-08",
    location: "Austin, TX"
  },
  {
    fullName: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    phoneNumber: "+1-555-0126",
    bio: "Full-stack developer specializing in modern web technologies",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    dateOfBirth: "1990-05-12",
    location: "Seattle, WA"
  },
  {
    fullName: "David Brown",
    email: "david.brown@example.com",
    phoneNumber: "+1-555-0127",
    bio: "DevOps engineer with expertise in cloud infrastructure and automation",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    dateOfBirth: "1987-09-30",
    location: "Denver, CO"
  }
];
/**

 * Transforms UserFormData to database insert format
 * Handles field mapping and date format conversion
 */
function transformUserDataForDatabase(userData: UserFormData) {
  return {
    full_name: userData.fullName,
    email: userData.email,
    phone_number: userData.phoneNumber || null,
    bio: userData.bio || null,
    avatar_url: userData.avatarUrl || null,
    date_of_birth: userData.dateOfBirth || null,
    location: userData.location || null,
  };
}

/**
 * Seeds the database with initial user data
 * Only inserts data if the database is empty to avoid duplicates
 */
export async function seedDatabase(): Promise<{
  success: boolean;
  message: string;
  insertedCount?: number;
}> {
  try {
    console.log("🌱 Starting database seeding...");

    // Check if database already has data
    const { data: existingUsers, error: checkError } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (checkError) {
      console.error("❌ Error checking existing data:", checkError);
      return {
        success: false,
        message: `Failed to check existing data: ${checkError.message}`,
      };
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log("ℹ️ Database already contains data, skipping seed");
      return {
        success: true,
        message: "Database already contains data, no seeding needed",
        insertedCount: 0,
      };
    }

    // Transform sample data to database format
    const insertData = sampleUsers.map(transformUserDataForDatabase);

    // Insert sample data
    const { data, error } = await supabase
      .from("users")
      .insert(insertData)
      .select();

    if (error) {
      console.error("❌ Error seeding database:", error);
      return {
        success: false,
        message: `Failed to seed database: ${error.message}`,
      };
    }

    const insertedCount = data?.length || 0;
    console.log(`✅ Successfully seeded database with ${insertedCount} users`);

    return {
      success: true,
      message: `Successfully seeded database with ${insertedCount} users`,
      insertedCount,
    };
  } catch (error) {
    console.error("❌ Unexpected error during seeding:", error);
    return {
      success: false,
      message: `Unexpected error during seeding: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Clears all user data from the database
 * Use with caution - this will delete all users!
 */
export async function clearDatabase(): Promise<{
  success: boolean;
  message: string;
  deletedCount?: number;
}> {
  try {
    console.log("🗑️ Clearing database...");

    // Get count before deletion
    const { count: beforeCount, error: countError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("❌ Error counting users:", countError);
      return {
        success: false,
        message: `Failed to count users: ${countError.message}`,
      };
    }

    // Delete all users
    const { error } = await supabase
      .from("users")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all (using impossible condition)

    if (error) {
      console.error("❌ Error clearing database:", error);
      return {
        success: false,
        message: `Failed to clear database: ${error.message}`,
      };
    }

    console.log(`✅ Successfully cleared ${beforeCount || 0} users from database`);

    return {
      success: true,
      message: `Successfully cleared ${beforeCount || 0} users from database`,
      deletedCount: beforeCount || 0,
    };
  } catch (error) {
    console.error("❌ Unexpected error during clearing:", error);
    return {
      success: false,
      message: `Unexpected error during clearing: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Resets the database by clearing all data and re-seeding
 */
export async function resetDatabase(): Promise<{
  success: boolean;
  message: string;
  deletedCount?: number;
  insertedCount?: number;
}> {
  try {
    console.log("🔄 Resetting database...");

    // Clear existing data
    const clearResult = await clearDatabase();
    if (!clearResult.success) {
      return {
        success: false,
        message: `Failed to clear database: ${clearResult.message}`,
      };
    }

    // Seed with fresh data
    const seedResult = await seedDatabase();
    if (!seedResult.success) {
      return {
        success: false,
        message: `Failed to seed database: ${seedResult.message}`,
        deletedCount: clearResult.deletedCount,
      };
    }

    console.log("✅ Database reset completed successfully");

    return {
      success: true,
      message: `Database reset completed: cleared ${clearResult.deletedCount || 0} users, inserted ${seedResult.insertedCount || 0} users`,
      deletedCount: clearResult.deletedCount,
      insertedCount: seedResult.insertedCount,
    };
  } catch (error) {
    console.error("❌ Unexpected error during reset:", error);
    return {
      success: false,
      message: `Unexpected error during reset: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validates data integrity by checking field mappings and formats
 */
export async function validateDataIntegrity(): Promise<{
  success: boolean;
  message: string;
  issues?: string[];
}> {
  try {
    console.log("🔍 Validating data integrity...");

    const { data: users, error } = await supabase
      .from("users")
      .select("*");

    if (error) {
      return {
        success: false,
        message: `Failed to fetch users for validation: ${error.message}`,
      };
    }

    if (!users || users.length === 0) {
      return {
        success: true,
        message: "No users found in database",
      };
    }

    const issues: string[] = [];

    users.forEach((user, index) => {
      // Check required fields
      if (!user.id) issues.push(`User ${index + 1}: Missing ID`);
      if (!user.full_name) issues.push(`User ${index + 1}: Missing full_name`);
      if (!user.email) issues.push(`User ${index + 1}: Missing email`);

      // Check email format
      if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        issues.push(`User ${index + 1}: Invalid email format: ${user.email}`);
      }

      // Check date format for date_of_birth
      if (user.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(user.date_of_birth)) {
        issues.push(`User ${index + 1}: Invalid date format for date_of_birth: ${user.date_of_birth}`);
      }

      // Check timestamp formats
      if (user.created_at && isNaN(Date.parse(user.created_at))) {
        issues.push(`User ${index + 1}: Invalid created_at timestamp: ${user.created_at}`);
      }

      if (user.updated_at && isNaN(Date.parse(user.updated_at))) {
        issues.push(`User ${index + 1}: Invalid updated_at timestamp: ${user.updated_at}`);
      }
    });

    if (issues.length > 0) {
      console.warn("⚠️ Data integrity issues found:", issues);
      return {
        success: false,
        message: `Found ${issues.length} data integrity issues`,
        issues,
      };
    }

    console.log(`✅ Data integrity validation passed for ${users.length} users`);
    return {
      success: true,
      message: `Data integrity validation passed for ${users.length} users`,
    };
  } catch (error) {
    console.error("❌ Unexpected error during validation:", error);
    return {
      success: false,
      message: `Unexpected error during validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Export utility functions for development console
if (typeof window !== 'undefined') {
  (window as any).seedDatabase = seedDatabase;
  (window as any).clearDatabase = clearDatabase;
  (window as any).resetDatabase = resetDatabase;
  (window as any).validateDataIntegrity = validateDataIntegrity;
}