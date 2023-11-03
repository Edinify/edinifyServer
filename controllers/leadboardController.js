import axios from "axios";
import {
  STUDENTS_ALL_ACTIONS_TYPE,
  STUDENTS_MODAL_ACTION_TYPE,
} from "../actions-type";
import { toast } from "react-toastify";
import { logoutAction } from "./auth";
import { apiRoot } from "../../apiRoot";

const refreshApi = axios.create({
  baseURL: `${apiRoot}/user/auth/refresh_token`,
  withCredentials:true
});

const API = axios.create({
  baseURL: `${apiRoot}/user/student`,
  withCredentials:true
});
const REGISTERAPI = axios.create({
  baseURL: `${apiRoot}/user/auth`,
  withCredentials:true
});

API.interceptors.request.use((req) => {
  if (localStorage.getItem("auth")) {
    req.headers.Authorization = `Bearer ${
      JSON.parse(localStorage.getItem("auth")).AccessToken
    }`;
  }

  return req;
});

REGISTERAPI.interceptors.request.use((req) => {
  if (localStorage.getItem("auth")) {
    req.headers.Authorization = `Bearer ${
      JSON.parse(localStorage.getItem("auth")).AccessToken
    }`;
  }

  return req;
});

export const setLoadingStudentsAction = (loadingValue) => ({
  type: STUDENTS_ALL_ACTIONS_TYPE.STUDENT_LOADING,
  payload: loadingValue,
});
const studentModalLoading = (loadingValue) => ({
  type: STUDENTS_MODAL_ACTION_TYPE.STUDENT_MODAL_LOADING,
  payload: loadingValue,
});
const toastSuccess = (message) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "colored",
  });
};
const toastError = (message) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 2000,
    toastClassName: "custom-toast",
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "colored",
  });
};

export const getStudentsAction = () => async (dispatch) => {
  try {
    const { data } = await API.get("/");
    dispatch({ type: STUDENTS_ALL_ACTIONS_TYPE.GET_STUDENT, payload: data });
  } catch (error) {
    const originalRequest = error.config;
    console.log(error);
    if (error?.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const token = await refreshApi.get("/");
        localStorage.setItem(
          "auth",
          JSON.stringify({
            AccessToken: token?.data?.accesstoken,
          })
        );
        const { data } = await API.get("/");
        dispatch({
          type: STUDENTS_ALL_ACTIONS_TYPE.GET_STUDENT,
          payload: data,
        });
      } catch (error) {
        console.log(error);
        if (error?.response?.status === 401) {
          return dispatch(logoutAction());
        }
      }
    }
  }
};

export const getStudentsPaginationAction =
  (pageNumber, searchQuery, status = "all") =>
  async (dispatch) => {
    dispatch(setLoadingStudentsAction(true));
    try {
      const { data } = await API.get(
        `/pagination/?page=${pageNumber}&searchQuery=${searchQuery}&status=${status}`
      );
      dispatch({
        type: STUDENTS_ALL_ACTIONS_TYPE.GET_STUDENT_LAST_PAGE,
        payload: pageNumber,
      });
      dispatch({
        type: STUDENTS_ALL_ACTIONS_TYPE.GET_STUDENT_PAGINATION,
        payload: data,
      });
    } catch (error) {
      console.log(error);
      const originalRequest = error.config;
      if (error?.response?.status === 403 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const token = await refreshApi.get("/");
          localStorage.setItem(
            "auth",
            JSON.stringify({
              AccessToken: token.data.accesstoken,
            })
          );

          const { data } = await API.get(
            `/pagination/?page=${pageNumber}&searchQuery=${searchQuery}&status=${status}`
          );
          dispatch({
            type: STUDENTS_ALL_ACTIONS_TYPE.GET_STUDENT_LAST_PAGE,
            payload: pageNumber,
          });
          dispatch({
            type: STUDENTS_ALL_ACTIONS_TYPE.GET_STUDENT_PAGINATION,
            payload: data,
          });
        } catch (error) {
          console.log(error);
          if (error?.response?.status === 401) {
            return dispatch(logoutAction());
          }
        }
      }
    } finally {
      dispatch(setLoadingStudentsAction(false));
    }
  };

export const getStudentsByCourseIdAction = (payload) => async (dispatch) => {
  try {
    const { data } = await API.get(
      `/by/course?courseId=${payload.courseId}&day=${payload.day}&time=${payload.time}&role=${payload.role}&date=${payload.date}`
    );
    dispatch({
      type: STUDENTS_ALL_ACTIONS_TYPE.GET_STUDENT_BY_COURSE,
      payload: data,
    });
  } catch (error) {
    console.log(error);
    const originalRequest = error.config;
      if (error?.response?.status === 403 && !originalRequest._retry){
        try {
          const token = await refreshApi.get("/");
          localStorage.setItem(
            "auth",
            JSON.stringify({
              AccessToken: token.data.accesstoken,
            })
          );

          const { data } = await API.get(
            `/by/course?courseId=${payload.courseId}&day=${payload.day}&time=${payload.time}&role=${payload.role}&date=${payload.date}`
          );
          dispatch({
            type: STUDENTS_ALL_ACTIONS_TYPE.GET_STUDENT_BY_COURSE,
            payload: data,
          });
        } catch (error) {
          console.log(error);
          if (error?.response?.status === 401) {
            return dispatch(logoutAction());
          }
        }
      }
  }
};

