package arcade;

import javax.swing.JFrame;

import betlife.BetLifeLauncher;

/**
 * The arcade window. It shows the home screen and hands control to a game when the player
 * picks one. While a game is open the arcade hides itself; the game's exit callback brings it back.
 */
public class ArcadeFrame extends JFrame {

    private static final int WIDTH = 900;
    private static final int HEIGHT = 600;

    private final ArcadeHomePanel homePanel = new ArcadeHomePanel(this);
    private boolean betLifeOpen;

    public ArcadeFrame() {
        super("AP CS Arcade");
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setContentPane(homePanel);
        setSize(WIDTH, HEIGHT);
        setLocationRelativeTo(null);
    }

    /** Opens BetLife once; further clicks are ignored until the game has returned. */
    public void launchBetLife() {
        if (betLifeOpen) {
            return;
        }
        betLifeOpen = true;
        homePanel.setBetLifeEnabled(false);
        setVisible(false);
        BetLifeLauncher.launchFromArcade(this::onGameReturned);
    }

    private void onGameReturned() {
        betLifeOpen = false;
        homePanel.setBetLifeEnabled(true);
        setVisible(true);
    }
}
