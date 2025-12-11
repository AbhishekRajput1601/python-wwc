import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-wwc-50 via-white to-accent-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="pt-12 sm:pt-16 md:pt-20 pb-12 sm:pb-16 text-center lg:pt-32">
          {/* Hero Section */}
          <div className="animate-fade-in">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-hard mb-4 sm:mb-6">
              <span className="text-white font-bold text-2xl sm:text-3xl font-display">
                W
              </span>
            </div>
            <h1 className="mx-auto max-w-4xl font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 lg:text-7xl px-2">
              Welcome to{" "}
              <span className="relative whitespace-nowrap text-wwc-600">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 418 42"
                  className="absolute top-2/3 left-0 h-[0.58em] w-full fill-wwc-200/70 hidden sm:block"
                  preserveAspectRatio="none"
                >
                  <path d="m203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
                </svg>
                <span className="relative">WWC</span>
              </span>
            </h1>
            <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl leading-6 sm:leading-7 md:leading-8 text-neutral-600 px-4">
              The world's most advanced video conferencing platform with{" "}
              <span className="font-semibold text-wwc-700">
                real-time captions
              </span>{" "}
              and{" "}
              <span className="font-semibold text-accent-600">
                instant translation
              </span>
              . Connect globally, communicate effortlessly.
            </p>
          </div>

          <div className="mt-8 sm:mt-10 md:mt-12 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 md:gap-6 animate-slide-in-up px-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="group inline-flex items-center justify-center rounded-xl sm:rounded-2xl py-3 sm:py-3.5 md:py-4 px-6 sm:px-7 md:px-8 text-sm sm:text-base md:text-lg font-semibold border-2 border-black bg-white text-black hover:bg-gray-200 transition-all duration-300 shadow-soft hover:shadow-hard transform hover:-translate-y-1 w-full sm:w-auto"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="group inline-flex items-center justify-center rounded-xl sm:rounded-2xl py-3 sm:py-3.5 md:py-4 px-6 sm:px-7 md:px-8 text-sm sm:text-base md:text-lg font-semibold border-2 border-black bg-white text-black hover:bg-gray-200 transition-all duration-300 shadow-soft hover:shadow-hard transform hover:-translate-y-1 w-full sm:w-auto"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Start Free Today
                </Link>
                <Link
                  to="/login"
                  className="group inline-flex items-center justify-center rounded-xl sm:rounded-2xl py-3 sm:py-3.5 md:py-4 px-6 sm:px-7 md:px-8 text-sm sm:text-base md:text-lg font-semibold border-2 border-black bg-white text-black hover:bg-gray-200 transition-all duration-300 shadow-soft hover:shadow-medium transform hover:-translate-y-1 w-full sm:w-auto"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="py-12 sm:py-16 md:py-20 bg-white/60 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center animate-slide-in-up">
              <div className="inline-flex items-center rounded-full px-3 sm:px-4 py-1.5 sm:py-2 bg-wwc-100 text-wwc-700 font-semibold text-xs sm:text-sm mb-3 sm:mb-4">
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Everything you need
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 lg:text-5xl font-display px-2">
                Revolutionary Features for
                <span className="text-wwc-600"> Modern Teams</span>
              </h2>
              <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg leading-6 sm:leading-7 md:leading-8 text-neutral-600 px-4">
                Experience the next generation of video conferencing with
                AI-powered features designed for seamless global communication.
              </p>
            </div>

            <div className="mx-auto mt-10 sm:mt-12 md:mt-16 max-w-2xl lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-6 sm:gap-8 lg:max-w-none lg:grid-cols-3">
                <div className="group flex flex-col bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2 border border-neutral-100">
                  <dt className="flex items-center gap-x-2.5 sm:gap-x-3 text-base sm:text-lg font-bold leading-6 sm:leading-7 text-neutral-900 mb-3 sm:mb-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-wwc-500 to-wwc-600 group-hover:from-wwc-600 group-hover:to-wwc-700 transition-all duration-300 shadow-soft">
                      <svg
                        className="h-6 w-6 sm:h-7 sm:w-7 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                        />
                      </svg>
                    </div>
                    Ultra HD Video Calls
                  </dt>
                  <dd className="flex flex-auto flex-col text-sm sm:text-base leading-6 sm:leading-7 text-neutral-600">
                    <p className="flex-auto">
                      Experience crystal-clear 4K video quality with adaptive
                      streaming and WebRTC technology for flawless communication
                      across any device.
                    </p>
                  </dd>
                </div>

                <div className="group flex flex-col bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2 border border-neutral-100">
                  <dt className="flex items-center gap-x-2.5 sm:gap-x-3 text-base sm:text-lg font-bold leading-6 sm:leading-7 text-neutral-900 mb-3 sm:mb-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 group-hover:from-accent-600 group-hover:to-accent-700 transition-all duration-300 shadow-soft">
                      <svg
                        className="h-6 w-6 sm:h-7 sm:w-7 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                        />
                      </svg>
                    </div>
                    AI-Powered Captions
                  </dt>
                  <dd className="flex flex-auto flex-col text-sm sm:text-base leading-6 sm:leading-7 text-neutral-600">
                    <p className="flex-auto">
                      Advanced AI converts speech to text in real-time with 99%
                      accuracy, making every meeting accessible and searchable
                      for all participants.
                    </p>
                  </dd>
                </div>

                <div className="group flex flex-col bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2 border border-neutral-100">
                  <dt className="flex items-center gap-x-2.5 sm:gap-x-3 text-base sm:text-lg font-bold leading-6 sm:leading-7 text-neutral-900 mb-3 sm:mb-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-success-500 to-success-600 group-hover:from-success-600 group-hover:to-success-700 transition-all duration-300 shadow-soft">
                      <svg
                        className="h-6 w-6 sm:h-7 sm:w-7 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802"
                        />
                      </svg>
                    </div>
                    Universal Translation
                  </dt>
                  <dd className="flex flex-auto flex-col text-sm sm:text-base leading-6 sm:leading-7 text-neutral-600">
                    <p className="flex-auto">
                      Break language barriers with instant translation in 100+
                      languages, enabling seamless global collaboration and
                      inclusive meetings.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <footer className="bg-neutral-900 text-white py-6 sm:py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-6 lg:gap-8">
              {/* Brand Section */}
              <div className="col-span-1 sm:col-span-2">
                <div className="flex items-center space-x-2.5 sm:space-x-3 mb-3 sm:mb-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-soft">
                    <span className="text-white font-bold text-base sm:text-lg font-display">
                      W
                    </span>
                  </div>
                  <div>
                    <span className="text-lg sm:text-xl font-bold text-white font-display">
                      WWC
                    </span>
                    <div className="text-[10px] sm:text-xs text-wwc-400 font-medium -mt-0.5 sm:-mt-1">
                      Video Conferencing
                    </div>
                  </div>
                </div>
                <p className="text-neutral-300 text-sm sm:text-base leading-relaxed mb-2.5 sm:mb-3 max-w-md">
                  Connect globally, communicate effortlessly with the world's
                  most advanced video conferencing platform.
                </p>
                <p className="text-[10px] sm:text-xs text-neutral-400">
                  Developed and maintained by{" "}
                  <span className="text-wwc-400 font-semibold">harborleaf</span>
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2.5 sm:mb-3">
                  Quick Links
                </h3>
                <ul className="space-y-1.5 sm:space-y-2">
                  <li>
                    <Link
                      to="/signup"
                      className="text-xs sm:text-sm text-neutral-300 hover:text-wwc-400 transition-colors duration-200">
                      Get Started
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/login"
                      className="text-xs sm:text-sm text-neutral-300 hover:text-wwc-400 transition-colors duration-200"
                    >
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <a
                      href="#features"
                      className="text-xs sm:text-sm text-neutral-300 hover:text-wwc-400 transition-colors duration-200"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#about"
                      className="text-xs sm:text-sm text-neutral-300 hover:text-wwc-400 transition-colors duration-200"
                    >
                      About
                    </a>
                  </li>
                </ul>
              </div>

              {/* Social Media & Contact */}
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2.5 sm:mb-3">
                  Connect With Us
                </h3>
                <div className="flex space-x-2.5 sm:space-x-3 mb-2.5 sm:mb-3">
                  {/* Twitter */}
                  <a
                    href="https://twitter.com/harborleaf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 sm:w-8 sm:h-8 bg-neutral-800 hover:bg-wwc-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  >
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href="https://linkedin.com/company/harborleaf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 sm:w-8 sm:h-8 bg-neutral-800 hover:bg-wwc-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  >
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>

                  {/* GitHub */}
                  <a
                    href="https://github.com/harborleaf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 sm:w-8 sm:h-8 bg-neutral-800 hover:bg-wwc-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  >
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>

                  {/* Instagram */}
                  <a
                    href="https://instagram.com/harborleaf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 sm:w-8 sm:h-8 bg-neutral-800 hover:bg-wwc-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  >
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                </div>
                <p className="text-[10px] sm:text-xs text-neutral-400">
                  Email: contact@harborleaf.com
                </p>
              </div>
            </div>

            {/* Bottom Copyright Section */}
            <div className="border-t border-neutral-800 mt-5 sm:mt-6 pt-3.5 sm:pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
              <div className="text-[10px] sm:text-xs text-neutral-400 text-center sm:text-left">
                © {new Date().getFullYear()} WWC - World Wide Conferencing. All
                rights reserved.
              </div>
              <div className="text-[10px] sm:text-xs text-neutral-400 text-center sm:text-right">
                Crafted with ❤️ by{" "}
                <a
                  href="https://harborleaf.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-wwc-400 hover:text-wwc-300 font-semibold transition-colors duration-200"
                >
                  harborleaf
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;
