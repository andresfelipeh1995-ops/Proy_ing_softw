package co.uis.investsim.savings.entity;

public enum CompoundingFrequency {
    DAILY(365),
    MONTHLY(12),
    QUARTERLY(4),
    ANNUALLY(1);

    private final int periodsPerYear;

    CompoundingFrequency(int periodsPerYear) {
        this.periodsPerYear = periodsPerYear;
    }

    public int getPeriodsPerYear() {
        return periodsPerYear;
    }
}
