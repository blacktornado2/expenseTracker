import {
  LOGIN_USER_REQUEST,
  LOGIN_USER_SUCCESS,
  LOGIN_USER_FAILURE,
  FETCH_USER_REQUEST,
  FETCH_USER_SUCCESS,
  FETCH_USER_FAILURE,
  UPDATE_USER_REQUEST,
  UPDATE_USER_SUCCESS,
  UPDATE_USER_FAILURE,
  REGISTER_USER_SUCCESS,
  REGISTER_USER_REQUEST,
  LOGOUT_USER_REQUEST,
  LOGOUT_USER_SUCCESS,
} from "../actions//action.types";

const initialState = {
  user: null,
  isLoading: false,
  error: null,
  registerUser: null,
};

const userReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case FETCH_USER_REQUEST:
    case UPDATE_USER_REQUEST:
      return { ...state, isLoading: true, error: null };
    case FETCH_USER_SUCCESS:
    case UPDATE_USER_SUCCESS:
      return { ...state, user: action.payload, isLoading: false };
    case FETCH_USER_FAILURE:
    case UPDATE_USER_FAILURE:
    case LOGIN_USER_FAILURE:
      return { ...state, error: action.payload, isLoading: false };
    case LOGIN_USER_REQUEST:
      return { ...state, isLoading: true }
    case LOGIN_USER_SUCCESS:
      return { ...state, user: action.payload }
    case REGISTER_USER_REQUEST:
      return { ...state, isLoading: true, error: null, registerUser: null };
    case REGISTER_USER_SUCCESS:
      return { ...state, isLoading: false, error: null, registerUser: { success: action.payload } };
    case LOGOUT_USER_REQUEST: 
      return { ...state, isLoading: true };
    case LOGOUT_USER_SUCCESS:
      return {...initialState};
    default:
      return state;
  }
};

export default userReducer;
