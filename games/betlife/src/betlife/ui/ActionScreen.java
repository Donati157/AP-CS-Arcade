package betlife.ui;

import java.awt.BorderLayout;
import java.awt.event.ActionListener;

import javax.swing.BorderFactory;
import javax.swing.JComponent;
import javax.swing.JPanel;

import betlife.game.BetLifeGame;
import betlife.ui.components.ActivityIcon;
import betlife.ui.components.BetLifeDialog;
import betlife.ui.components.InfoRow;
import betlife.ui.components.MenuListItem;
import betlife.ui.components.ScreenHeader;
import betlife.ui.components.ScrollColumn;
import betlife.ui.components.SectionLabel;
import betlife.ui.components.StatBar;

/**
 * Base for the secondary screens that share one shape: a red header with a back arrow,
 * a scrollable column holding a summary, and a list of action rows.
 * Subclasses add their own rows and implement {@link #refreshFromGameState()}.
 * The base also knows about the yearly action budget so every screen enforces it the same way.
 */
public abstract class ActionScreen extends JPanel implements GameScreen {

    private static final int ROW_ICON_SIZE = 20;

    protected final BetLifeGame game;
    private final ScreenHeader header;
    private final ScrollColumn column = new ScrollColumn();
    private InfoRow actionsRow;

    protected ActionScreen(BetLifeGame game, String title, ActionListener backAction) {
        super(new BorderLayout());
        this.game = game;
        setBackground(Theme.BACKGROUND);
        header = new ScreenHeader(title, backAction);
        column.setBorder(BorderFactory.createEmptyBorder(4, 0, 12, 0));
        add(header, BorderLayout.NORTH);
        add(column.createScrollPane(), BorderLayout.CENTER);
    }

    protected void setTitle(String title) {
        header.setTitle(title);
    }

    /** Adds any component (summary rows, meters) to the column. */
    protected void addContent(JComponent component) {
        component.setAlignmentX(LEFT_ALIGNMENT);
        column.add(component);
    }

    protected void addSection(String text) {
        column.add(new SectionLabel(text));
    }

    /** Adds a meter row with the standard side padding. */
    protected StatBar addMeter(String name, int value) {
        StatBar bar = new StatBar(name, value);
        bar.setBorder(BorderFactory.createEmptyBorder(6, Theme.SCREEN_PADDING, 4, Theme.SCREEN_PADDING));
        addContent(bar);
        return bar;
    }

    /** Adds the "actions remaining this year" line; {@link #updateActionsRow()} keeps it current. */
    protected void addActionsRow() {
        actionsRow = new InfoRow("Actions left this year", "");
        addContent(actionsRow);
        updateActionsRow();
    }

    protected void updateActionsRow() {
        if (actionsRow != null) {
            actionsRow.setValue(game.getActionsRemaining() + " of " + BetLifeGame.ACTIONS_PER_YEAR);
        }
    }

    /** Adds one tappable action row and returns it. */
    protected MenuListItem addAction(String title, String subtitle, String iconKind, ActionListener listener) {
        MenuListItem row = new MenuListItem(title, subtitle,
                new ActivityIcon(iconKind, ROW_ICON_SIZE, Theme.AGE_TEXT_TEAL));
        row.addActionListener(listener);
        row.setAlignmentX(LEFT_ALIGNMENT);
        column.add(row);
        return row;
    }

    /** Removes everything from the column, for screens that rebuild their rows on refresh. */
    protected void clearContent() {
        column.removeAll();
        actionsRow = null;
    }

    protected void revalidateContent() {
        column.revalidate();
        column.repaint();
    }

    /**
     * Call before any action that uses up one of the year's actions.
     * Explains and returns false when the year's budget is spent.
     */
    protected boolean ensureActionAvailable() {
        if (game.hasActionsLeft()) {
            return true;
        }
        BetLifeDialog.show(this, "Busy Year", "You've done a lot this year. Age up to continue.", "OK");
        return false;
    }

    /** Short BetLife-styled confirmation after an action. */
    protected void showFeedback(String title, String message) {
        BetLifeDialog.show(this, title, message, "Continue");
    }
}
