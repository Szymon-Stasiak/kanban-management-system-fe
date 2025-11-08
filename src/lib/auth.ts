import {api} from "./api"

export interface UserRecord {
    username: string;
    email: string;
    password?: string;
}

export interface ApiResponse<T = unknown> {
    ok: boolean;
    message?: string;
    token?: string;
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


export async function createAccount(
    payload: RegisterPayload
): Promise<ApiResponse> {
    try {
        const res = await api.post<{ message?: string }>("auth/register", payload, {
            headers: {"Content-Type": "application/json"},
        });
        return {
            ok: true,
            message: res.data?.message ?? "Account created successfully.",
        };
    } catch (error: any) {
        const message =
            error.response?.data?.message ?? "Failed to create account.";
        return {ok: false, message};
    }
}


export async function login(
    payload: LoginPayload
): Promise<ApiResponse<LoginResponse>> {
    try {
        const formData = new URLSearchParams();
        formData.append("username", payload.username);
        formData.append("password", payload.password);

        const res = await api.post<LoginResponse>("auth/login", formData, {
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
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
        const message =
            error.response?.data?.message ?? "Invalid username or password.";
        return {ok: false, message};
    }
}


export function logout(): void {
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax; domain=localhost";
}
