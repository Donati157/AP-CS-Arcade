package betlife.ui;

import betlife.game.BetLifeGame;
import betlife.ui.components.ActivityIcon;
import betlife.ui.components.StatBar;

/**
 * Mind & Body activities: small things that improve happiness and health.
 */
public class MindAndBodyPanel extends ActionScreen {

    private final StatBar happinessBar;
    private final StatBar healthBar;

    public MindAndBodyPanel(BetLifeGame game, ScreenNavigator navigator) {
        super(game, "Mind & Body", e -> navigator.showActivities());
        happinessBar = addMeter("Happiness", 0);
        healthBar = addMeter("Health", 0);
        addActionsRow();

        addSection("Actions");
        addAction("Meditate", "+4 Happiness, +1 Health", ActivityIcon.MIND_BODY, e -> onMeditate());
        addAction("Go for a Walk", "+3 Health, +2 Happiness", ActivityIcon.FOOTPRINTS, e -> onWalk());
        refreshFromGameState();
    }

    @Override
    public void refreshFromGameState() {
        happinessBar.setValue(game.getPlayer().getHappiness());
        healthBar.setValue(game.getPlayer().getHealth());
        updateActionsRow();
    }

    private void onMeditate() {
        if (ensureActionAvailable()) {
            game.meditate();
            refreshFromGameState();
            showFeedback("Calm Mind", "You took some quiet time to meditate. Happiness +4, Health +1.");
        }
    }

    private void onWalk() {
        if (ensureActionAvailable()) {
            game.goForWalk();
            refreshFromGameState();
            showFeedback("Fresh Air", "A long walk cleared your head. Health +3, Happiness +2.");
        }
    }
}
