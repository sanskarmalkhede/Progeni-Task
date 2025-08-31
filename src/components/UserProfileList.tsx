import { User } from '../lib/types';
import UserProfileCard from './UserProfileCard';
import { Users, UserPlus } from 'lucide-react';

const UserProfileList = ({
  users,
  onEdit,
  onDelete,
  onCreateNew,
  onGenerateQR,
  isLoading = false,
  searchQuery = '',
  hasError = false,
  onRetry
}: {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onCreateNew: () => void;
  onGenerateQR?: (user: User) => void;
  isLoading?: boolean;
  searchQuery?: string;
  hasError?: boolean;
  onRetry?: () => void;
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg text-gray-600 mt-4">Loading profiles...</span>
        <p className="text-sm text-gray-500 mt-2">Connecting to database...</p>
      </div>
    );
  }

  if (hasError && onRetry) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <Users className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-800 mb-2">Failed to load profiles</h3>
          <p className="text-red-600 mb-6">There was an error connecting to the database. Please check your connection and try again.</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (users.length === 0 && !searchQuery) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No profiles yet</h3>
        <p className="text-gray-500 mb-6">Get started by creating your first user profile.</p>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Create First Profile
        </button>
      </div>
    );
  }

  if (users.length === 0 && searchQuery) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No results found</h3>
        <p className="text-gray-500">
          No profiles match your search for "<span className="font-medium">{searchQuery}</span>"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            {searchQuery ? (
              <>
                Search Results 
                <span className="text-gray-500 font-normal ml-1">
                  ({users.length} {users.length === 1 ? 'profile' : 'profiles'} found)
                </span>
              </>
            ) : (
              <>
                All Profiles 
                <span className="text-gray-500 font-normal ml-1">
                  ({users.length} {users.length === 1 ? 'profile' : 'profiles'})
                </span>
              </>
            )}
          </h2>
        </div>

        <button
          onClick={onCreateNew}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Profile
        </button>
      </div>

      {/* Profile Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <UserProfileCard
            key={user.id}
            user={user}
            onEdit={onEdit}
            onDelete={onDelete}
            onGenerateQR={onGenerateQR}
          />
        ))}
      </div>
    </div>
  );
};

export default UserProfileList;