package betlife.model;

/**
 * The player's current employment: which job, how well it is going, and for how long.
 * When {@link #getJob()} is null the player is not employed.
 */
public class CareerState {

    private Job job;
    private int performance;   // 0-100
    private int yearsEmployed;
    private boolean workedHardThisYear;

    public boolean isEmployed() {
        return job != null;
    }

    public Job getJob() {
        return job;
    }

    public int getPerformance() {
        return performance;
    }

    public int getYearsEmployed() {
        return yearsEmployed;
    }

    public boolean hasWorkedHardThisYear() {
        return workedHardThisYear;
    }

    public void startJob(Job newJob) {
        job = newJob;
        performance = 70;
        yearsEmployed = 0;
        workedHardThisYear = false;
    }

    public void quit() {
        job = null;
        performance = 0;
        yearsEmployed = 0;
    }

    public void changePerformance(int amount) {
        performance = Math.max(Player.MIN_STAT, Math.min(Player.MAX_STAT, performance + amount));
        if (amount > 0) {
            workedHardThisYear = true;
        }
    }

    /** Called once per year: counts the year and forgets this year's effort flag. */
    public void completeYear() {
        yearsEmployed++;
        workedHardThisYear = false;
    }
}
