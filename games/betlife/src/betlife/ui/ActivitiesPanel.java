package betlife.ui;

import java.awt.event.ActionEvent;

import betlife.game.BetLifeGame;
import betlife.ui.components.ActivityIcon;

/**
 * The Activities screen: a list of activity categories, each opening its own screen.
 */
public class ActivitiesPanel extends ActionScreen {

    private final ScreenNavigator navigator;

    public ActivitiesPanel(BetLifeGame game, ScreenNavigator navigator) {
        super(game, "Activities", e -> navigator.showMainLife());
        this.navigator = navigator;
        addActionsRow();
        addSection("Categories");
        addAction("Mind & Body", "Take care of yourself", ActivityIcon.MIND_BODY, this::onRowSelected);
        addAction("Doctor", "Check on your health", ActivityIcon.DOCTOR, this::onRowSelected);
        addAction("Library", "Read and learn", ActivityIcon.LIBRARY, this::onRowSelected);
        addAction("Shopping", "Spend some money", ActivityIcon.SHOPPING, this::onRowSelected);
        addAction("Recreation", "Have some fun", ActivityIcon.RECREATION, this::onRowSelected);
    }

    @Override
    public void refreshFromGameState() {
        updateActionsRow();
    }

    private void onRowSelected(ActionEvent e) {
        switch (e.getActionCommand()) {
            case "Mind & Body":
                navigator.showMindAndBody();
                break;
            case "Doctor":
                navigator.showDoctor();
                break;
            case "Library":
                navigator.showLibrary();
                break;
            case "Shopping":
                navigator.showShopping();
                break;
            default:
                navigator.showRecreation();
                break;
        }
    }
}
