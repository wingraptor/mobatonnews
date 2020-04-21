const moment = require("moment");

module.exports = {
  endOfDay: function (date) {
    return moment.utc(date).endOf("day").format();
  },
  startOfDay: function (date) {
    return moment.utc(date).startOf("day").format();
  },
  utcDate: function (date, siteID, offset) {
    if (offset) {
      return moment
        .utc(date, this.momentDateFormat(siteID))
        .startOf("day")
        .utcOffset(-5)
        .format();
    } else {
      return moment
        .utc(date, this.momentDateFormat(siteID))
        .startOf("day")
        .format();
    }
  },
  localFormat: function (date, siteID) {
    if (date && siteID >= 0) {
      return moment(date, this.momentDateFormat(siteID)).format("LL");
    } else if (date) {
      return moment(date).format("LL");
    } else {
      throw "Error converting date to local format";
    }
  },
  momentDateFormat: function momentDateFormat(siteID) {
    let dateFormat = "";
    switch (siteID) {
      case 0:
        dateFormat = "YYYY-MM-DD";
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
      case 100:
        dateFormat = "LL";
        break;
      case 3:
        dateFormat = "ddd, MM/DD/YYYY - H:mma";
        break;
      case 9:
        dateFormat = "MMMM Do, YYYY";
        break;
      case 6:
        dateFormat = "YYYY-MM-DD";
        break;
      default:
        throw `No date format found for the specified website - siteID: ${siteID}`;
    }
    return dateFormat;
  },
};
