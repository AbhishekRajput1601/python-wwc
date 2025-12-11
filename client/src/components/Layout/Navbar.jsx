import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16 md:h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <div className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-medium transition-all duration-200 group-hover:scale-105">
                <span className="text-white font-bold text-base sm:text-lg font-display">
                  W
                </span>
              </div>
              <div className="ml-2 sm:ml-3">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 font-display">
                  WWC
                </span>
                <div className="text-[10px] sm:text-xs text-wwc-600 font-medium -mt-1">
                  Video Conferencing
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {isAuthenticated ? (
              <>
                {user?.name === "admin" ? (
                  <Link
                    to="/admin-dashboard"
                    className="text-neutral-600 hover:text-wwc-600 px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 hover:bg-wwc-50"
                  >
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="text-neutral-600 hover:text-wwc-600 px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 hover:bg-wwc-50"
                  >
                    Dashboard
                  </Link>
                )}
                <div className="flex items-center space-x-3 lg:space-x-4">
                  <div className="hidden lg:block">
                    <span className="text-neutral-700 text-sm font-medium">
                      Welcome,{" "}
                      <span className="text-wwc-600 font-semibold">
                        {user?.name}
                      </span>
                    </span>
                  </div>

                  <Link to="/profile" className="flex items-center group">
                    <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-gray-200 flex items-center justify-center shadow-soft group-hover:shadow-medium transition-all duration-200 group-hover:scale-105">
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="avatar"
                          className="h-9 w-9 lg:h-10 lg:w-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-neutral-700 font-bold text-base lg:text-lg">
                          {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </span>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="border-2 border-black bg-white text-black hover:bg-gray-200 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all duration-200 shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 lg:space-x-3">
                <Link
                  to="/login"
                  className="border-2 border-black bg-white text-black hover:bg-gray-200 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="border-2 border-black bg-white text-black hover:bg-gray-200 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all duration-200 shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-neutral-600 hover:text-wwc-600 hover:bg-wwc-50 transition-colors duration-200"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-sm">
                    <span className="text-neutral-700 font-medium">
                      Welcome,{" "}
                      <span className="text-wwc-600 font-semibold">
                        {user?.name}
                      </span>
                    </span>
                  </div>
                  
                  {user?.name === "admin" ? (
                    <Link
                      to="/admin-dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm font-semibold text-neutral-600 hover:text-wwc-600 hover:bg-wwc-50 transition-colors duration-200"
                    >
                      Admin Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm font-semibold text-neutral-600 hover:text-wwc-600 hover:bg-wwc-50 transition-colors duration-200"
                    >
                      Dashboard
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-semibold text-neutral-600 hover:text-wwc-600 hover:bg-wwc-50 transition-colors duration-200"
                  >
                    Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-neutral-600 hover:text-wwc-600 hover:bg-wwc-50 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="space-y-2 px-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center border-2 border-black bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center border-2 border-black bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-soft"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
