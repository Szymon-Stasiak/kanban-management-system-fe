import { api } from "./api";
import Cookies from "js-cookie";

export interface UserRecord {
    username: string;
    email: string;
    password?: string;
    avatar_url?: string; // dodane dla zdjęcia
}

export interface ApiResponse<T = unknown> {
    ok: boolean;
    message?: string;
    token?: string;
    data?: T;
}

export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
}

export interface LoginPayload {
    username: string;
    password: string;
}

export interface LoginResponse {
    user: UserRecord;
    token?: string;
}

// --- ACCOUNT MANAGEMENT ---
export async function createAccount(payload: RegisterPayload): Promise<ApiResponse> {
    try {
        const res = await api.post<{ message?: string }>("auth/register", payload, {
            headers: { "Content-Type": "application/json" },
        });
        return {
            ok: true,
            message: res.data?.message ?? "Account created successfully.",
        };
    } catch (error: any) {
        const message = error.response?.data?.message ?? "Failed to create account.";
        return { ok: false, message };
    }
}

export async function login(payload: LoginPayload): Promise<ApiResponse<LoginResponse>> {
    try {
        const formData = new URLSearchParams();
        formData.append("username", payload.username);
        formData.append("password", payload.password);

        const res = await api.post<LoginResponse>("auth/login", formData, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        if (res.data?.token) {
            const maxAge = 60 * 60 * 24;
            document.cookie = `token=${res.data.token}; path=/; max-age=${maxAge}; SameSite=Lax; domain=localhost`;
        }

        return {
            ok: true,
            token: res.data.token,
            message: "Login successful.",
        };
    } catch (error: any) {
        const message = error.response?.data?.message ?? "Invalid username or password.";
        return { ok: false, message };
    }
}

export function logout(): void {
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax; domain=localhost";
}

type Method = "get" | "post" | "put" | "delete";

interface AuthRequestOptions {
    method: Method;
    url: string;
    data?: any;
    config?: any;
    responseType?: "arraybuffer" | "blob" | "json" | "text";
}

export async function authRequest<T>({
                                         method,
                                         url,
                                         data,
                                         config,
                                         responseType,
                                     }: AuthRequestOptions): Promise<T> {
    const token = Cookies.get("token");
    if (!token) throw new Error("No token");

    const headers = {
        Authorization: `Bearer ${token}`,
        ...(config?.headers || {}),
    };

    const axiosConfig = { ...config, headers, responseType };

    try {
        switch (method) {
            case "get":
                return (await api.get<T>(url, axiosConfig)).data;
            case "post":
                return (await api.post<T>(url, data, axiosConfig)).data;
            case "put":
                return (await api.put<T>(url, data, axiosConfig)).data;
            case "delete":
                return (await api.delete<T>(url, axiosConfig)).data;
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
    } catch (error: any) {
        const status = error?.response?.status;
        const detail = error?.response?.data?.detail ?? error?.response?.data;
        const msg = `authRequest ${method.toUpperCase()} ${url} failed${status ? ` (status ${status})` : ''}`;
        console.error(msg, detail);
        throw error;
    }
}
