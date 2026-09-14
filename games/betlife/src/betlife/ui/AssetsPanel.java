package betlife.ui;

import betlife.game.BetLifeGame;
import betlife.model.Asset;
import betlife.ui.components.ActivityIcon;
import betlife.ui.components.InfoRow;
import betlife.ui.components.MoneyFormat;

/**
 * The Assets screen: a small financial overview and the things the player owns.
 * The summary is rebuilt from game state whenever the screen is shown.
 */
public class AssetsPanel extends ActionScreen {

    private final ScreenNavigator navigator;

    public AssetsPanel(BetLifeGame game, ScreenNavigator navigator) {
        super(game, "Assets", e -> navigator.showMainLife());
        this.navigator = navigator;
        refreshFromGameState();
    }

    @Override
    public void refreshFromGameState() {
        clearContent();
        addContent(new InfoRow("Bank Balance", MoneyFormat.format(game.getPlayer().getMoney())));
        addContent(new InfoRow("Net Worth", MoneyFormat.format(game.getNetWorth())));
        addContent(new InfoRow("Yearly expenses", MoneyFormat.format(game.yearlyExpenses())));
        if (game.getCareer().isEmployed()) {
            addContent(new InfoRow("Yearly salary", MoneyFormat.format(game.getCareer().getJob().getSalary())));
        }

        addSection("Owned Assets");
        if (game.getAssets().isEmpty()) {
            addContent(new InfoRow("None yet", ""));
        }
        for (Asset asset : game.getAssets()) {
            addContent(new InfoRow(asset.getName() + " (" + asset.getType() + ")",
                    MoneyFormat.format(asset.getValue())));
        }
        addSection("Actions");
        addAction("Go Shopping", "Browse things to buy", ActivityIcon.SHOPPING, e -> navigator.showShopping());
        revalidateContent();
    }
}
