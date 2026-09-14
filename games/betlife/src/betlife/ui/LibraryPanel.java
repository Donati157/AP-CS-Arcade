package betlife.ui;

import java.awt.BorderLayout;
import java.awt.Component;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.SwingConstants;

import betlife.game.BetLifeGame;
import betlife.ui.components.ActionButton;
import betlife.ui.components.ActivityIcon;
import betlife.ui.components.BetLifeDialog;
import betlife.ui.components.ScreenHeader;
import betlife.ui.components.TextButton;

/**
 * The Library activity screen: a short description, the player's current Smarts,
 * and the "Read a Book" action, which asks the game to improve Smarts and log the visit.
 */
public class LibraryPanel extends JPanel implements GameScreen {

    private static final int BIG_ICON_SIZE = 64;

    private final BetLifeGame game;
    private final JLabel smartsLabel = new JLabel();

    public LibraryPanel(BetLifeGame game, ScreenNavigator navigator) {
        super(new BorderLayout());
        this.game = game;
        setBackground(Theme.BACKGROUND);

        add(new ScreenHeader("Library", e -> navigator.showActivities()), BorderLayout.NORTH);
        add(createContent(navigator), BorderLayout.CENTER);
        refreshFromGameState();
    }

    private JPanel createContent(ScreenNavigator navigator) {
        JLabel icon = new JLabel(new ActivityIcon(ActivityIcon.LIBRARY, BIG_ICON_SIZE, Theme.AGE_TEXT_TEAL));
        JLabel title = new JLabel("Library");
        title.setFont(Theme.PAGE_TITLE);
        title.setForeground(Theme.PLAYER_NAME_TEAL);
        JLabel description = new JLabel("<html><div style='text-align:center'>"
                + "A quiet place full of books. Reading can improve your Smarts.</div></html>",
                SwingConstants.CENTER);
        description.setFont(Theme.BODY);
        description.setForeground(Theme.SECONDARY_TEXT);
        smartsLabel.setFont(Theme.STAT_LABEL);
        smartsLabel.setForeground(Theme.MUTED_TEXT);

        ActionButton readButton = new ActionButton("READ A BOOK");
        readButton.addActionListener(e -> onReadBook());
        TextButton backButton = new TextButton("Back");
        backButton.addActionListener(e -> navigator.showActivities());

        JPanel content = new JPanel();
        content.setLayout(new BoxLayout(content, BoxLayout.Y_AXIS));
        content.setOpaque(false);
        content.setBorder(BorderFactory.createEmptyBorder(40, 32, 24, 32));
        for (JComponent part : new JComponent[] {icon, title, description, smartsLabel, readButton, backButton}) {
            part.setAlignmentX(Component.CENTER_ALIGNMENT);
        }
        content.add(icon);
        content.add(Box.createVerticalStrut(14));
        content.add(title);
        content.add(Box.createVerticalStrut(8));
        content.add(description);
        content.add(Box.createVerticalStrut(6));
        content.add(smartsLabel);
        content.add(Box.createVerticalStrut(28));
        content.add(readButton);
        content.add(Box.createVerticalStrut(10));
        content.add(backButton);
        content.add(Box.createVerticalGlue());
        return content;
    }

    /** Re-reads the player's Smarts so the screen is current whenever it is shown. */
    @Override
    public void refreshFromGameState() {
        smartsLabel.setText("Smarts: " + game.getPlayer().getSmarts() + "%   ·   Actions left: "
                + game.getActionsRemaining() + " of " + BetLifeGame.ACTIONS_PER_YEAR);
    }

    private void onReadBook() {
        if (!game.hasActionsLeft()) {
            BetLifeDialog.show(this, "Busy Year", "You've done a lot this year. Age up to continue.", "OK");
            return;
        }
        game.readBook();
        refreshFromGameState();
        BetLifeDialog.show(this, "Well Read",
                "You spent some time reading and learned something new. Smarts +"
                        + BetLifeGame.READ_BOOK_SMARTS + ".",
                "Continue");
    }
}
