import { DateTime } from "luxon";

const timeMinute = 60 * 1000;
const timeHour = timeMinute * 60;

const bulletSeparator = " • ";

//Used in the sidebar
export function getLastUpdateStatusTime(date: Date): string {
  const dateNow = new Date();
  const timeDiff = dateNow.getTime() - date.getTime();

  //Just now (1 minute)
  if (timeDiff < timeMinute) {
    return "Just now";
  }

  //Within the hour
  if (timeDiff < timeHour) {
    const minutes = Math.floor(timeDiff / timeMinute);
    return `${minutes} min`;
  }

  //Within the day (14:11)
  if (checkSameDay(date, dateNow)) {
    return DateTime.fromJSDate(date).toLocaleString(DateTime.TIME_SIMPLE)!;
    //return dayjs(date).format('LT');
  }

  //Within the week (Sun)
  {
    const compareDate = new Date(
      dateNow.getFullYear(),
      dateNow.getMonth(),
      dateNow.getDate() - 7
    ); //Today (now) -> One week ago
    if (compareDates(date, compareDate) > 0) {
      return DateTime.fromJSDate(date).toFormat("ccc");
      //return dayjs(date).format("ddd");
    }
  }

  //Within the year (Dec 9)
  {
    const compareDate = new Date(
      dateNow.getFullYear() - 1,
      dateNow.getMonth(),
      dateNow.getDate()
    ); //Today (now) -> One year ago
    if (compareDates(date, compareDate) > 0) {
      return DateTime.fromJSDate(date).toFormat("LLL d");
      //return dayjs(date).format("MMM D");
    }
  }

  //Anytime (Dec 2018)
  //return dayjs(date).format("MMM YYYY")
  return DateTime.fromJSDate(date).toFormat("LLL yyyy");
}

//Used in time separators between messages
export function getTimeDivider(date: Date): string {
  const dateNow = new Date();
  const luxon = DateTime.fromJSDate(date);
  const formattedTime = luxon.toLocaleString(DateTime.TIME_SIMPLE)!;
  //const formattedTime = dayjs(date).format('LT');

  //Same day (12:30)
  if (checkSameDay(date, dateNow)) {
    return formattedTime;
  }

  //Yesterday (Yesterday • 12:30)
  {
    const compareDate = new Date(
      dateNow.getFullYear(),
      dateNow.getMonth(),
      dateNow.getDate() - 1
    ); //Today (now) -> Yesterday
    if (checkSameDay(date, compareDate)) {
      return "Yesterday" + bulletSeparator + formattedTime;
    }
  }

  //Same 7-day period (Sunday • 12:30)
  {
    const compareDate = new Date(
      dateNow.getFullYear(),
      dateNow.getMonth(),
      dateNow.getDate() - 7
    ); //Today (now) -> One week ago
    if (compareDates(date, compareDate) > 0) {
      return luxon.toFormat("cccc") + bulletSeparator + formattedTime;
      //return dayjs(date).format("dddd") + bulletSeparator + formattedTime;
    }
  }

  //Same year (Sunday, December 9 • 12:30)
  {
    const compareDate = new Date(
      dateNow.getFullYear() - 1,
      dateNow.getMonth(),
      dateNow.getDate()
    ); //Today (now) -> One year ago
    if (compareDates(date, compareDate) > 0) {
      return luxon.toFormat("cccc, LLLL d") + bulletSeparator + formattedTime;
      //return dayjs(date).format("dddd, MMMM D") + bulletSeparator + formattedTime;
    }
  }

  //Different years (December 9, 2018 • 12:30)
  return luxon.toFormat("LLLL d, yyyy") + bulletSeparator + formattedTime;
  //return dayjs(date).format("ll") + bulletSeparator + formattedTime;
}

//Used in read receipts
export function getDeliveryStatusTime(date: Date): string {
  const dateNow = new Date();
  const luxon = DateTime.fromJSDate(date);
  const formattedTime = luxon.toLocaleString(DateTime.TIME_SIMPLE)!;

  //Same day (12:30)
  if (checkSameDay(date, dateNow)) {
    return formattedTime;
  }

  //Yesterday (Yesterday)
  {
    const compareDate = new Date(
      dateNow.getFullYear(),
      dateNow.getMonth(),
      dateNow.getDate() - 1
    ); //Today (now) -> Yesterday
    if (checkSameDay(date, compareDate)) {
      return "Yesterday";
    }
  }

  //Same 7-day period (Sunday)
  {
    const compareDate = new Date(
      dateNow.getFullYear(),
      dateNow.getMonth(),
      dateNow.getDate() - 7
    ); //Today (now) -> One week ago
    if (compareDates(date, compareDate) > 0) {
      return luxon.toFormat("cccc");
    }
  }

  //Same year (Dec 9)
  {
    const compareDate = new Date(
      dateNow.getFullYear() - 1,
      dateNow.getMonth(),
      dateNow.getDate()
    ); //Today (now) -> One year ago
    if (compareDates(date, compareDate) > 0) {
      return luxon.toFormat("LLL d");
    }
  }

  //Different years (Dec 9, 2018)
  return luxon.toFormat("LLL d, yyyy") + bulletSeparator + formattedTime;
}

function checkSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function compareDates(date1: Date, date2: Date): number {
  if (date1.getFullYear() < date2.getFullYear()) return -1;
  else if (date1.getFullYear() > date2.getFullYear()) return 1;
  else if (date1.getMonth() < date2.getMonth()) return -1;
  else if (date1.getMonth() > date2.getMonth()) return 1;
  else if (date1.getDate() < date2.getDate()) return -1;
  else if (date1.getDate() > date2.getDate()) return 1;
  else return 0;
}
