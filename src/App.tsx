import { useState, useEffect, useCallback } from "react";
import {
  User,
  UserFormData,
  Notification as NotificationType,
} from "./lib/types";
import { userAPI } from "./lib/api";
import { useConnectionStatus } from "./lib/useConnectionStatus";
import UserProfileForm from "./components/UserProfileForm";
import UserProfileList from "./components/UserProfileList";
import SearchBar from "./components/SearchBar";
import ConfirmModal from "./components/ConfirmModal";
import Notification from "./components/Notification";
import QRCodeModal from "./components/QRCodeModal";
import QRCodeReader from "./components/QRCodeReader";
import Pagination from "./components/Pagination";
import { UserPlus, Users, WifiOff, Wifi, QrCode } from "lucide-react";

function App() {
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasLoadError, setHasLoadError] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(20);

  // Connection status
  const { isOnline, wasOffline } = useConnectionStatus();

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrUser, setQrUser] = useState<User | null>(null);
  const [showQRReader, setShowQRReader] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<UserFormData | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  const addNotification = (
    type: NotificationType["type"],
    message: string,
    duration?: number
  ) => {
    const notification: NotificationType = {
      id: Date.now().toString(),
      type,
      message,
      duration,
    };

    setNotifications((prev) => [...prev, notification]);
  };

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasLoadError(false);
      const response = await userAPI.getAllUsers(currentPage, itemsPerPage);

      if (response.success) {
        setFilteredUsers(response.data.users);
        setTotalCount(response.data.totalCount);
        setHasLoadError(false);
      } else {
        setHasLoadError(true);
        addNotification("error", response.message || "Failed to load users");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setHasLoadError(true);
      addNotification(
        "error",
        "Network error while loading users. Please check your connection."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);

      if (!query.trim()) {
        loadUsers();
        return;
      }

      try {
        setIsSearchLoading(true);
        const response = await userAPI.searchUsers(
          query,
          currentPage,
          itemsPerPage
        );

        if (response.success) {
          setFilteredUsers(response.data.users);
          setTotalCount(response.data.totalCount);
        } else {
          addNotification("error", response.message || "Error searching users");
          setFilteredUsers([]);
          setTotalCount(0);
        }
      } catch (error) {
        console.error("Error searching users:", error);
        addNotification(
          "error",
          "Network error while searching. Please check your connection."
        );
        setFilteredUsers([]);
        setTotalCount(0);
      } finally {
        setIsSearchLoading(false);
      }
    },
    [currentPage, itemsPerPage, loadUsers]
  );

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle reconnection
  useEffect(() => {
    if (isOnline && wasOffline) {
      addNotification(
        "success",
        "Connection restored. Refreshing data...",
        3000
      );
      loadUsers();
    }
  }, [isOnline, wasOffline, loadUsers]);

  // Update filtered users when users, search query, or page changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      loadUsers();
    } else {
      handleSearch(searchQuery);
    }
  }, [currentPage, searchQuery, loadUsers, handleSearch]);

  // Handle search query changes (reset to page 1)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      if (!searchQuery.trim()) {
        loadUsers();
      } else {
        handleSearch(searchQuery);
      }
    }
  }, [searchQuery, currentPage, loadUsers, handleSearch]);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleCreateNew = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData: UserFormData) => {
    try {
      setIsFormLoading(true);

      let response;
      if (editingUser) {
        response = await userAPI.updateUser(editingUser.id, formData);
      } else {
        response = await userAPI.createUser(formData);
      }

      if (response.success) {
        // Refresh current page data
        if (!searchQuery.trim()) {
          await loadUsers();
        } else {
          await handleSearch(searchQuery);
        }
        setShowForm(false);
        setEditingUser(null);
        setQrCodeData(null);
        addNotification("success", response.message);
      } else {
        addNotification("error", response.message);
      }
    } catch (error) {
      console.error(
        `Error ${editingUser ? "updating" : "creating"} user:`,
        error
      );
      addNotification(
        "error",
        `Network error while ${
          editingUser ? "updating" : "creating"
        } user. Please check your connection and try again.`
      );
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setQrCodeData(null);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      const response = await userAPI.deleteUser(userToDelete.id);

      if (response.success) {
        // Refresh current page data
        if (!searchQuery.trim()) {
          await loadUsers();
        } else {
          await handleSearch(searchQuery);
        }
        addNotification("success", response.message);
      } else {
        addNotification("error", response.message);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      addNotification(
        "error",
        "Network error while deleting user. Please check your connection and try again."
      );
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleGenerateQR = (user: User) => {
    setQrUser(user);
    setShowQRModal(true);
  };

  const handleQRModalClose = () => {
    setShowQRModal(false);
    setQrUser(null);
  };

  const handleQRReaderOpen = () => {
    setShowQRReader(true);
  };

  const handleQRReaderClose = () => {
    setShowQRReader(false);
  };

  const handleQRCodeRead = (userData: UserFormData) => {
    // Store QR code data and open form
    setQrCodeData(userData);
    setEditingUser(null); // Ensure we're creating a new user
    setShowForm(true);

    addNotification(
      "success",
      `QR code read successfully! User data for ${userData.fullName} is ready to be saved.`
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  User Profile Manager
                </h1>
                <p className="text-sm text-gray-500">
                  Manage user profiles with ease
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div
                className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                  isOnline
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {isOnline ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
                <span>{isOnline ? "Online" : "Offline"}</span>
              </div>

              <button
                onClick={handleQRReaderOpen}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Scan QR
              </button>

              <button
                onClick={handleCreateNew}
                disabled={!isOnline}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                New Profile
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search by name, email, location, or bio..."
            isLoading={isSearchLoading}
          />
        </div>

        {/* User List */}
        <UserProfileList
          users={filteredUsers}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onCreateNew={handleCreateNew}
          onGenerateQR={handleGenerateQR}
          isLoading={isLoading}
          searchQuery={searchQuery}
          hasError={hasLoadError}
          onRetry={loadUsers}
        />

        {/* Pagination */}
        {totalCount > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalCount / itemsPerPage)}
            totalItems={totalCount}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            isLoading={isLoading || isSearchLoading}
          />
        )}
      </main>

      {/* Modals */}
      {showForm && (
        <UserProfileForm
          user={editingUser}
          initialData={qrCodeData}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={isFormLoading}
        />
      )}

      {showDeleteModal && userToDelete && (
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Profile"
          message={`Are you sure you want to delete ${userToDelete.fullName}'s profile? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          type="danger"
        />
      )}

      {showQRModal && qrUser && (
        <QRCodeModal
          isOpen={showQRModal}
          user={qrUser}
          onClose={handleQRModalClose}
        />
      )}

      {showQRReader && (
        <QRCodeReader
          isOpen={showQRReader}
          onClose={handleQRReaderClose}
          onQRCodeRead={handleQRCodeRead}
        />
      )}

      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
