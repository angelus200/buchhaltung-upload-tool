declare module 'exceljs' {
  export default class ExcelJS {
    static Workbook: any;
  }

  export class Workbook {
    creator: string;
    created: Date;
    addWorksheet(name: string): any;
    xlsx: {
      writeBuffer(): Promise<ArrayBuffer>;
    };
  }
}
