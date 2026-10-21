export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public fields: Record<string, string[]> = {},
    ) {
        super(message);
    }
}
let token =
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
        ?.content ?? "";
export function setToken(value: string) {
    token = value;
}
export async function api<T>(
    path: string,
    method = "GET",
    body?: unknown,
): Promise<T> {
    if (import.meta.env.VITE_DEMO_MODE === "true") {
        const { demoApi } = await import("./demo");
        return demoApi<T>(path, method, body);
    }
    const response = await fetch(`/app-api/${path}`, {
        method,
        credentials: "same-origin",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": token,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok)
        throw new ApiError(
            Object.values(data.errors ?? {})
                .flat()
                .join(" ") ||
                data.message ||
                "Não foi possível concluir a operação.",
            response.status,
            data.errors,
        );
    return data as T;
}
