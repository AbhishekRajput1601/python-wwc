import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

const initialState = {
  user: null,
    token: authService.getToken(),
    isAuthenticated: authService.isAuthenticated(),
  loading: true,
  error: null,
  redirectTo: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload,
        error: null,
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      sessionStorage.setItem('token', action.payload.token);
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'LOGOUT':
      sessionStorage.removeItem('token');
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_REDIRECT_TO':
      return {
        ...state,
        redirectTo: action.payload,
      };
    case 'CLEAR_REDIRECT_TO':
      return {
        ...state,
        redirectTo: null,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  
  // Load user profile on app initialization
  const loadUser = async () => {
    const token = authService.getToken();
    
    if (token) {
      try {
        const result = await authService.getProfile();
        if (result.success) {
          dispatch({
            type: 'USER_LOADED',
            payload: result.user,
          });
        } else {
          dispatch({
            type: 'AUTH_ERROR',
            payload: result.message,
          });
        }
      } catch (error) {
        dispatch({
          type: 'AUTH_ERROR',
          payload: 'Authentication failed',
        });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      // Even if logout API fails, clear local state
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Clear errors
  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  // Set redirect destination
  const setRedirectTo = (path) => {
    dispatch({ type: 'SET_REDIRECT_TO', payload: path });
  };

  // Clear redirect destination
  const clearRedirectTo = () => {
    dispatch({ type: 'CLEAR_REDIRECT_TO' });
  };

  // Update user preferences
  const updatePreferences = async (preferences) => {
    try {
      const result = await authService.updatePreferences(preferences);
      
      if (result.success) {
        dispatch({
          type: 'USER_LOADED',
          payload: result.user,
        });
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      return { success: false, message: 'Failed to update preferences' };
    }
  };

  useEffect(() => {
    loadUser();
  }, []);
  return (
    <AuthContext.Provider
      value={{
        ...state,
        dispatch,
        logout,
        clearErrors,
        loadUser,
        updatePreferences,
        setRedirectTo,
        clearRedirectTo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};