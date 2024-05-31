function leapYear(year) {
    return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
}
function decimalToDate(decimal){
    const year = Math.trunc(decimal);
    const totalNumberOfDays = leapYear(year)? 366:365;
    const day = Math.round(((decimal-year)*totalNumberOfDays));
    return d3.timeParse("%Y-%j")(`${year}-${day}`)

}
const customFormat =(f)=> (d) => {
    const dateFormat = d3.timeFormat(f);
    return `${dateFormat(decimalToDate(d))}`;
};