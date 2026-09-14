package arcade;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Font;
import java.awt.GridLayout;

import javax.swing.BorderFactory;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.SwingConstants;

/**
 * The arcade home screen: a title and a 2 x 2 grid of game cards.
 * Only BetLife is playable so far; the other three games are placeholders.
 */
public class ArcadeHomePanel extends JPanel {

    private static final Color BACKGROUND = new Color(0x1B1F27);

    private final GameCard betLifeCard;

    public ArcadeHomePanel(ArcadeFrame frame) {
        super(new BorderLayout(0, 24));
        setBackground(BACKGROUND);
        setBorder(BorderFactory.createEmptyBorder(32, 40, 40, 40));

        JLabel title = new JLabel("AP CS ARCADE", SwingConstants.CENTER);
        title.setFont(new Font("SansSerif", Font.BOLD, 36));
        title.setForeground(Color.WHITE);
        add(title, BorderLayout.NORTH);

        betLifeCard = new GameCard("BETLIFE", "Life simulation", true, e -> frame.launchBetLife());

        JPanel grid = new JPanel(new GridLayout(2, 2, 20, 20));
        grid.setOpaque(false);
        grid.add(betLifeCard);
        grid.add(new GameCard("GAME 2", "Coming Soon", false, null));
        grid.add(new GameCard("GAME 3", "Coming Soon", false, null));
        grid.add(new GameCard("GAME 4", "Coming Soon", false, null));
        add(grid, BorderLayout.CENTER);
    }

    public void setBetLifeEnabled(boolean enabled) {
        betLifeCard.setPlayEnabled(enabled);
    }
}
