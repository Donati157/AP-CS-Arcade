package betlife.ui;

import betlife.BetLifeLauncher;
import betlife.game.BetLifeGame;
import betlife.ui.components.ActivityIcon;
import betlife.ui.components.InfoRow;

/**
 * The game menu behind the header's menu button: version information and the way out
 * of the game (exit standalone, or return to the arcade).
 */
public class MenuPanel extends ActionScreen {

    private final InfoRow characterRow = new InfoRow("Character", "");
    private final InfoRow ageRow = new InfoRow("Age", "");

    public MenuPanel(BetLifeGame game, ScreenNavigator navigator, String exitLabel, Runnable exitAction) {
        super(game, "Menu", e -> navigator.showMainLife());
        addContent(new InfoRow("Game", "BetLife " + BetLifeLauncher.VERSION));
        addContent(characterRow);
        addContent(ageRow);
        addSection("Options");
        addAction("About BetLife", "How the game works", ActivityIcon.INFO, e -> onAbout());
        addAction(exitLabel, "Leave the game", ActivityIcon.EXIT, e -> exitAction.run());
        refreshFromGameState();
    }

    @Override
    public void refreshFromGameState() {
        characterRow.setValue(game.getPlayer().getName());
        ageRow.setValue(game.getPlayer().getAge() + " years");
    }

    private void onAbout() {
        showFeedback("About BetLife", "BetLife " + BetLifeLauncher.VERSION
                + " is a life simulation built for the AP Computer Science Arcade. Press Age to move "
                + "through the years, and use your " + BetLifeGame.ACTIONS_PER_YEAR
                + " actions each year on school, work, activities and the people in your life.");
    }
}
