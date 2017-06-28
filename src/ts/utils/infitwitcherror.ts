export class InfitwitchError {
    constructor(message: string, details: string) {
        this.message = message;
        this.time = Date.now();
        this.details = details;
    }

    public message: string;
    public time: number;
    public details: string;

    static fromAny(data: any): InfitwitchError {
        let i = new InfitwitchError(data.message, data.details);
        i.time = data.time;
        return i;
    }
}