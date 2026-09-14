package betlife.ui;

import betlife.game.BetLifeGame;
import betlife.game.BetLifeGame.PurchaseResult;
import betlife.ui.components.ActivityIcon;
import betlife.ui.components.InfoRow;
import betlife.ui.components.MoneyFormat;
import betlife.ui.components.StatBar;

/**
 * The Doctor screen: a paid general checkup that improves health a little.
 */
public class DoctorPanel extends ActionScreen {

    private final StatBar healthBar;
    private final InfoRow balanceRow = new InfoRow("Bank Balance", "");

    public DoctorPanel(BetLifeGame game, ScreenNavigator navigator) {
        super(game, "Doctor", e -> navigator.showActivities());
        addContent(new InfoRow("Clinic", "Cedar Grove Family Clinic"));
        addContent(balanceRow);
        healthBar = addMeter("Health", game.getPlayer().getHealth());
        addActionsRow();
        addSection("Services");
        addAction("General Checkup", MoneyFormat.format(BetLifeGame.CHECKUP_COST) + "  ·  +3 Health",
                ActivityIcon.DOCTOR, e -> onCheckup());
        refreshFromGameState();
    }

    @Override
    public void refreshFromGameState() {
        healthBar.setValue(game.getPlayer().getHealth());
        balanceRow.setValue(MoneyFormat.format(game.getPlayer().getMoney()));
        updateActionsRow();
    }

    private void onCheckup() {
        if (!ensureActionAvailable()) {
            return;
        }
        PurchaseResult result = game.visitDoctor();
        refreshFromGameState();
        if (result == PurchaseResult.SUCCESS) {
            showFeedback("All Clear", "The doctor says you are doing well. Health +3.");
        } else if (result == PurchaseResult.NOT_ENOUGH_MONEY) {
            showFeedback("Not Enough Money", "A checkup costs " + MoneyFormat.format(BetLifeGame.CHECKUP_COST)
                    + " and you cannot afford it right now.");
        }
    }
}
