declare module 'jspdf' {
  export default class jsPDF {
    constructor(options?: any);
    setFontSize(size: number): void;
    setFont(font: string, style?: string): void;
    text(text: string, x: number, y: number, options?: any): void;
    setTextColor(r: number, g: number, b: number): void;
    save(filename: string): void;
    internal: {
      pageSize: {
        getWidth(): number;
        getHeight(): number;
      };
    };
  }
}

declare module 'jspdf-autotable' {
  export default function autoTable(doc: any, options: any): void;
}
