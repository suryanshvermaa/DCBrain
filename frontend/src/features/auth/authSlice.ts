import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '@/lib/store';
import * as authApi from '@/lib/api/auth';

export interface AuthState {
  accessToken: string | null;
  user: authApi.AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'anonymous';
  error: string | null;
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

export const loginUser = createAsyncThunk('auth/login', async (payload: authApi.LoginPayload) => authApi.login(payload));
export const registerUser = createAsyncThunk('auth/register', async (payload: authApi.RegisterPayload) => authApi.register(payload));
export const refreshSession = createAsyncThunk('auth/refresh', async () => authApi.refresh());

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
        state.error = action.error.message ?? 'Unable to sign in';
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
        state.error = action.error.message ?? 'Unable to create your account';
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
        state.error = action.error.message ?? null;
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