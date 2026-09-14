package betlife.ui;

import betlife.game.BetLifeGame;
import betlife.model.Relationship;
import betlife.ui.components.RelationshipListItem;

/**
 * The Relationships screen: everyone in the player's life, one row each.
 * Rows are rebuilt from the game's list whenever the screen is shown.
 */
public class RelationshipsPanel extends ActionScreen {

    private final ScreenNavigator navigator;

    public RelationshipsPanel(BetLifeGame game, ScreenNavigator navigator) {
        super(game, "Relationships", e -> navigator.showMainLife());
        this.navigator = navigator;
        refreshFromGameState();
    }

    @Override
    public void refreshFromGameState() {
        clearContent();
        addActionsRow();
        addSection("Family");
        addRows(true);
        addSection("Friends");
        addRows(false);
        revalidateContent();
    }

    /** Adds one row per person, either the family members or the friends. */
    private void addRows(boolean family) {
        for (Relationship relationship : game.getRelationships()) {
            if (relationship.isFamily() == family) {
                RelationshipListItem row = new RelationshipListItem(relationship);
                row.addActionListener(e -> navigator.showRelationship(relationship));
                addContent(row);
            }
        }
    }
}
