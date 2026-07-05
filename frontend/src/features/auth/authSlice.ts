import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '@/lib/store';
import * as authApi from '@/lib/api/auth';
import { ApiError } from '@/lib/api';

export interface AuthError {
  message: string;
  details?: string[];
}

export interface AuthState {
  accessToken: string | null;
  user: authApi.AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'anonymous';
  error: AuthError | null;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  status: 'idle',
  error: null,
};

function applySession(state: AuthState, payload: authApi.AuthSessionResponse): void {
  state.accessToken = payload.token.accessToken;
  state.user = payload.user;
  state.status = 'authenticated';
  state.error = null;
}

function normalizeAuthError(error: unknown, fallbackMessage: string): AuthError {
  if (error instanceof ApiError) {
    const details = error.details ? Object.entries(error.details).flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`)) : undefined;
    return {
      message: error.message || fallbackMessage,
      details,
    };
  }

  if (error instanceof Error) {
    return { message: error.message || fallbackMessage };
  }

  return { message: fallbackMessage };
}

export const loginUser = createAsyncThunk<
  authApi.AuthSessionResponse,
  authApi.LoginPayload,
  { rejectValue: AuthError }
>('auth/login', async (payload, { rejectWithValue }) => {
  try {
    return await authApi.login(payload);
  } catch (error) {
    return rejectWithValue(normalizeAuthError(error, 'Unable to sign in'));
  }
});

export const registerUser = createAsyncThunk<
  authApi.AuthSessionResponse,
  authApi.RegisterPayload,
  { rejectValue: AuthError }
>('auth/register', async (payload, { rejectWithValue }) => {
  try {
    return await authApi.register(payload);
  } catch (error) {
    return rejectWithValue(normalizeAuthError(error, 'Unable to create your account'));
  }
});

export const refreshSession = createAsyncThunk<authApi.AuthSessionResponse, void, { rejectValue: AuthError }>(
  'auth/refresh',
  async (_payload, { rejectWithValue }) => {
    try {
      return await authApi.refresh();
    } catch (error) {
      return rejectWithValue(normalizeAuthError(error, 'Unable to refresh session'));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth(state) {
      state.accessToken = null;
      state.user = null;
      state.status = 'anonymous';
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        applySession(state, action.payload);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'anonymous';
        state.error = action.payload ?? { message: action.error.message ?? 'Unable to sign in' };
      })
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        applySession(state, action.payload);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'anonymous';
        state.error = action.payload ?? { message: action.error.message ?? 'Unable to create your account' };
      })
      .addCase(refreshSession.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(refreshSession.fulfilled, (state, action) => {
        applySession(state, action.payload);
      })
      .addCase(refreshSession.rejected, (state, action) => {
        state.accessToken = null;
        state.user = null;
        state.status = 'anonymous';
        state.error = action.payload ?? (action.error.message ? { message: action.error.message } : null);
      });
  },
});

export const { clearAuth } = authSlice.actions;

export const selectAuthState = (state: RootState) => state.auth;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectAuthenticatedUser = (state: RootState) => state.auth.user;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;

export default authSlice.reducer;