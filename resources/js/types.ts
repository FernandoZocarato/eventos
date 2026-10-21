export interface User {
    id: number;
    name: string;
    email?: string;
}
export type Status = "draft" | "published" | "cancelled";
export interface Event {
    id: number;
    user_id: number;
    title: string;
    category: string;
    description: string;
    city: string;
    location: string;
    starts_at: string;
    ends_at: string;
    capacity: number;
    registrations_count: number;
    checkins_count?: number;
    status: Status;
    color: string;
    user?: User;
}
export interface Ticket {
    id: number;
    code: string;
    checked_in_at: string | null;
    event: Event;
    user?: User;
}
export interface Page<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
}
