package betlife.ui;

import betlife.game.BetLifeGame;
import betlife.game.BetLifeGame.PurchaseResult;
import betlife.model.ShopItem;
import betlife.ui.components.ActivityIcon;
import betlife.ui.components.InfoRow;
import betlife.ui.components.MoneyFormat;

/**
 * The shop: a short list of things the player can buy. Purchases become assets.
 */
public class ShoppingPanel extends ActionScreen {

    public ShoppingPanel(BetLifeGame game, ScreenNavigator navigator) {
        super(game, "Shopping", e -> navigator.showActivities());
        refreshFromGameState();
    }

    @Override
    public void refreshFromGameState() {
        clearContent();
        addContent(new InfoRow("Bank Balance", MoneyFormat.format(game.getPlayer().getMoney())));
        addSection("For sale");
        for (ShopItem item : game.getShopItems()) {
            String subtitle = MoneyFormat.format(item.getCost()) + "  ·  " + item.getType();
            if (game.ownsAsset(item.getName())) {
                subtitle = "Already owned";
            } else if (!item.isAvailableIn(game.getPlayer().getLifeStage())) {
                subtitle += "  ·  Adults only";
            }
            String icon = item.getName().contains("Car") ? ActivityIcon.CAR
                    : item.getName().contains("Bicycle") ? ActivityIcon.BIKE : ActivityIcon.SHOPPING;
            addAction(item.getName(), subtitle, icon, e -> onBuy(item));
        }
        revalidateContent();
    }

    private void onBuy(ShopItem item) {
        if (!item.isAvailableIn(game.getPlayer().getLifeStage())) {
            showFeedback("Not Yet", "You need to be an adult to buy a " + item.getName().toLowerCase() + ".");
            return;
        }
        PurchaseResult result = game.buy(item);
        refreshFromGameState();
        if (result == PurchaseResult.SUCCESS) {
            showFeedback("New Asset", "You bought a " + item.getName().toLowerCase() + " for "
                    + MoneyFormat.format(item.getCost()) + ".");
        } else if (result == PurchaseResult.ALREADY_OWNED) {
            showFeedback("Already Owned", "You already own a " + item.getName().toLowerCase() + ".");
        } else {
            showFeedback("Not Enough Money", "A " + item.getName().toLowerCase() + " costs "
                    + MoneyFormat.format(item.getCost()) + " and you cannot afford it right now.");
        }
    }
}
