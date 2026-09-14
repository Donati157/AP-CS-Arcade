package betlife.ui;

import betlife.game.BetLifeGame;
import betlife.model.Relationship;
import betlife.ui.components.ActivityIcon;
import betlife.ui.components.InfoRow;
import betlife.ui.components.StatBar;

/**
 * Detail screen for one person. The same panel is reused for everyone:
 * the navigator calls {@link #setRelationship(Relationship)} before showing it.
 */
public class RelationshipDetailPanel extends ActionScreen {

    private final InfoRow typeRow = new InfoRow("Relationship", "");
    private final StatBar levelBar;
    private Relationship relationship;

    public RelationshipDetailPanel(BetLifeGame game, ScreenNavigator navigator) {
        super(game, "Person", e -> navigator.showRelationships());
        addContent(typeRow);
        levelBar = addMeter("Closeness", 0);
        addActionsRow();

        addSection("Actions");
        addAction("Spend Time", "+5 Closeness, +2 Happiness", ActivityIcon.SUN, e -> onSpendTime());
        addAction("Compliment", "+3 Closeness, +1 Happiness", ActivityIcon.CHAT, e -> onCompliment());
        addAction("Argue", "-8 Closeness, -3 Happiness", ActivityIcon.ARROW_DOWN, e -> onArgue());
    }

    /** Chooses which person this screen is about. */
    public void setRelationship(Relationship relationship) {
        this.relationship = relationship;
        setTitle(relationship.getName());
        refreshFromGameState();
    }

    @Override
    public void refreshFromGameState() {
        if (relationship == null) {
            return;
        }
        typeRow.setValue(relationship.getType());
        levelBar.setValue(relationship.getLevel());
        updateActionsRow();
    }

    private void onSpendTime() {
        if (ensureActionAvailable()) {
            game.spendTime(relationship);
            refreshFromGameState();
            showFeedback("Good Time", "You and " + relationship.getFirstName()
                    + " had a great time together. Closeness +5, Happiness +2.");
        }
    }

    private void onCompliment() {
        if (ensureActionAvailable()) {
            game.compliment(relationship);
            refreshFromGameState();
            showFeedback("Nice Words", relationship.getFirstName()
                    + " appreciated the compliment. Closeness +3, Happiness +1.");
        }
    }

    private void onArgue() {
        if (ensureActionAvailable()) {
            game.argue(relationship);
            refreshFromGameState();
            showFeedback("Rough Moment", "You and " + relationship.getFirstName()
                    + " had an argument. Closeness -8, Happiness -3.");
        }
    }
}
