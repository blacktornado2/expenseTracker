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
} from "../actions//action.types";

const initialState = {
  user: null,
  isLoading: false,
  error: null,
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
      return {...state, isLoading: true}
    case LOGIN_USER_SUCCESS:
        return {...state, user: action.payload}
    default:
      return state;
  }
};

export default userReducer;
