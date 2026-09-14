package betlife.ui;

import betlife.game.BetLifeGame;
import betlife.model.EducationState;
import betlife.ui.components.ActivityIcon;
import betlife.ui.components.InfoRow;

/**
 * Major selection for university. Picking a major enrolls the player and returns to the main screen.
 */
public class UniversityPanel extends ActionScreen {

    private static final String[] MAJOR_NOTES = {
        "Software, algorithms and problem solving",
        "Management, marketing and finance",
        "Life sciences and laboratory work",
        "Drawing, design and creative practice"};

    public UniversityPanel(BetLifeGame game, ScreenNavigator navigator) {
        super(game, "University", e -> navigator.showMainLife());
        addContent(new InfoRow("University", EducationState.UNIVERSITY_NAME));
        addContent(new InfoRow("Length", EducationState.UNIVERSITY_YEARS + " years"));
        addSection("Choose a major");
        for (int i = 0; i < BetLifeGame.MAJORS.length; i++) {
            String major = BetLifeGame.MAJORS[i];
            addAction(major, MAJOR_NOTES[i], ActivityIcon.SCHOOL_CAP, e -> onChooseMajor(major, navigator));
        }
    }

    @Override
    public void refreshFromGameState() {
        // The list of majors never changes.
    }

    private void onChooseMajor(String major, ScreenNavigator navigator) {
        game.enrollInUniversity(major);
        showFeedback("Enrolled", "Welcome to " + EducationState.UNIVERSITY_NAME
                + "! You are now studying " + major + ".");
        navigator.showMainLife();
    }
}
