export interface ChatMessage {
    sender: string
    type: "system" | "message"
    message: string
}

export interface Notification {
    id: number;
    message: string | null;
    type: "error" | "info" | "alert";
    title?: string;
}