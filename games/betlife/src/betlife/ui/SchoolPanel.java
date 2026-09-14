package betlife.ui;

import betlife.game.BetLifeGame;
import betlife.model.EducationState;
import betlife.ui.components.ActivityIcon;
import betlife.ui.components.InfoRow;

/**
 * The education screen. It shows high school or university depending on where the
 * player is enrolled, so its rows are rebuilt every time it is shown.
 */
public class SchoolPanel extends ActionScreen {

    public SchoolPanel(BetLifeGame game, ScreenNavigator navigator) {
        super(game, "School", e -> navigator.showMainLife());
        refreshFromGameState();
    }

    @Override
    public void refreshFromGameState() {
        EducationState education = game.getEducation();
        clearContent();
        setTitle(education.getStage() == EducationState.Stage.UNIVERSITY ? "University" : "School");

        addContent(new InfoRow("School", education.getSchoolName()));
        if (education.isEnrolled()) {
            addContent(new InfoRow(education.getStage() == EducationState.Stage.UNIVERSITY ? "Year" : "Grade",
                    education.getYearLabel()));
        }
        if (education.getMajor() != null) {
            addContent(new InfoRow("Major", education.getMajor()));
        }
        addMeter("Performance", education.getPerformance());
        addMeter("Smarts", game.getPlayer().getSmarts());
        addActionsRow();

        addSection("Actions");
        if (education.getStage() == EducationState.Stage.HIGH_SCHOOL) {
            addAction("Study Harder", "+5 Performance, +2 Smarts", ActivityIcon.ARROW_UP, e -> onStudyHarder());
            addAction("Skip Studying", "-5 Performance, +2 Happiness", ActivityIcon.ARROW_DOWN, e -> onSkipStudying());
            addAction("Visit School Library", "+2 Smarts, +2 Performance", ActivityIcon.LIBRARY, e -> onVisitLibrary());
        } else if (education.getStage() == EducationState.Stage.UNIVERSITY) {
            addAction("Study Harder", "+5 Performance, +2 Smarts", ActivityIcon.ARROW_UP, e -> onStudyHarder());
            addAction("Attend Class", "+4 Performance, +1 Smarts", ActivityIcon.SCHOOL_CAP, e -> onAttendClass());
            addAction("Skip Class", "-6 Performance, +3 Happiness", ActivityIcon.ARROW_DOWN, e -> onSkipClass());
            addAction("Visit Library", "+2 Smarts, +2 Performance", ActivityIcon.LIBRARY, e -> onVisitLibrary());
        } else {
            addContent(new InfoRow("Status", "Not enrolled"));
        }
        revalidateContent();
    }

    private void onStudyHarder() {
        if (ensureActionAvailable()) {
            game.studyHarder();
            refreshFromGameState();
            showFeedback("Study Complete", "You put in the extra hours. Performance +5, Smarts +2.");
        }
    }

    private void onSkipStudying() {
        if (ensureActionAvailable()) {
            game.skipStudying();
            refreshFromGameState();
            showFeedback("Free Time", "You took the evening off. Performance -5, Happiness +2.");
        }
    }

    private void onVisitLibrary() {
        if (ensureActionAvailable()) {
            game.visitSchoolLibrary();
            refreshFromGameState();
            showFeedback("Quiet Study", "You studied in the library. Smarts +2, Performance +2.");
        }
    }

    private void onAttendClass() {
        if (ensureActionAvailable()) {
            game.attendClass();
            refreshFromGameState();
            showFeedback("Front Row", "You attended every lecture. Performance +4, Smarts +1.");
        }
    }

    private void onSkipClass() {
        if (ensureActionAvailable()) {
            game.skipClass();
            refreshFromGameState();
            showFeedback("Campus Life", "You skipped a few classes. Performance -6, Happiness +3.");
        }
    }
}
