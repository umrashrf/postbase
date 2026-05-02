import moment from 'moment';

export const formatDateTime = (datetime, timezoneOffset) => {
    const mDate = moment(datetime);
    let today = moment();

    if (timezoneOffset) {
        today = today.utcOffset(timezoneOffset);
    }

    if (mDate.isSame(today, "day")) {
        return "Today, " + mDate.format("MMM D") + " at " + mDate.format("hh:mma");
    } else if (mDate.isSame(today.clone().add(1, "day"), "day")) {
        return "Tomorrow, " + mDate.format("MMM D") + " at " + mDate.format("hh:mma");
    } else {
        return mDate.format("ddd, MMM D") + " at " + mDate.format("hh:mma");
    }
};
