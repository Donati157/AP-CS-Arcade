package betlife.ui;

import betlife.game.BetLifeGame;
import betlife.ui.components.ActivityIcon;
import betlife.ui.components.StatBar;

/**
 * Recreation activities: free ways to have fun.
 */
public class RecreationPanel extends ActionScreen {

    private final StatBar happinessBar;
    private final StatBar healthBar;

    public RecreationPanel(BetLifeGame game, ScreenNavigator navigator) {
        super(game, "Recreation", e -> navigator.showActivities());
        happinessBar = addMeter("Happiness", 0);
        healthBar = addMeter("Health", 0);
        addActionsRow();

        addSection("Actions");
        addAction("Play a Game", "+4 Happiness", ActivityIcon.RECREATION, e -> onPlayGame());
        addAction("Spend Time Outside", "+2 Happiness, +2 Health", ActivityIcon.SUN, e -> onOutside());
        refreshFromGameState();
    }

    @Override
    public void refreshFromGameState() {
        happinessBar.setValue(game.getPlayer().getHappiness());
        healthBar.setValue(game.getPlayer().getHealth());
        updateActionsRow();
    }

    private void onPlayGame() {
        if (ensureActionAvailable()) {
            game.playGame();
            refreshFromGameState();
            showFeedback("Game On", "You had a blast playing games. Happiness +4.");
        }
    }

    private void onOutside() {
        if (ensureActionAvailable()) {
            game.spendTimeOutside();
            refreshFromGameState();
            showFeedback("Sunny Day", "Some fresh air did you good. Happiness +2, Health +2.");
        }
    }
}
