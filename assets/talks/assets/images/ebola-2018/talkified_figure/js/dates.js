
const dateFormat = d3.timeFormat("%b-%d");
/**
 * A custom date format that converts a decimal year float into "%Y-%m-%d" format
 * @param d
 * @return {string}
 */
export const customDateFormat = (d) => {

    return `${dateFormat(convertDecimalDate(d))}`;
};

export const yearFormat = (d) => {
    const dateFormat = d3.timeFormat("%Y-%m-%d");

    return `${dateFormat(convertDecimalDate(d))}`;
};



//https://stackoverflow.com/questions/29400171/how-do-i-convert-a-decimal-year-value-into-a-date-in-javascript
/**
 * Helper function to determine if the provided year is a leap year
 * @param year
 * @return {boolean}
 */
export function leapYear(year) {
    return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
}

/**
 * A function which converts a decimal float into a date object
 * @param decimalDate
 * @return {Date}
 */
export function convertDecimalDate(decimalDate) {
    var year = parseInt(decimalDate);
    var reminder = decimalDate - year;
    var daysPerYear = leapYear(year) ? 366 : 365;
    var miliseconds = reminder * daysPerYear * 24 * 60 * 60 * 1000;
    var yearDate = new Date(year, 0, 1);
    return new Date(yearDate.getTime() + miliseconds);
}


/**
 * A function that converts a date into a decimal.
 * @param date
 * @return {number}
 */
export function dateToDecimal(date){
    const numberOfDaysInYear = leapYear(date.getFullYear)? 366:365;
    return date.getFullYear()+d3.timeDay.count(d3.timeYear(date), date)/numberOfDaysInYear;
}