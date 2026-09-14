package betlife.ui.components;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Cursor;
import java.awt.Dimension;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;

import javax.swing.JButton;

import betlife.model.Relationship;
import betlife.ui.Theme;

/**
 * One person in the Relationships list: a person icon in a pale circle, the name,
 * the relationship type, a thin meter with the relationship level, and a chevron.
 * The row reads its values from the {@link Relationship} every time it paints.
 */
public class RelationshipListItem extends JButton {

    private static final int HEIGHT = 68;
    private static final int METER_WIDTH = 150;
    private static final int CHEVRON_SIZE = 8;

    private final Relationship relationship;
    private final ActivityIcon icon = new ActivityIcon(ActivityIcon.PERSON, 20, Theme.AGE_TEXT_TEAL);

    public RelationshipListItem(Relationship relationship) {
        super(relationship.getName());
        this.relationship = relationship;
        setFocusPainted(false);
        setContentAreaFilled(false);
        setBorderPainted(false);
        setOpaque(false);
        setRolloverEnabled(true);
        setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        setPreferredSize(new Dimension(10, HEIGHT));
        setMaximumSize(new Dimension(Integer.MAX_VALUE, HEIGHT));
    }

    public Relationship getRelationship() {
        return relationship;
    }

    @Override
    protected void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        int width = getWidth();
        int height = getHeight();

        g2.setColor(backgroundColor());
        g2.fillRect(0, 0, width, height);

        int badge = Theme.LIST_ICON_BADGE;
        int badgeX = Theme.SCREEN_PADDING;
        int badgeY = (height - badge) / 2;
        g2.setColor(Theme.ICON_BADGE);
        g2.fillOval(badgeX, badgeY, badge, badge);
        icon.paintIcon(this, g2, badgeX + (badge - icon.getIconWidth()) / 2,
                badgeY + (badge - icon.getIconHeight()) / 2);

        int textX = badgeX + badge + Theme.SCREEN_PADDING;
        g2.setFont(Theme.ROW_TITLE);
        FontMetrics nameMetrics = g2.getFontMetrics();
        int nameBaseline = 9 + nameMetrics.getAscent();
        g2.setColor(Theme.PRIMARY_TEXT);
        g2.drawString(relationship.getName(), textX, nameBaseline);

        g2.setFont(Theme.ROW_SUBTITLE);
        FontMetrics typeMetrics = g2.getFontMetrics();
        int typeBaseline = nameBaseline + 3 + typeMetrics.getAscent();
        g2.setColor(Theme.MUTED_TEXT);
        g2.drawString(relationship.getType(), textX, typeBaseline);

        // Meter with the level printed after it.
        int meterY = typeBaseline + 7;
        MeterPainter.paint(g2, textX, meterY, METER_WIDTH, Theme.STAT_BAR_HEIGHT - 1, relationship.getLevel());
        g2.setFont(Theme.STAT_VALUE);
        g2.setColor(Theme.MUTED_TEXT);
        g2.drawString(relationship.getLevel() + "%", textX + METER_WIDTH + 8,
                meterY + Theme.STAT_BAR_HEIGHT - 2);

        paintChevron(g2, width - Theme.SCREEN_PADDING - CHEVRON_SIZE, height / 2);
        g2.setColor(Theme.DIVIDER);
        g2.fillRect(textX, height - 1, width - textX, 1);
        g2.dispose();
    }

    private Color backgroundColor() {
        if (getModel().isArmed() && getModel().isPressed()) {
            return Theme.ROW_PRESSED;
        }
        if (getModel().isRollover()) {
            return Theme.ROW_HOVER;
        }
        return Theme.BACKGROUND;
    }

    private static void paintChevron(Graphics2D g2, int x, int centerY) {
        g2.setColor(Theme.MUTED_TEXT);
        g2.setStroke(new BasicStroke(2f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        g2.drawLine(x, centerY - CHEVRON_SIZE / 2 - 1, x + CHEVRON_SIZE / 2, centerY);
        g2.drawLine(x + CHEVRON_SIZE / 2, centerY, x, centerY + CHEVRON_SIZE / 2 + 1);
    }
}
