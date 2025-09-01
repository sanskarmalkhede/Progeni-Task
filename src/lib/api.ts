import { User, UserFormData, ApiResponse } from "./types";
import { supabase, Database } from "../supabase-client";
import { PostgrestError } from "@supabase/supabase-js";
import { apiCache, getCacheKey, invalidateCache } from "./cache";

// Error mapping for Supabase error codes to user-friendly messages
interface ErrorMapping {
  statusCode: number;
  message: string;
}

const SUPABASE_ERROR_MAP: Record<string, ErrorMapping> = {
  // PostgreSQL error codes
  "23505": { statusCode: 409, message: "A record with this information already exists." },
  "23503": { statusCode: 400, message: "Referenced record does not exist." },
  "23502": { statusCode: 400, message: "Required field is missing." },
  "23514": { statusCode: 400, message: "Data validation failed." },
  "42501": { statusCode: 403, message: "Access denied." },
  "42P01": { statusCode: 500, message: "Database table not found." },
  
  // PostgREST error codes
  "PGRST116": { statusCode: 404, message: "Record not found." },
  "PGRST301": { statusCode: 400, message: "Invalid request format." },
  "PGRST302": { statusCode: 400, message: "Invalid query parameters." },
  "PGRST204": { statusCode: 400, message: "Invalid range specified." },
  "PGRST103": { statusCode: 400, message: "Invalid JSON format." },
  
  // Connection and network errors
  "ECONNREFUSED": { statusCode: 503, message: "Unable to connect to database. Please try again later." },
  "ETIMEDOUT": { statusCode: 504, message: "Request timed out. Please try again." },
  "ENOTFOUND": { statusCode: 503, message: "Database service unavailable." },
};

// API service layer using Supabase
class UserProfileAPI {
  constructor() {
    // No longer need localStorage initialization
  }

  // Helper method to transform Supabase row to User interface
  private transformUser(
    user: Database["public"]["Tables"]["users"]["Row"]
  ): User {
    return {
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
    };
  }

  // Centralized helper method to transform Supabase responses to ApiResponse format
  private handleSupabaseResponse<T>(
    data: T | null,
    error: PostgrestError | null,
    successMessage: string,
    context: string = "operation"
  ): ApiResponse<T> {
    if (error) {
      console.error(`Supabase error in ${context}:`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      // Map error code to user-friendly message and status code
      const errorMapping = SUPABASE_ERROR_MAP[error.code];
      
      if (errorMapping) {
        // Handle specific constraint violations with more specific messaging
        if (error.code === "23505") {
          if (error.message.includes("email")) {
            return {
              data: data as T,
              success: false,
              message: "A user with this email address already exists. Please use a different email.",
            };
          }
          return {
            data: data as T,
            success: false,
            message: "This information already exists in the system. Please check your data.",
          };
        }
        
        return {
          data: data as T,
          success: false,
          message: errorMapping.message,
        };
      }

      // Fallback for unmapped errors
      return {
        data: data as T,
        success: false,
        message: `Failed to complete ${context}. Please try again.`,
      };
    }

    // Success case
    return {
      data: data as T,
      success: true,
      message: successMessage,
    };
  }

  // Helper method to handle network errors and connection failures
  private handleNetworkError<T>(
    error: unknown,
    context: string,
    fallbackData: T
  ): ApiResponse<T> {
    console.error(`Network error in ${context}:`, error);

    // Check for specific network error types
    if (error instanceof Error) {
      const errorCode = (error as Error & { code?: string }).code;
      const errorMapping = SUPABASE_ERROR_MAP[errorCode];
      
      if (errorMapping) {
        return {
          data: fallbackData,
          success: false,
          message: errorMapping.message,
        };
      }

      // Handle timeout errors
      if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
        return {
          data: fallbackData,
          success: false,
          message: "Request timed out. Please check your connection and try again.",
        };
      }

      // Handle connection errors
      if (error.message.includes("fetch") || error.message.includes("network")) {
        return {
          data: fallbackData,
          success: false,
          message: "Network error. Please check your connection and try again.",
        };
      }
    }

    // Generic network error fallback
    return {
      data: fallbackData,
      success: false,
      message: "Network error. Please check your connection and try again.",
    };
  }