export const createStudentsAction = (studentData) => async (dispatch) => {
  dispatch(studentModalLoading(true));
  try {
    const { data } = await REGISTERAPI.post("/student/sign", studentData);
    dispatch(getStudentsPaginationAction(data.lastPage, "", "all"));
    dispatch({
      type: STUDENTS_MODAL_ACTION_TYPE.STUDENT_OPEN_MODAL,
      payload: false,
    });
    toastSuccess("Yeni tələbə yaradıldı");
  } catch (error) {
    const originalRequest = error.config;
    if (error?.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const token = await refreshApi.get("/");
        localStorage.setItem(
          "auth",
          JSON.stringify({
            AccessToken: token.data.accesstoken,
          })
        );

        const { data } = await REGISTERAPI.post("/student/sign", studentData);
        dispatch(getStudentsPaginationAction(data.lastPage, "", "all"));
        dispatch({
          type: STUDENTS_MODAL_ACTION_TYPE.STUDENT_OPEN_MODAL,
          payload: false,
        });
        toastSuccess("Yeni tələbə yaradıldı");
      } catch (error) {
        if (error?.response?.status === 401) {
          return dispatch(logoutAction());
        }
      }
    }
    if (error?.response?.data?.key === "email-already-exist") {
      dispatch({
        type: STUDENTS_MODAL_ACTION_TYPE.STUDENT_OPEN_MODAL,
        payload: true,
      });
      toastError("Bu email ilə istifadəçi mövcuddur");
    }
  } finally {
    dispatch(studentModalLoading(false));
  }
};

export const updateStudentsAction = (_id, studentData) => async (dispatch) => {
  dispatch(studentModalLoading(true));
  try {
    const { data } = await API.patch(`/${_id}`, studentData);
    dispatch({ type: STUDENTS_ALL_ACTIONS_TYPE.UPDATE_STUDENT, payload: data });
    dispatch({
      type: STUDENTS_MODAL_ACTION_TYPE.STUDENT_OPEN_MODAL,
      payload: false,
    });
    toastSuccess("Tələbə yeniləndi");
  } catch (error) {
    const originalRequest = error.config;

    if (error?.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const token = await refreshApi.get("/");
        localStorage.setItem(
          "auth",
          JSON.stringify({
            AccessToken: token.data.accesstoken,
          })
        );
        const { data } = await API.patch(`/${_id}`, studentData);
        dispatch({
          type: STUDENTS_ALL_ACTIONS_TYPE.UPDATE_STUDENT,
          payload: data,
        });
        dispatch({
          type: STUDENTS_MODAL_ACTION_TYPE.STUDENT_OPEN_MODAL,
          payload: false,
        });
        toastSuccess("Tələbə yeniləndi");
      } catch (error) {
        if (error?.response?.status === 401) {
          return dispatch(logoutAction());
        }
      }
    }
    console.log(error);
    if (error?.response?.data?.key === "email-already-exist") {
      // dispatch({type:STUDENTS_MODAL_ACTION_TYPE.STUDENT_OPEN_MODAL,payload:true})
      toastError("Bu email ilə istifadəçi mövcuddur");
    }
    if (error?.response?.data?.key === "has-current-week-lessons") {
      toastError("Cari həftədə  dərsi olan tələbə yenilənə bilməz");
    }
  } finally {
    dispatch(studentModalLoading(false));
  }
};

// 

export const deleteStudentAction = (_id) => async (dispatch) => {
  try {
    await API.delete(`/${_id}`);
    dispatch({ type: STUDENTS_ALL_ACTIONS_TYPE.DELETE_STUDENT, payload: _id });
    toastSuccess("Tələbə silindi");
  } catch (error) {
    const originalRequest = error.config;
    if (error?.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const token = await refreshApi.get("/");
        localStorage.setItem(
          "auth",
          JSON.stringify({
            AccessToken: token.data.accesstoken,
          })
        );

        await API.delete(`/${_id}`);
        dispatch({
          type: STUDENTS_ALL_ACTIONS_TYPE.DELETE_STUDENT,
          payload: _id,
        });
        toastSuccess("Tələbə silindi");
      } catch (error) {
        if (error?.response?.status === 401) {
          return dispatch(logoutAction());
        }
      }
    }
    if (error?.response?.data?.key === "has-current-week-lessons") {
      toastError("Cari həftədə  dərsi olan tələbə silinə bilməz");
    }
    console.log(error);
    toastError(error?.response?.data.message);
  }
};