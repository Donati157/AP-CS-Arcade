package betlife.ui.components;

import java.awt.BorderLayout;
import java.awt.Dimension;

import javax.swing.BorderFactory;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.SwingConstants;

import betlife.ui.Theme;

/**
 * One line of a summary: a label on the left and a value on the right, with a thin divider.
 * Used for things like "Bank Balance   $1,250" or "Grade   10th Grade".
 */
public class InfoRow extends JPanel {

    private static final int HEIGHT = 40;

    private final JLabel valueLabel = new JLabel();

    public InfoRow(String label, String value) {
        super(new BorderLayout(8, 0));
        setOpaque(false);
        setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createMatteBorder(0, 0, 1, 0, Theme.DIVIDER),
                BorderFactory.createEmptyBorder(0, Theme.SCREEN_PADDING, 0, Theme.SCREEN_PADDING)));
        setPreferredSize(new Dimension(10, HEIGHT));
        setMaximumSize(new Dimension(Integer.MAX_VALUE, HEIGHT));
        setAlignmentX(LEFT_ALIGNMENT);

        JLabel nameLabel = new JLabel(label);
        nameLabel.setFont(Theme.BODY);
        nameLabel.setForeground(Theme.SECONDARY_TEXT);
        valueLabel.setFont(Theme.ROW_TITLE);
        valueLabel.setForeground(Theme.PRIMARY_TEXT);
        valueLabel.setHorizontalAlignment(SwingConstants.RIGHT);
        setValue(value);

        add(nameLabel, BorderLayout.WEST);
        add(valueLabel, BorderLayout.CENTER);
    }

    public void setValue(String value) {
        valueLabel.setText(value);
    }
}