  async getAllUsers(page: number = 1, limit: number = 20): Promise<ApiResponse<{ users: User[], totalCount: number }>> {
    const cacheKey = getCacheKey.allUsers(page, limit);
    
    // Check cache first
    const cachedResult = apiCache.get<{ users: User[], totalCount: number }>(cacheKey);
    if (cachedResult) {
      return {
        data: cachedResult,
        success: true,
        message: "Users retrieved from cache"
      };
    }

    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("users")
        .select("*", { count: 'exact' })
        .order("created_at", { ascending: false })
        .range(from, to);

      // Transform Supabase response to match our User interface
      const users: User[] = (data || []).map((user) =>
        this.transformUser(user)
      );

      const result = {
        users,
        totalCount: count || 0
      };

      // Cache the result for 3 minutes
      if (!error) {
        apiCache.set(cacheKey, result, 3 * 60 * 1000);
      }

      return this.handleSupabaseResponse(
        result,
        error,
        "Users retrieved successfully",
        "getAllUsers"
      );
    } catch (error) {
      return this.handleNetworkError(error, "getAllUsers", { users: [], totalCount: 0 });
    }
  }

  async getUserById(id: string): Promise<ApiResponse<User | null>> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      // Transform Supabase response to match our User interface if data exists
      const user: User | null = data ? this.transformUser(data) : null;

      return this.handleSupabaseResponse(
        user,
        error,
        "User found",
        "getUserById"
      );
    } catch (error) {
      return this.handleNetworkError(error, "getUserById", null);
    }
  }

  async createUser(userData: UserFormData): Promise<ApiResponse<User>> {
    try {
      // Transform form data to match database schema
      const insertData = {
        full_name: userData.fullName,
        email: userData.email,
        phone_number: userData.phoneNumber || null,
        bio: userData.bio || null,
        avatar_url: userData.avatarUrl || null,
        date_of_birth: userData.dateOfBirth || null,
        location: userData.location || null,
      };

      const { data, error } = await supabase
        .from("users")
        .insert(insertData)
        .select()
        .single();

      // Transform Supabase response to match our User interface if data exists
      const newUser: User = data ? this.transformUser(data) : ({} as User);

      // Invalidate cache on successful creation
      if (!error) {
        invalidateCache.allUsers();
      }

      return this.handleSupabaseResponse(
        newUser,
        error,
        "User created successfully",
        "createUser"
      );
    } catch (error) {
      return this.handleNetworkError(error, "createUser", {} as User);
    }
  }

  async updateUser(
    id: string,
    userData: Partial<UserFormData>
  ): Promise<ApiResponse<User>> {
    try {
      // Transform form data to match database schema, only include provided fields
      const updateData: Record<string, unknown> = {};

      if (userData.fullName !== undefined)
        updateData.full_name = userData.fullName;
      if (userData.email !== undefined) updateData.email = userData.email;
      if (userData.phoneNumber !== undefined)
        updateData.phone_number = userData.phoneNumber || null;
      if (userData.bio !== undefined) updateData.bio = userData.bio || null;
      if (userData.avatarUrl !== undefined)
        updateData.avatar_url = userData.avatarUrl || null;
      if (userData.dateOfBirth !== undefined)
        updateData.date_of_birth = userData.dateOfBirth || null;
      if (userData.location !== undefined)
        updateData.location = userData.location || null;

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      // Transform Supabase response to match our User interface if data exists
      const updatedUser: User = data ? this.transformUser(data) : ({} as User);

      // Invalidate cache on successful update
      if (!error) {
        invalidateCache.allUsers();
        invalidateCache.userById(id);
      }

      return this.handleSupabaseResponse(
        updatedUser,
        error,
        "User updated successfully",
        "updateUser"
      );
    } catch (error) {
      return this.handleNetworkError(error, "updateUser", {} as User);
    }
  }

  async deleteUser(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.from("users").delete().eq("id", id);

      // Invalidate cache on successful deletion
      if (!error) {
        invalidateCache.allUsers();
        invalidateCache.userById(id);
      }

      return this.handleSupabaseResponse(
        true,
        error,
        "User deleted successfully",
        "deleteUser"
      );
    } catch (error) {
      return this.handleNetworkError(error, "deleteUser", false);
    }
  }

  async searchUsers(query: string, page: number = 1, limit: number = 20): Promise<ApiResponse<{ users: User[], totalCount: number }>> {
    const normalizedQuery = query.toLowerCase().trim();
    const cacheKey = getCacheKey.searchUsers(normalizedQuery, page, limit);
    
    // Check cache first
    const cachedResult = apiCache.get<{ users: User[], totalCount: number }>(cacheKey);
    if (cachedResult) {
      return {
        data: cachedResult,
        success: true,
        message: `Found ${cachedResult.totalCount} users (cached)`
      };
    }

    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("users")
        .select("*", { count: 'exact' })
        .or(
          `full_name.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%,location.ilike.%${normalizedQuery}%,bio.ilike.%${normalizedQuery}%`
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      // Transform Supabase response to match our User interface
      const users: User[] = (data || []).map((user) =>
        this.transformUser(user)
      );

      const result = {
        users,
        totalCount: count || 0
      };

      // Cache the result for 2 minutes (shorter for search results)
      if (!error) {
        apiCache.set(cacheKey, result, 2 * 60 * 1000);
      }

      return this.handleSupabaseResponse(
        result,
        error,
        `Found ${count || 0} users`,
        "searchUsers"
      );
    } catch (error) {
      return this.handleNetworkError(error, "searchUsers", { users: [], totalCount: 0 });
    }
  }
}

export const userAPI = new UserProfileAPI();

// Upload avatar to Supabase Storage bucket 'avatars'
export async function uploadAvatarToStorage(file: File, userId: string): Promise<{ url?: string; error?: string }> {
  try {
    // Use userId + timestamp for unique file name
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('avatars').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) {
      return { error: error.message };
    }
    // Get public URL
    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return { url: publicUrlData.publicUrl };
  } catch (e: any) {
    return { error: e.message || 'Unknown error uploading avatar' };
  }
}
