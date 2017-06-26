export class UserNotLoggedInException extends Error {
    constructor(message: string) {
        super(message);
    }
}