import { CalendarEvent } from "./calendar";

export type UserType = {
    email: string;
    firstName?: string;
    id: string;
    lastName?: string;
    profilePic_url?: string;
    subscription?: string;
    type?: string;
    services?: string[];
    introduction?: string;
    description?: string;
}

export type events = {
    id: string;
    title: string;
    description: string;
    date: Date;
    createdBy: string;
}
