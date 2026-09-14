package betlife.ui;

import betlife.game.BetLifeGame;
import betlife.model.EducationState;
import betlife.model.Job;
import betlife.ui.components.ActivityIcon;
import betlife.ui.components.InfoRow;
import betlife.ui.components.MoneyFormat;

/**
 * The job board: open positions with salary and requirements. Applying is deterministic:
 * meet the requirements and you are hired.
 */
public class JobsPanel extends ActionScreen {

    private final ScreenNavigator navigator;

    public JobsPanel(BetLifeGame game, ScreenNavigator navigator) {
        super(game, "Jobs", e -> navigator.showMainLife());
        this.navigator = navigator;
        refreshFromGameState();
    }

    @Override
    public void refreshFromGameState() {
        EducationState education = game.getEducation();
        clearContent();
        addContent(new InfoRow("Education", educationSummary(education)));
        addContent(new InfoRow("Smarts", game.getPlayer().getSmarts() + "%"));
        if (education.isHighSchoolGraduate() && !education.hasDegree() && !education.isEnrolled()) {
            addSection("Education");
            addAction("Enroll in University", "Four years, choose a major", ActivityIcon.SCHOOL_CAP,
                    e -> navigator.showUniversity());
        }
        addSection("Open positions");
        for (Job job : game.getAvailableJobs()) {
            String subtitle = job.getCompany() + "  ·  " + MoneyFormat.format(job.getSalary()) + "  ·  "
                    + job.getRequirementText();
            addAction(job.getTitle(), subtitle, ActivityIcon.BRIEFCASE, e -> onApply(job));
        }
        revalidateContent();
    }

    private static String educationSummary(EducationState education) {
        if (education.hasDegree()) {
            return education.getDegree() + " degree";
        }
        if (education.isHighSchoolGraduate()) {
            return "High school diploma";
        }
        return "High school student";
    }

    private void onApply(Job job) {
        if (game.applyForJob(job)) {
            showFeedback("You're Hired!", "Congratulations! You start as a " + job.getTitle()
                    + " at " + job.getCompany() + " earning " + MoneyFormat.format(job.getSalary()) + " a year.");
            navigator.showMainLife();
        } else {
            showFeedback("Not Qualified", "This position requires: " + job.getRequirementText() + ".");
        }
    }
}
