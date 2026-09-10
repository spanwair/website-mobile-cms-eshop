import {
  daysInMonth,
  getCalendarMonthPeriod,
  calendarMonthPeriodFromDateString,
  previousCalendarMonth,
  isPeriodElapsed,
} from "@shared/utils/billingPeriod";

describe("daysInMonth", () => {
  it("returns 31 for a 31-day month (January)", () => {
    expect(daysInMonth(2026, 0)).toBe(31);
  });

  it("returns 30 for a 30-day month (April)", () => {
    expect(daysInMonth(2026, 3)).toBe(30);
  });

  it("returns 28 for February in a non-leap year", () => {
    expect(daysInMonth(2026, 1)).toBe(28);
  });

  it("returns 29 for February in a leap year", () => {
    expect(daysInMonth(2028, 1)).toBe(29);
  });

  it("returns 29 for the century-leap-year edge case (2000 was a leap year)", () => {
    expect(daysInMonth(2000, 1)).toBe(29);
  });

  it("returns 28 for the century-non-leap-year edge case (1900 was not a leap year)", () => {
    expect(daysInMonth(1900, 1)).toBe(28);
  });
});

describe("getCalendarMonthPeriod", () => {
  it("computes the 1st-to-31st boundaries for a 31-day month", () => {
    const period = getCalendarMonthPeriod(2026, 0); // January 2026
    expect(period.periodStart).toBe("2026-01-01");
    expect(period.periodEnd).toBe("2026-01-31");
    expect(period.rangeStartIso).toBe("2026-01-01T00:00:00.000Z");
    expect(period.rangeEndIso).toBe("2026-02-01T00:00:00.000Z");
  });

  it("computes the 1st-to-29th boundaries for February in a leap year", () => {
    const period = getCalendarMonthPeriod(2028, 1);
    expect(period.periodStart).toBe("2028-02-01");
    expect(period.periodEnd).toBe("2028-02-29");
    expect(period.rangeEndIso).toBe("2028-03-01T00:00:00.000Z");
  });

  it("computes the 1st-to-28th boundaries for February in a non-leap year", () => {
    const period = getCalendarMonthPeriod(2026, 1);
    expect(period.periodEnd).toBe("2026-02-28");
  });

  it("rolls the exclusive end into January of the next year for December", () => {
    const period = getCalendarMonthPeriod(2026, 11);
    expect(period.periodStart).toBe("2026-12-01");
    expect(period.periodEnd).toBe("2026-12-31");
    expect(period.rangeEndIso).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("calendarMonthPeriodFromDateString", () => {
  it("reconstructs the same period from a stored period_start", () => {
    const period = calendarMonthPeriodFromDateString("2026-02-01");
    expect(period.periodEnd).toBe("2026-02-28");
    expect(period.year).toBe(2026);
    expect(period.monthIndex0).toBe(1);
  });
});

describe("previousCalendarMonth", () => {
  it("returns the prior month within the same year", () => {
    expect(previousCalendarMonth(new Date(Date.UTC(2026, 8, 3)))).toEqual({
      year: 2026,
      monthIndex0: 7,
    });
  });

  it("rolls over into December of the prior year from January", () => {
    expect(previousCalendarMonth(new Date(Date.UTC(2026, 0, 15)))).toEqual({
      year: 2025,
      monthIndex0: 11,
    });
  });
});

describe("isPeriodElapsed", () => {
  it("is false while the period's last day has not fully passed yet", () => {
    const now = new Date("2026-02-15T12:00:00.000Z");
    expect(isPeriodElapsed("2026-02-28", now)).toBe(false);
  });

  it("is false exactly at the last instant of the period's last day", () => {
    const now = new Date("2026-02-28T23:59:59.999Z");
    expect(isPeriodElapsed("2026-02-28", now)).toBe(false);
  });

  it("is true the instant the next day begins", () => {
    const now = new Date("2026-03-01T00:00:00.000Z");
    expect(isPeriodElapsed("2026-02-28", now)).toBe(true);
  });
});
