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
} from "./action.types";

// Action creators

export const loginUserRequest = ({email, password}: {email: string, password: string}) => ({
  type: LOGIN_USER_REQUEST,
  payload: {
    email, password
  }
});

export const loginUserSuccess = (email: string, token: TokenType,) => ({
  type: LOGIN_USER_REQUEST,
  payload: {
    email, token
  }
});

export const loginUserFailure = (error: Error) => ({
  type: LOGIN_USER_FAILURE,
  payload: error
});

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

