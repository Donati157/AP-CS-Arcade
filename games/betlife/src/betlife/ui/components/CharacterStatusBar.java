package betlife.ui.components;

import java.awt.BorderLayout;
import java.awt.Dimension;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.SwingConstants;

import betlife.model.Player;
import betlife.ui.Theme;

/**
 * Compact full-width strip under the header: avatar, name and occupation on the left,
 * bank balance hard right. Call {@link #refresh(Player)} after the player changes.
 */
public class CharacterStatusBar extends JPanel {

    private final JLabel nameLabel = new JLabel();
    private final JLabel occupationLabel = new JLabel();
    private final JLabel moneyLabel = new JLabel();

    public CharacterStatusBar(Player player) {
        super(new BorderLayout(10, 0));
        setBackground(Theme.STATUS_STRIP);
        setPreferredSize(new Dimension(10, Theme.STATUS_BAR_HEIGHT));
        setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createMatteBorder(0, 0, 1, 0, Theme.DIVIDER),
                BorderFactory.createEmptyBorder(0, Theme.SCREEN_PADDING, 0, Theme.SCREEN_PADDING)));

        add(new Avatar(), BorderLayout.WEST);
        add(createIdentityColumn(), BorderLayout.CENTER);
        add(createMoneyColumn(), BorderLayout.EAST);
        refresh(player);
    }

    private JComponent createIdentityColumn() {
        nameLabel.setFont(Theme.NAME);
        nameLabel.setForeground(Theme.PLAYER_NAME_TEAL);
        occupationLabel.setFont(Theme.OCCUPATION);
        occupationLabel.setForeground(Theme.SECONDARY_TEXT);
        return verticalColumn(nameLabel, occupationLabel, JLabel.LEFT_ALIGNMENT);
    }

    private JComponent createMoneyColumn() {
        moneyLabel.setFont(Theme.MONEY);
        moneyLabel.setForeground(Theme.PRIMARY_TEXT);
        JLabel caption = new JLabel("Bank Balance");
        caption.setFont(Theme.CAPTION);
        caption.setForeground(Theme.MUTED_TEXT);
        return verticalColumn(moneyLabel, caption, JLabel.RIGHT_ALIGNMENT);
    }

    /** Two labels stacked and vertically centered, aligned to one side. */
    private static JComponent verticalColumn(JLabel top, JLabel bottom, float alignment) {
        top.setAlignmentX(alignment);
        bottom.setAlignmentX(alignment);
        top.setHorizontalAlignment(alignment == JLabel.RIGHT_ALIGNMENT
                ? SwingConstants.RIGHT : SwingConstants.LEFT);
        bottom.setHorizontalAlignment(top.getHorizontalAlignment());

        JPanel column = new JPanel();
        column.setLayout(new BoxLayout(column, BoxLayout.Y_AXIS));
        column.setOpaque(false);
        column.add(Box.createVerticalGlue());
        column.add(top);
        column.add(Box.createVerticalStrut(1));
        column.add(bottom);
        column.add(Box.createVerticalGlue());
        return column;
    }

    public void refresh(Player player) {
        nameLabel.setText(player.getName());
        occupationLabel.setText(player.getOccupation());
        moneyLabel.setText(MoneyFormat.format(player.getMoney()));
    }
}
