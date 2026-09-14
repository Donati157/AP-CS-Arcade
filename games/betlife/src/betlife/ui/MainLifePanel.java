package betlife.ui;

import java.awt.BorderLayout;
import java.awt.event.ActionEvent;

import javax.swing.BoxLayout;
import javax.swing.JComponent;
import javax.swing.JPanel;

import betlife.game.BetLifeGame;
import betlife.game.Choice.FollowUp;
import betlife.game.Decision;
import betlife.ui.components.BottomNavigationBar;
import betlife.ui.components.CharacterStatusBar;
import betlife.ui.components.DecisionDialog;
import betlife.ui.components.GameHeader;
import betlife.ui.components.NavIcon;
import betlife.ui.components.StatsPanel;
import betlife.ui.components.TimelinePanel;

/**
 * The main life screen, top to bottom:
 * header, character status strip, life timeline, navigation bar with the Age button, stats.
 *
 * The panel owns no game data of its own. It reads from {@link BetLifeGame}
 * and asks it to change state when the player presses a button. Whatever changes,
 * {@link #refreshFromGameState()} brings the whole screen back in line with the model.
 */
public class MainLifePanel extends JPanel implements GameScreen {

    private final BetLifeGame game;
    private final ScreenNavigator navigator;
    private final CharacterStatusBar statusBar;
    private final TimelinePanel timelinePanel = new TimelinePanel();
    private final BottomNavigationBar navigationBar;
    private final StatsPanel statsPanel;

    public MainLifePanel(BetLifeGame game, ScreenNavigator navigator) {
        super(new BorderLayout());
        this.game = game;
        this.navigator = navigator;
        setBackground(Theme.BACKGROUND);

        statusBar = new CharacterStatusBar(game.getPlayer());
        statsPanel = new StatsPanel(game.getPlayer());
        navigationBar = new BottomNavigationBar(this::onNavigate, e -> onAgeUp());

        add(stackVertically(new GameHeader(e -> navigator.showMenu()), statusBar), BorderLayout.NORTH);
        add(timelinePanel, BorderLayout.CENTER);
        add(stackVertically(navigationBar, statsPanel), BorderLayout.SOUTH);
        refreshFromGameState();
    }

    private static JComponent stackVertically(JComponent top, JComponent bottom) {
        JPanel stack = new JPanel();
        stack.setLayout(new BoxLayout(stack, BoxLayout.Y_AXIS));
        stack.setOpaque(false);
        stack.add(top);
        stack.add(bottom);
        return stack;
    }

    /** Updates player info, money, stats, the journal and the navigation bar from the game state. */
    @Override
    public void refreshFromGameState() {
        statusBar.refresh(game.getPlayer());
        statsPanel.refresh(game.getPlayer());
        timelinePanel.showEvents(game.getTimeline());
        if (game.getEducation().isEnrolled()) {
            navigationBar.setEducationItem("School", NavIcon.SCHOOL);
        } else if (game.getCareer().isEmployed()) {
            navigationBar.setEducationItem("Career", NavIcon.CAREER);
        } else {
            navigationBar.setEducationItem("Jobs", NavIcon.CAREER);
        }
    }

    // ---- Reacting to the player ---------------------------------------------

    /** Ages one year, then asks the player any question the year raised. */
    private void onAgeUp() {
        // A year cannot end while a question from the previous one is still open.
        if (game.getPendingDecision() != null) {
            resolvePendingDecisions();
            return;
        }
        game.ageUp();
        refreshFromGameState();
        resolvePendingDecisions();
    }

    private void resolvePendingDecisions() {
        while (game.getPendingDecision() != null) {
            Decision decision = game.getPendingDecision();
            int choice = DecisionDialog.show(this, decision);
            FollowUp followUp = game.resolveDecision(choice);
            refreshFromGameState();
            if (followUp == FollowUp.UNIVERSITY) {
                navigator.showUniversity();
            } else if (followUp == FollowUp.JOBS) {
                navigator.showJobs();
            }
        }
    }

    /** Every side item of the navigation bar opens its own screen. */
    private void onNavigate(ActionEvent e) {
        switch (e.getActionCommand()) {
            case "School":
                navigator.showSchool();
                break;
            case "Career":
                navigator.showCareer();
                break;
            case "Jobs":
                navigator.showJobs();
                break;
            case "Assets":
                navigator.showAssets();
                break;
            case "Relationships":
                navigator.showRelationships();
                break;
            default:
                navigator.showActivities();
                break;
        }
    }
}
