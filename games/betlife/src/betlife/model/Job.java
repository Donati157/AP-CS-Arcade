package betlife.model;

/**
 * A position the player can apply for. Requirements are deliberately simple:
 * a minimum age, whether a high school diploma is needed, and optionally a degree
 * that can be replaced by very high Smarts.
 */
public class Job {

    private final String title;
    private final String company;
    private final int salary;
    private final int minAge;
    private final boolean requiresDiploma;
    private final String requiredDegree;   // null when any education is fine
    private final int smartsInsteadOfDegree; // 0 when Smarts cannot replace the degree

    public Job(String title, String company, int salary, int minAge,
               boolean requiresDiploma, String requiredDegree, int smartsInsteadOfDegree) {
        this.title = title;
        this.company = company;
        this.salary = salary;
        this.minAge = minAge;
        this.requiresDiploma = requiresDiploma;
        this.requiredDegree = requiredDegree;
        this.smartsInsteadOfDegree = smartsInsteadOfDegree;
    }

    public String getTitle() {
        return title;
    }

    public String getCompany() {
        return company;
    }

    /** Yearly gross salary in dollars. */
    public int getSalary() {
        return salary;
    }

    public boolean meetsRequirements(Player player, EducationState education) {
        if (player.getAge() < minAge) {
            return false;
        }
        if (requiresDiploma && !education.isHighSchoolGraduate()) {
            return false;
        }
        if (requiredDegree == null) {
            return true;
        }
        boolean hasDegree = requiredDegree.equals(education.getDegree());
        boolean smartEnough = smartsInsteadOfDegree > 0 && player.getSmarts() >= smartsInsteadOfDegree;
        return hasDegree || smartEnough;
    }

    /** Human-readable requirement for the job list. */
    public String getRequirementText() {
        if (requiredDegree != null) {
            String text = requiredDegree + " degree";
            if (smartsInsteadOfDegree > 0) {
                text += " or Smarts " + smartsInsteadOfDegree + "+";
            }
            return text;
        }
        if (requiresDiploma) {
            return "High school diploma";
        }
        return "Age " + minAge + "+";
    }
}
