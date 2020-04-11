const moment = require("moment");

module.exports = {
  endOfDay: function (date) {
    return moment.utc(date).endOf("day").format();
  },
  startOfDay: function (date) {
    return moment.utc(date).startOf("day").format();
  },
  utcDate: function (date, siteID) {
    return moment
      .utc(date, this.momentDateFormat(siteID))
      .startOf("day")
      .format();
  },
  localFormat: function (date, siteID) {
    if (date && siteID) {
      return moment(date, this.momentDateFormat(siteID)).format("LL");
    } else if (date) {
      return moment(date).format("LL");
    } else {
      return "";
    }
  },
  momentDateFormat: function momentDateFormat(siteID) {
    let dateFormat = "";
    switch (siteID) {
      case 0:
        dateFormat = "LLL";
        break;
      case 1:
        dateFormat = "D MMMM YYYY";
        break;
      case 2:
      case 4:
      case 5:
      case 7:
      case 8:
      case 10:
        dateFormat = "LL";
        break;
      case 3:
        dateFormat = "ddd, MM/DD/YYYY - H:mma";
        break;
      case 9:
        dateFormat = "MMMM Do, YYYY";
        break;
    }
    return dateFormat;
  },
};
