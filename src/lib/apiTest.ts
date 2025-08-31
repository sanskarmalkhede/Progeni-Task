import { userAPI } from './api';

// Simple API test utility for development
export const testAPI = async () => {
  console.log('🧪 Testing API connection...');
  
  try {
    // Test getting all users
    console.log('📋 Testing getAllUsers...');
    const usersResponse = await userAPI.getAllUsers();
    console.log('✅ getAllUsers result:', usersResponse);
    
    if (usersResponse.success && usersResponse.data.length > 0) {
      // Test getting a specific user
      const firstUser = usersResponse.data[0];
      console.log('👤 Testing getUserById...');
      const userResponse = await userAPI.getUserById(firstUser.id);
      console.log('✅ getUserById result:', userResponse);
      
      // Test search functionality
      console.log('🔍 Testing searchUsers...');
      const searchResponse = await userAPI.searchUsers(firstUser.fullName.substring(0, 3));
      console.log('✅ searchUsers result:', searchResponse);
    }
    
    console.log('🎉 API tests completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ API test failed:', error);
    return false;
  }
};

// Export for use in development console
if (typeof window !== 'undefined') {
  (window as any).testAPI = testAPI;
}