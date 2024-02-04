export interface ChatMessage {
    sender: string
    type: "system" | "message"
    message: string
}