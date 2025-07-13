import { User, TokenType } from "../../types/global";

import {
  FETCH_USER_REQUEST,
  FETCH_USER_SUCCESS,
  FETCH_USER_FAILURE,
  UPDATE_USER_REQUEST,
  UPDATE_USER_SUCCESS,
  UPDATE_USER_FAILURE,
  DELETE_USER_REQUEST,
  DELETE_USER_SUCCESS,
  DELETE_USER_FAILURE,
  LOGIN_USER_REQUEST,
  LOGIN_USER_FAILURE,
  LOGIN_USER_SUCCESS,
  REGISTER_USER_REQUEST,
  REGISTER_USER_SUCCESS,
  LOGOUT_USER_REQUEST,
  LOGOUT_USER_SUCCESS,
} from "./action.types";

// Action creators

export const loginUserRequest = ({ email, password }: { email: string, password: string }) => ({
  type: LOGIN_USER_REQUEST,
  payload: {
    email, password
  }
});

export const loginUserSuccess = (user: User, token: string) => ({
  type: LOGIN_USER_SUCCESS,
  payload: user,
  token,
});

export const loginUserFailure = (error: Error) => ({
  type: LOGIN_USER_FAILURE,
  payload: error
});

export const registerUserRequest = ({ email, password, name }: { email: string, password: string, name: string }) => ({
  type: REGISTER_USER_REQUEST,
  payload: {
    email, password, name
  }
});

export const registerUserSuccess = (message: string) => ({
  type: REGISTER_USER_SUCCESS,
  payload: message
})

export const fetchUserRequest = (email: string) => ({
  type: FETCH_USER_REQUEST,
  payload: email,
});

export const fetchUserSuccess = (user: User) => ({
  type: FETCH_USER_SUCCESS,
  payload: user,
});

export const fetchUserFailure = (error: Error) => ({
  type: FETCH_USER_FAILURE,
  payload: error,
});

export const updateUserRequest = (user: User) => ({
  type: UPDATE_USER_REQUEST,
  payload: user,
});

export const updateUserSuccess = (user: User) => ({
  type: UPDATE_USER_SUCCESS,
  payload: user,
});

export const updateUserFailure = (error: Error) => ({
  type: UPDATE_USER_FAILURE,
  payload: error,
});

export const deleteUserRequest = (email: string) => ({
  type: DELETE_USER_REQUEST,
  payload: email,
});

export const deleteUserSuccess = (email: string) => ({
  type: DELETE_USER_SUCCESS,
  payload: email,
});

export const deleteUserFailure = (error: Error) => ({
  type: DELETE_USER_FAILURE,
  payload: error,
});


export const logoutUserRequest = () => ({
  type: LOGOUT_USER_REQUEST,
});

export const logoutUserSuccess = () => ({
  type: LOGOUT_USER_SUCCESS,
});
