package betlife.ui.components;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;

import javax.swing.Icon;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.SwingConstants;

import betlife.model.Player;
import betlife.ui.Theme;

/**
 * One compact stat row: "label | colored indicator | progress bar | percentage".
 * Reused for happiness, health, smarts and looks.
 */
public class StatBar extends JPanel {

    private static final int LABEL_WIDTH = 92;
    private static final int VALUE_WIDTH = 36;

    private final JLabel valueLabel = new JLabel();
    private int value;

    /** Row with a colored stat symbol, as used on the main screen. */
    public StatBar(String statName, String iconKind, Color indicatorColor, int initialValue) {
        this(statName, new StatIcon(iconKind, indicatorColor), initialValue);
    }

    /** Plain row without a symbol, for summaries on other screens. */
    public StatBar(String statName, int initialValue) {
        this(statName, null, initialValue);
    }

    private StatBar(String statName, Icon icon, int initialValue) {
        super(new BorderLayout(8, 0));
        setOpaque(false);

        JLabel nameLabel = new JLabel(statName, icon, SwingConstants.LEFT);
        nameLabel.setHorizontalTextPosition(SwingConstants.RIGHT);
        nameLabel.setIconTextGap(7);
        nameLabel.setFont(Theme.STAT_LABEL);
        nameLabel.setForeground(Theme.PRIMARY_TEXT);
        nameLabel.setPreferredSize(new Dimension(LABEL_WIDTH, Theme.STAT_BAR_HEIGHT + 6));

        valueLabel.setFont(Theme.STAT_VALUE);
        valueLabel.setForeground(Theme.MUTED_TEXT);
        valueLabel.setHorizontalAlignment(SwingConstants.RIGHT);
        valueLabel.setPreferredSize(new Dimension(VALUE_WIDTH, Theme.STAT_BAR_HEIGHT + 6));

        add(nameLabel, BorderLayout.WEST);
        add(new Track(), BorderLayout.CENTER);
        add(valueLabel, BorderLayout.EAST);
        setValue(initialValue);
    }

    public void setValue(int newValue) {
        value = Math.max(Player.MIN_STAT, Math.min(Player.MAX_STAT, newValue));
        valueLabel.setText(value + "%");
        repaint();
    }

    public int getValue() {
        return value;
    }

    /** Grey track with a green fill proportional to the value. */
    private class Track extends JComponent {

        @Override
        protected void paintComponent(Graphics g) {
            Graphics2D g2 = (Graphics2D) g.create();
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            int barHeight = Theme.STAT_BAR_HEIGHT;
            int top = (getHeight() - barHeight) / 2;
            MeterPainter.paint(g2, 0, top, getWidth(), barHeight, value);
            g2.dispose();
        }
    }
}
