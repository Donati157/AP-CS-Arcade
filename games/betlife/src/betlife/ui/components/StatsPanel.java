package betlife.ui.components;

import java.awt.Dimension;
import java.awt.GridLayout;

import javax.swing.BorderFactory;
import javax.swing.JPanel;

import betlife.model.Player;
import betlife.ui.Theme;

/**
 * Compact block of four stat rows at the bottom of the screen.
 * Call {@link #refresh(Player)} whenever the player's stats change.
 */
public class StatsPanel extends JPanel {

    private final StatBar happinessBar;
    private final StatBar healthBar;
    private final StatBar smartsBar;
    private final StatBar looksBar;

    public StatsPanel(Player player) {
        super(new GridLayout(4, 1, 0, 0));
        setBackground(Theme.BACKGROUND);
        setPreferredSize(new Dimension(10, Theme.STATS_HEIGHT));
        setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createMatteBorder(1, 0, 0, 0, Theme.DIVIDER),
                BorderFactory.createEmptyBorder(4, Theme.SCREEN_PADDING, 4, Theme.SCREEN_PADDING)));

        happinessBar = new StatBar("Happiness", StatIcon.SMILE, Theme.HAPPINESS, player.getHappiness());
        healthBar = new StatBar("Health", StatIcon.HEART, Theme.HEALTH, player.getHealth());
        smartsBar = new StatBar("Smarts", StatIcon.LIGHTBULB, Theme.SMARTS, player.getSmarts());
        looksBar = new StatBar("Looks", StatIcon.SPARKLE, Theme.LOOKS, player.getLooks());

        add(happinessBar);
        add(healthBar);
        add(smartsBar);
        add(looksBar);
    }

    /** Re-reads every stat from the player and updates the bars. */
    public void refresh(Player player) {
        happinessBar.setValue(player.getHappiness());
        healthBar.setValue(player.getHealth());
        smartsBar.setValue(player.getSmarts());
        looksBar.setValue(player.getLooks());
    }
}
