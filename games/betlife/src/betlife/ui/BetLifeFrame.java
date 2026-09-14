package betlife.ui;

import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;

import javax.swing.JFrame;

import betlife.game.BetLifeGame;

/**
 * The BetLife window. It shows the {@link ScreenNavigator}'s container, which holds
 * every screen of the game, and keeps a fixed phone-like portrait size.
 *
 * Leaving the game always goes through disposing this window: the menu's exit row
 * disposes it, and so does the window's close button. When the window has closed,
 * the exit callback runs exactly once so an arcade can take over again.
 */
public class BetLifeFrame extends JFrame {

    private final Runnable onExit;
    private boolean exitReported;

    /**
     * @param exitLabel text of the menu row that leaves the game, e.g. "Return to Arcade"
     * @param onExit    run once after the window has closed
     */
    public BetLifeFrame(BetLifeGame game, String exitLabel, Runnable onExit) {
        super("BetLife");
        this.onExit = onExit;
        // Dispose instead of exiting the JVM so an arcade sharing the JVM keeps running.
        setDefaultCloseOperation(DISPOSE_ON_CLOSE);
        ScreenNavigator navigator = new ScreenNavigator(game, exitLabel, this::dispose);
        setContentPane(navigator.getContainer());
        navigator.showMainLife();
        setSize(Theme.WINDOW_WIDTH, Theme.WINDOW_HEIGHT);
        setResizable(false);
        setLocationRelativeTo(null);
        addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosed(WindowEvent e) {
                reportExit();
            }
        });
    }

    private void reportExit() {
        if (!exitReported) {
            exitReported = true;
            onExit.run();
        }
    }
}
