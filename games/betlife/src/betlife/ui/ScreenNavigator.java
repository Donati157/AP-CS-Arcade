package betlife.ui;

import java.awt.CardLayout;

import javax.swing.JPanel;

import betlife.game.BetLifeGame;
import betlife.model.Relationship;

/**
 * Switches between BetLife's screens. Every screen is created once, shares the same
 * {@link BetLifeGame}, and is refreshed from the game state right before it is shown.
 * Screens call these methods to move around instead of reaching into the window.
 */
public class ScreenNavigator {

    private static final String MAIN_LIFE = "mainLife";
    private static final String SCHOOL = "school";
    private static final String UNIVERSITY = "university";
    private static final String JOBS = "jobs";
    private static final String CAREER = "career";
    private static final String ASSETS = "assets";
    private static final String RELATIONSHIPS = "relationships";
    private static final String RELATIONSHIP_DETAIL = "relationshipDetail";
    private static final String ACTIVITIES = "activities";
    private static final String LIBRARY = "library";
    private static final String MIND_AND_BODY = "mindAndBody";
    private static final String DOCTOR = "doctor";
    private static final String SHOPPING = "shopping";
    private static final String RECREATION = "recreation";
    private static final String MENU = "menu";

    private final CardLayout cards = new CardLayout();
    private final JPanel container = new JPanel(cards);

    private final MainLifePanel mainLifePanel;
    private final SchoolPanel schoolPanel;
    private final UniversityPanel universityPanel;
    private final JobsPanel jobsPanel;
    private final CareerPanel careerPanel;
    private final AssetsPanel assetsPanel;
    private final RelationshipsPanel relationshipsPanel;
    private final RelationshipDetailPanel relationshipDetailPanel;
    private final ActivitiesPanel activitiesPanel;
    private final LibraryPanel libraryPanel;
    private final MindAndBodyPanel mindAndBodyPanel;
    private final DoctorPanel doctorPanel;
    private final ShoppingPanel shoppingPanel;
    private final RecreationPanel recreationPanel;
    private final MenuPanel menuPanel;

    /**
     * @param exitLabel  text of the menu row that leaves the game
     * @param exitAction what leaving the game does (the window disposes itself)
     */
    public ScreenNavigator(BetLifeGame game, String exitLabel, Runnable exitAction) {
        mainLifePanel = new MainLifePanel(game, this);
        schoolPanel = new SchoolPanel(game, this);
        universityPanel = new UniversityPanel(game, this);
        jobsPanel = new JobsPanel(game, this);
        careerPanel = new CareerPanel(game, this);
        assetsPanel = new AssetsPanel(game, this);
        relationshipsPanel = new RelationshipsPanel(game, this);
        relationshipDetailPanel = new RelationshipDetailPanel(game, this);
        activitiesPanel = new ActivitiesPanel(game, this);
        libraryPanel = new LibraryPanel(game, this);
        mindAndBodyPanel = new MindAndBodyPanel(game, this);
        doctorPanel = new DoctorPanel(game, this);
        shoppingPanel = new ShoppingPanel(game, this);
        recreationPanel = new RecreationPanel(game, this);
        menuPanel = new MenuPanel(game, this, exitLabel, exitAction);

        container.add(mainLifePanel, MAIN_LIFE);
        container.add(schoolPanel, SCHOOL);
        container.add(universityPanel, UNIVERSITY);
        container.add(jobsPanel, JOBS);
        container.add(careerPanel, CAREER);
        container.add(assetsPanel, ASSETS);
        container.add(relationshipsPanel, RELATIONSHIPS);
        container.add(relationshipDetailPanel, RELATIONSHIP_DETAIL);
        container.add(activitiesPanel, ACTIVITIES);
        container.add(libraryPanel, LIBRARY);
        container.add(mindAndBodyPanel, MIND_AND_BODY);
        container.add(doctorPanel, DOCTOR);
        container.add(shoppingPanel, SHOPPING);
        container.add(recreationPanel, RECREATION);
        container.add(menuPanel, MENU);
    }

    /** The panel holding all screens; the window shows this. */
    public JPanel getContainer() {
        return container;
    }

    public void showMainLife() {
        show(mainLifePanel, MAIN_LIFE);
    }

    public void showSchool() {
        show(schoolPanel, SCHOOL);
    }

    public void showUniversity() {
        show(universityPanel, UNIVERSITY);
    }

    public void showJobs() {
        show(jobsPanel, JOBS);
    }

    public void showCareer() {
        show(careerPanel, CAREER);
    }

    public void showAssets() {
        show(assetsPanel, ASSETS);
    }

    public void showRelationships() {
        show(relationshipsPanel, RELATIONSHIPS);
    }

    /** Opens the shared detail screen for one person. */
    public void showRelationship(Relationship relationship) {
        relationshipDetailPanel.setRelationship(relationship);
        cards.show(container, RELATIONSHIP_DETAIL);
    }

    public void showActivities() {
        show(activitiesPanel, ACTIVITIES);
    }

    public void showLibrary() {
        show(libraryPanel, LIBRARY);
    }

    public void showMindAndBody() {
        show(mindAndBodyPanel, MIND_AND_BODY);
    }

    public void showDoctor() {
        show(doctorPanel, DOCTOR);
    }

    public void showShopping() {
        show(shoppingPanel, SHOPPING);
    }

    public void showRecreation() {
        show(recreationPanel, RECREATION);
    }

    public void showMenu() {
        show(menuPanel, MENU);
    }

    /** Refreshes a state-dependent screen, then shows it. */
    private void show(GameScreen screen, String cardName) {
        screen.refreshFromGameState();
        cards.show(container, cardName);
    }
}
