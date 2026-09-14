package betlife.model;

/**
 * Where the player is in their education: high school, university, or not enrolled,
 * plus what they have already completed. One object per player, updated every year.
 */
public class EducationState {

    /** What the player is currently enrolled in. */
    public enum Stage { HIGH_SCHOOL, UNIVERSITY, NONE }

    public static final String HIGH_SCHOOL_NAME = "BetLife High School";
    public static final String UNIVERSITY_NAME = "Harborview University";
    public static final int LAST_HIGH_SCHOOL_GRADE = 12;
    public static final int UNIVERSITY_YEARS = 4;

    private Stage stage;
    private int year;          // grade number in high school, year number at university
    private int performance;   // 0-100
    private String major;      // only while at university or after graduating from it
    private boolean highSchoolGraduate;
    private String degree;     // null until a university degree is earned

    public EducationState(Stage stage, int year, int performance) {
        this.stage = stage;
        this.year = year;
        this.performance = clamp(performance);
    }

    public Stage getStage() {
        return stage;
    }

    public boolean isEnrolled() {
        return stage != Stage.NONE;
    }

    public int getYear() {
        return year;
    }

    public int getPerformance() {
        return performance;
    }

    public void changePerformance(int amount) {
        performance = clamp(performance + amount);
    }

    public String getMajor() {
        return major;
    }

    public boolean isHighSchoolGraduate() {
        return highSchoolGraduate;
    }

    /** The university degree earned, or null. */
    public String getDegree() {
        return degree;
    }

    public boolean hasDegree() {
        return degree != null;
    }

    public String getSchoolName() {
        switch (stage) {
            case HIGH_SCHOOL:
                return HIGH_SCHOOL_NAME;
            case UNIVERSITY:
                return UNIVERSITY_NAME;
            default:
                return "Not enrolled";
        }
    }

    /** Short line for screens, e.g. "11th Grade" or "Year 2". */
    public String getYearLabel() {
        switch (stage) {
            case HIGH_SCHOOL:
                return year + ordinalSuffix(year) + " Grade";
            case UNIVERSITY:
                return "Year " + year;
            default:
                return "";
        }
    }

    public void enrollInUniversity(String chosenMajor) {
        stage = Stage.UNIVERSITY;
        year = 1;
        major = chosenMajor;
        performance = 75;
    }

    /**
     * Moves one school year forward. Returns true when this step completed the current
     * program (high school or university); the caller records the graduation.
     */
    public boolean advanceYear() {
        if (stage == Stage.HIGH_SCHOOL) {
            if (year >= LAST_HIGH_SCHOOL_GRADE) {
                highSchoolGraduate = true;
                stage = Stage.NONE;
                return true;
            }
            year++;
        } else if (stage == Stage.UNIVERSITY) {
            if (year >= UNIVERSITY_YEARS) {
                degree = major;
                stage = Stage.NONE;
                return true;
            }
            year++;
        }
        return false;
    }

    private static String ordinalSuffix(int number) {
        if (number == 11 || number == 12 || number == 13) {
            return "th";
        }
        switch (number % 10) {
            case 1:
                return "st";
            case 2:
                return "nd";
            case 3:
                return "rd";
            default:
                return "th";
        }
    }

    private static int clamp(int value) {
        return Math.max(Player.MIN_STAT, Math.min(Player.MAX_STAT, value));
    }
}
