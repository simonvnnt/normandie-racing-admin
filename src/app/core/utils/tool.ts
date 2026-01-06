import moment from 'moment';

export function getRemainingTime(endDate: Date|string|null, statusId: number): { level: number; remainingTime: string }
{
    const status = this.statuses?.find(s => s.id === statusId);
    const isShipped = status?.position >= 7;

    if (isShipped || !endDate) {
        return {
            'remainingTime': null,
            'level': null
        };
    }

    const diff = moment(endDate).diff(moment(), 'minutes');
    const absoluteDiff = Math.abs(diff);
    const daysDiff = Math.floor(absoluteDiff / (24 * 60));
    const hoursDiff = Math.floor((absoluteDiff % (24 * 60)) / 60);
    const minDiff = absoluteDiff % 60;

    const days = daysDiff > 0 ? daysDiff + 'j ' : '';
    const hours = hoursDiff > 0 ? hoursDiff + 'h ' : '';
    const min = minDiff > 0 ? minDiff + 'm' : '';

    const isPast = diff < 0;
    const prefix = isPast ? '- ' : '';

    return {
        'remainingTime': prefix + days + hours + min,
        'level': isPast ? -daysDiff : daysDiff
    };
}

export function capitalizeFirstLetter(word: string | null): string | null
{
    if (!word) {
        return null;
    }

    return word.charAt(0).toUpperCase() + String(word).slice(1).toLowerCase();
}

export const statusColors = {
    1: "#f59e0b",

    2: "#22c55e",
    7: "#22c55e",

    3: "#f97316",
    13: "#f97316",

    4: "#a855f7",

    5: "#16a34a",

    6: "#f43f5e",

    8: "#e11d48",

    9: "#c026d3",

    15: "#14b8a6",

    22: "#3b82f6",

    23: "#ef4444"
}
