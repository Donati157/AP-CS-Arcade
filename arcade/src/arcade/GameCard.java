package arcade;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.event.ActionListener;

import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JLabel;
import javax.swing.JPanel;

/**
 * One entry on the home screen: the game's name, a one-line note and a play button.
 * Games that are not ready show "Coming Soon" and a disabled button.
 */
public class GameCard extends JPanel {

    private static final Color CARD = new Color(0x2A2F3A);
    private static final Color TEXT = Color.WHITE;
    private static final Color MUTED = new Color(0x9AA3B2);

    private final JButton playButton;

    public GameCard(String title, String note, boolean available, ActionListener playAction) {
        super(new GridBagLayout());
        setBackground(CARD);
        setBorder(BorderFactory.createEmptyBorder(24, 24, 24, 24));

        JLabel titleLabel = new JLabel(title);
        titleLabel.setFont(new Font("SansSerif", Font.BOLD, 26));
        titleLabel.setForeground(TEXT);

        JLabel noteLabel = new JLabel(note);
        noteLabel.setFont(new Font("SansSerif", Font.PLAIN, 14));
        noteLabel.setForeground(MUTED);

        playButton = new JButton(available ? "PLAY" : "COMING SOON");
        playButton.setFont(new Font("SansSerif", Font.BOLD, 14));
        playButton.setPreferredSize(new Dimension(160, 40));
        playButton.setEnabled(available);
        playButton.setFocusPainted(false);
        if (available) {
            playButton.addActionListener(playAction);
        }

        GridBagConstraints constraints = new GridBagConstraints();
        constraints.gridx = 0;
        constraints.insets = new Insets(4, 0, 4, 0);
        add(titleLabel, constraints);
        add(noteLabel, constraints);
        constraints.insets = new Insets(14, 0, 0, 0);
        add(playButton, constraints);
    }

    public void setPlayEnabled(boolean enabled) {
        playButton.setEnabled(enabled);
    }
}
