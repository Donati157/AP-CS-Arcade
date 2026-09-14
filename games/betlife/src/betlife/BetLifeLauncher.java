package betlife;

import javax.swing.SwingUtilities;
import javax.swing.UIManager;

import betlife.game.BetLifeGame;
import betlife.ui.BetLifeFrame;

/**
 * The public way to start BetLife. This is the only class the arcade needs to know about.
 *
 * <ul>
 *   <li>{@link #launchStandalone()} opens the game in its own window; closing the window ends the game
 *       and, when nothing else is open, lets the JVM exit on its own.</li>
 *   <li>{@link #launchFromArcade(Runnable)} opens the game for the arcade; when the player leaves
 *       (menu "Return to Arcade" or closing the window) the window is disposed and the callback runs,
 *       so the arcade gets control back without the JVM terminating.</li>
 * </ul>
 * BetLife never calls {@code System.exit}. One BetLife window at a time is supported.
 */
public final class BetLifeLauncher {

    public static final String VERSION = "1.0.0";

    private BetLifeLauncher() {
        // Static entry points only.
    }

    /** Opens BetLife as its own application. */
    public static void launchStandalone() {
        launch("Exit BetLife", () -> { });
    }

    /**
     * Opens BetLife on behalf of the arcade.
     *
     * @param onExitToArcade run on the Swing thread after the BetLife window has closed
     */
    public static void launchFromArcade(Runnable onExitToArcade) {
        launch("Return to Arcade", onExitToArcade);
    }

    private static void launch(String exitLabel, Runnable onExit) {
        SwingUtilities.invokeLater(() -> {
            applySystemLookAndFeel();
            BetLifeGame game = new BetLifeGame();
            BetLifeFrame frame = new BetLifeFrame(game, exitLabel, onExit);
            frame.setVisible(true);
        });
    }

    private static void applySystemLookAndFeel() {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception e) {
            // The default look and feel is acceptable; only the styling changes.
        }
    }
}
