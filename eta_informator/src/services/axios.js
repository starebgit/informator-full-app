import axios from "axios";

export const authInstance = axios.create({
    baseURL: `http://${process.env.REACT_APP_INFORMATOR}`,
});

export function setToken(token) {
    authInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}
