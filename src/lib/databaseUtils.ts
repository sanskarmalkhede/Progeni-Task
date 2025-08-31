import { seedDatabase, clearDatabase, resetDatabase, validateDataIntegrity } from "./seedData";
import { migrateFromLocalStorage, backupToLocalStorage, testMigration } from "./dataMigration";
import { supabase } from "../supabase-client";

/**
 * Comprehensive database utility for managing user data
 * Provides seeding, migration, and maintenance functions
 */
export class DatabaseManager {
  /**
   * Initializes the database with sample data if empty
   * Safe to run multiple times - won't duplicate data
   */
  static async initialize(): Promise<{
    success: boolean;
    message: string;
    actions?: string[];
  }> {
    try {
      console.log("🚀 Initializing database...");
      const actions: string[] = [];

      // Check database connection
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .limit(1);

      if (error) {
        return {
          success: false,
          message: `Database connection failed: ${error.message}`,
        };
      }

      actions.push("✅ Database connection verified");

      // Check if database is empty
      if (!data || data.length === 0) {
        console.log("📋 Database is empty, seeding with initial data...");
        const seedResult = await seedDatabase();
        
        if (seedResult.success) {
          actions.push(`✅ Seeded database with ${seedResult.insertedCount} users`);
        } else {
          return {
            success: false,
            message: `Failed to seed database: ${seedResult.message}`,
            actions,
          };
        }
      } else {
        actions.push("ℹ️ Database already contains data");
      }

      // Validate data integrity
      const validationResult = await validateDataIntegrity();
      if (validationResult.success) {
        actions.push("✅ Data integrity validation passed");
      } else {
        actions.push(`⚠️ Data integrity issues found: ${validationResult.message}`);
      }

      return {
        success: true,
        message: "Database initialization completed successfully",
        actions,
      };
    } catch (error) {
      console.error("❌ Error during database initialization:", error);
      return {
        success: false,
        message: `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Gets database statistics and health information
   */
  static async getStats(): Promise<{
    success: boolean;
    message: string;
    stats?: {
      totalUsers: number;
      recentUsers: number;
      oldestUser?: string;
      newestUser?: string;
    };
  }> {
    try {
      console.log("📊 Gathering database statistics...");

      // Get total count
      const { count: totalUsers, error: countError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      if (countError) {
        return {
          success: false,
          message: `Failed to get user count: ${countError.message}`,
        };
      }

      // Get recent users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentUsers, error: recentError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString());

      if (recentError) {
        return {
          success: false,
          message: `Failed to get recent user count: ${recentError.message}`,
        };
      }

      // Get oldest and newest users
      const { data: oldestUser, error: oldestError } = await supabase
        .from("users")
        .select("full_name, created_at")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      const { data: newestUser, error: newestError } = await supabase
        .from("users")
        .select("full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const stats = {
        totalUsers: totalUsers || 0,
        recentUsers: recentUsers || 0,
        oldestUser: oldestUser && !oldestError ? `${oldestUser.full_name} (${oldestUser.created_at})` : undefined,
        newestUser: newestUser && !newestError ? `${newestUser.full_name} (${newestUser.created_at})` : undefined,
      };

      return {
        success: true,
        message: `Database contains ${stats.totalUsers} users (${stats.recentUsers} added in last 7 days)`,
        stats,
      };
    } catch (error) {
      console.error("❌ Error gathering database statistics:", error);
      return {
        success: false,
        message: `Failed to gather statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Performs a complete database health check
   */
  static async healthCheck(): Promise<{
    success: boolean;
    message: string;
    checks?: {
      connection: boolean;
      dataIntegrity: boolean;
      stats: any;
    };
  }> {
    try {
      console.log("🏥 Performing database health check...");

      const checks = {
        connection: false,
        dataIntegrity: false,
        stats: null,
      };

      // Test connection
      try {
        await supabase.from("users").select("id").limit(1);
        checks.connection = true;
      } catch (error) {
        console.error("Connection check failed:", error);
      }

      // Test data integrity
      const integrityResult = await validateDataIntegrity();
      checks.dataIntegrity = integrityResult.success;

      // Get stats
      const statsResult = await DatabaseManager.getStats();
      if (statsResult.success) {
        checks.stats = statsResult.stats;
      }

      const allChecksPass = checks.connection && checks.dataIntegrity;

      return {
        success: allChecksPass,
        message: allChecksPass 
          ? "All health checks passed" 
          : "Some health checks failed",
        checks,
      };
    } catch (error) {
      console.error("❌ Error during health check:", error);
      return {
        success: false,
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

// Export all utility functions
export {
  // Seeding functions
  seedDatabase,
  clearDatabase,
  resetDatabase,
  validateDataIntegrity,
  
  // Migration functions
  migrateFromLocalStorage,
  backupToLocalStorage,
  testMigration,
};

// Export for development console
if (typeof window !== 'undefined') {
  (window as any).DatabaseManager = DatabaseManager;
  (window as any).dbInit = DatabaseManager.initialize;
  (window as any).dbStats = DatabaseManager.getStats;
  (window as any).dbHealth = DatabaseManager.healthCheck;
}