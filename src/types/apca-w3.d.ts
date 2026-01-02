declare module 'apca-w3' {
    export function calcAPCA(textColor: number[] | number | string, bgColor: number[] | number | string): number | string;
    export function sRGBtoY(sRGB: number[]): number;
}
