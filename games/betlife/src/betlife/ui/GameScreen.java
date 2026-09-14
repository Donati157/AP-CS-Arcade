package betlife.ui;

/**
 * A screen whose contents depend on game state. The navigator calls
 * {@link #refreshFromGameState()} right before showing the screen so nothing stale is displayed.
 */
public interface GameScreen {

    void refreshFromGameState();
}
