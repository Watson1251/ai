import { MatPaginator } from "@angular/material/paginator";
import { Sort } from "@angular/material/sort";
import * as moment from "moment";

export class Helper {

  static sortData(sort: Sort, givenData: any, targetData: any) {
    const data = givenData.slice();
    if (!sort.active || sort.direction === '') {
      targetData = data;
      return;
    }

    const isAsc = sort.direction === 'asc';
    targetData = data.sort((a, b) => {
      return Helper.compare(a[sort.active], b[sort.active], isAsc);
    });
  }

  static compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  static showDate(timestamp: number) {
    return moment(timestamp).locale("ar").format("LL");
  }

  static enToAr(number: number | string) {
    const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    const numberString = String(number);

    let arabicNumber = "";
    for (let i = 0; i < numberString.length; i++) {
      const digit = parseInt(numberString[i], 10);
      if (!isNaN(digit)) {
        arabicNumber += arabicDigits[digit];
      } else {
        arabicNumber += numberString[i];
      }
    }

    return arabicNumber;
  }

  static arToEn(input: string) {
    const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    const englishNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

    // Replace each Arabic number with its corresponding English number
    for (let i = 0; i < arabicNumbers.length; i++) {
      const arabicRegex = new RegExp(arabicNumbers[i], "g");
      input = input.replace(arabicRegex, englishNumbers[i]);
    }

    return input;
  }
}
